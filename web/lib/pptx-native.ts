// Converts Fabric.js canvas objects and HTML-template zones into native, editable
// pptxgenjs elements (real text boxes / shapes) instead of one flattened slide image.
import type { HtmlTemplate } from './html-templates'
import { getZoneText } from './html-templates'
import type { Slide } from './types'

const PT_PER_IN = 72

// px(1280x720 canvas) -> inches, at the presentation's chosen layout size
export interface PxScale {
  x: number
  y: number
}

export function parseColor(input?: string): { color: string; transparency: number } {
  if (!input) return { color: '000000', transparency: 100 }
  const s = String(input).trim()

  const rgba = s.match(/^rgba?\(([^)]+)\)$/i)
  if (rgba) {
    const parts = rgba[1].split(',').map(p => p.trim())
    const [r, g, b] = parts
    const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1
    const hex = [r, g, b]
      .map(v => Math.max(0, Math.min(255, Math.round(Number(v)))).toString(16).padStart(2, '0'))
      .join('')
    return { color: hex.toUpperCase(), transparency: Math.round((1 - a) * 100) }
  }

  const hex = s.replace('#', '')
  if (hex.length === 8) {
    return {
      color: hex.slice(0, 6).toUpperCase(),
      transparency: Math.round((1 - parseInt(hex.slice(6, 8), 16) / 255) * 100),
    }
  }
  if (hex.length === 3) {
    return { color: hex.split('').map(c => c + c).join('').toUpperCase(), transparency: 0 }
  }
  if (hex.length === 6 && /^[0-9a-f]{6}$/i.test(hex)) {
    return { color: hex.toUpperCase(), transparency: 0 }
  }
  return { color: '000000', transparency: 0 }
}

function fontFace(fontFamily?: string): string {
  return (fontFamily || 'Arial').split(',')[0].replace(/['"]/g, '').trim() || 'Arial'
}

function hAlign(align?: string): 'left' | 'center' | 'right' {
  return align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'
}

// Rasterize an unsupported/complex object (image, icon path, group) to a PNG and
// place it at its absolute bounding box — degrades gracefully without flattening
// the rest of the slide.
function rasterizeObject(obj: any, scale: PxScale, pptxSlide: any) {
  const rect = obj.getBoundingRect(true, true)
  if (!rect || rect.width <= 0 || rect.height <= 0) return
  let dataUrl: string
  try {
    dataUrl = obj.toDataURL({ format: 'png', multiplier: 2 })
  } catch {
    return
  }
  pptxSlide.addImage({
    data: dataUrl,
    x: rect.left * scale.x,
    y: rect.top * scale.y,
    w: rect.width * scale.x,
    h: rect.height * scale.y,
  })
}

export function addFabricObjectsToSlide(pptxSlide: any, objects: any[], scale: PxScale) {
  const fontScale = (scale.x + scale.y) / 2

  for (const obj of objects) {
    if (obj.visible === false) continue
    const role = obj.data?.role
    const type = obj.type
    const objScaleX = obj.scaleX ?? 1
    const objScaleY = obj.scaleY ?? 1
    const rotate = obj.angle ? Math.round(obj.angle) : 0

    if (role === 'bg' && type === 'rect') {
      const { color } = parseColor(obj.fill)
      pptxSlide.background = { color }
      continue
    }

    if (type === 'rect') {
      const { color, transparency } = parseColor(obj.fill)
      const hasStroke = !!obj.stroke && (obj.strokeWidth || 0) > 0
      pptxSlide.addShape('rect', {
        x: obj.left * scale.x,
        y: obj.top * scale.y,
        w: obj.width * objScaleX * scale.x,
        h: obj.height * objScaleY * scale.y,
        rotate,
        fill: obj.fill ? { color, transparency } : { type: 'none' },
        line: hasStroke
          ? { color: parseColor(obj.stroke).color, width: Math.max(0.25, (obj.strokeWidth || 1) * fontScale * PT_PER_IN) }
          : { type: 'none' },
      })
      continue
    }

    if (type === 'triangle') {
      const { color, transparency } = parseColor(obj.fill)
      pptxSlide.addShape('triangle', {
        x: obj.left * scale.x,
        y: obj.top * scale.y,
        w: obj.width * objScaleX * scale.x,
        h: obj.height * objScaleY * scale.y,
        rotate,
        fill: obj.fill ? { color, transparency } : { type: 'none' },
      })
      continue
    }

    if (type === 'circle') {
      const r = obj.radius * objScaleX
      const { color, transparency } = parseColor(obj.fill)
      const hasStroke = !!obj.stroke && (obj.strokeWidth || 0) > 0
      pptxSlide.addShape('ellipse', {
        x: obj.left * scale.x,
        y: obj.top * scale.y,
        w: r * 2 * scale.x,
        h: r * 2 * scale.y,
        fill: obj.fill ? { color, transparency } : { type: 'none' },
        line: hasStroke
          ? { color: parseColor(obj.stroke).color, width: Math.max(0.25, (obj.strokeWidth || 1) * fontScale * PT_PER_IN) }
          : { type: 'none' },
      })
      continue
    }

    if (type === 'line') {
      const { color } = parseColor(obj.stroke || '#000000')
      pptxSlide.addShape('line', {
        x: obj.left * scale.x,
        y: obj.top * scale.y,
        w: obj.width * objScaleX * scale.x,
        h: obj.height * objScaleY * scale.y,
        line: { color, width: Math.max(0.25, (obj.strokeWidth || 1) * fontScale * PT_PER_IN) },
      })
      continue
    }

    if (type === 'textbox' || type === 'i-text' || type === 'text') {
      const text = obj.text || ''
      if (!text) continue
      const { color } = parseColor(obj.fill || '#000000')
      const fontSizePx = obj.fontSize || 20
      pptxSlide.addText(text, {
        x: obj.left * scale.x,
        y: obj.top * scale.y,
        w: obj.width * objScaleX * scale.x,
        h: obj.height * objScaleY * scale.y,
        rotate,
        fontSize: Math.max(6, Math.round(fontSizePx * fontScale * PT_PER_IN)),
        color,
        bold: obj.fontWeight === 'bold' || Number(obj.fontWeight) >= 600,
        italic: obj.fontStyle === 'italic',
        align: hAlign(obj.textAlign),
        fontFace: fontFace(obj.fontFamily),
        valign: 'top',
        margin: 0,
        wrap: true,
      })
      continue
    }

    // image / icon path / group / anything else unsupported: rasterize just this object
    rasterizeObject(obj, scale, pptxSlide)
  }
}

export function addTemplateZonesToSlide(pptxSlide: any, template: HtmlTemplate, slide: Slide, scale: PxScale) {
  const fontScale = (scale.x + scale.y) / 2
  for (const zone of template.zones) {
    const text = getZoneText(zone.id, slide)
    if (!text) continue
    const { color } = parseColor(zone.color)
    pptxSlide.addText(text, {
      x: zone.x * scale.x,
      y: zone.y * scale.y,
      w: zone.w * scale.x,
      h: zone.h * scale.y,
      fontSize: Math.max(6, Math.round(zone.fontSize * fontScale * PT_PER_IN)),
      color,
      bold: zone.fontWeight === 'bold',
      align: hAlign(zone.textAlign),
      fontFace: fontFace(zone.fontFamily),
      valign: 'top',
      margin: 0,
      wrap: true,
    })
  }
}
