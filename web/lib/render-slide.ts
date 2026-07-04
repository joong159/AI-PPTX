import type { Slide } from './types'
import { buildFabricObjects, CANVAS_W, CANVAS_H } from './slide-to-fabric'
import { HTML_TEMPLATES, buildRenderedHtml, buildBackgroundOnlyHtml } from './html-templates'

export async function renderSlideToDataUrl(
  slide: Slide,
  accent: string,
  bg: string,
  multiplier = 1,
): Promise<string> {
  if (slide.templateId) {
    return renderHtmlTemplateSlide(slide, multiplier)
  }
  return renderFabricSlide(slide, accent, bg, multiplier)
}

// ─── HTML template → html2canvas → PNG ───────────────────────────────────────
async function renderHtmlTemplateSlide(slide: Slide, multiplier = 1): Promise<string> {
  const template = HTML_TEMPLATES.find(t => t.id === slide.templateId)
  if (!template) return renderFabricSlide(slide, '#4f46e5', '#ffffff', multiplier)

  // Build the complete HTML: background + zone text overlays
  const filledHtml = buildRenderedHtml(template, slide)

  const container = document.createElement('div')
  container.style.cssText = `position:fixed;left:-99999px;top:0;width:1280px;height:720px;overflow:hidden;`
  container.innerHTML = filledHtml
  document.body.appendChild(container)

  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(container, {
      width: CANVAS_W,
      height: CANVAS_H,
      scale: multiplier,
      useCORS: true,
      logging: false,
      backgroundColor: null,
    })
    return canvas.toDataURL('image/png')
  } finally {
    if (document.body.contains(container)) document.body.removeChild(container)
  }
}

// ─── HTML template background only (no text) → PNG, for native-text PPTX export ─
export async function renderTemplateBackgroundToDataUrl(templateId: string, multiplier = 2): Promise<string | null> {
  const template = HTML_TEMPLATES.find(t => t.id === templateId)
  if (!template) return null

  const container = document.createElement('div')
  container.style.cssText = `position:fixed;left:-99999px;top:0;width:1280px;height:720px;overflow:hidden;`
  container.innerHTML = buildBackgroundOnlyHtml(template)
  document.body.appendChild(container)

  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(container, {
      width: CANVAS_W,
      height: CANVAS_H,
      scale: multiplier,
      useCORS: true,
      logging: false,
      backgroundColor: null,
    })
    return canvas.toDataURL('image/png')
  } finally {
    if (document.body.contains(container)) document.body.removeChild(container)
  }
}

// ─── Fabric.js object graph (for native-text PPTX export) ────────────────────
export async function getSlideFabricObjects(
  slide: Slide,
  accent: string,
  bg: string,
): Promise<{ objects: any[]; dispose: () => void }> {
  const fab = await import('fabric')
  const { Canvas } = fab

  const el = document.createElement('canvas')
  el.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;'
  document.body.appendChild(el)

  const canvas = new Canvas(el, {
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: bg || '#F8F9FF',
    enableRetinaScaling: false,
    renderOnAddRemove: false,
  })

  if (slide.fabricState) {
    await canvas.loadFromJSON(JSON.parse(slide.fabricState))
  } else {
    const objs = buildFabricObjects(fab, slide, accent, bg || '#F8F9FF')
    objs.forEach((o: any) => canvas.add(o))
  }
  canvas.renderAll()

  const objects = canvas.getObjects()
  const dispose = () => {
    canvas.dispose()
    if (document.body.contains(el)) document.body.removeChild(el)
  }
  return { objects, dispose }
}

// ─── Fabric.js canvas → PNG (existing path) ──────────────────────────────────
async function renderFabricSlide(slide: Slide, accent: string, bg: string, multiplier = 1): Promise<string> {
  const fab = await import('fabric')
  const { Canvas } = fab

  const el = document.createElement('canvas')
  el.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;'
  document.body.appendChild(el)

  try {
    const canvas = new Canvas(el, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: bg || '#F8F9FF',
      enableRetinaScaling: false,
      renderOnAddRemove: false,
    })

    if (slide.fabricState) {
      await canvas.loadFromJSON(JSON.parse(slide.fabricState))
    } else {
      const objs = buildFabricObjects(fab, slide, accent, bg || '#F8F9FF')
      objs.forEach((o: any) => canvas.add(o))
    }

    canvas.renderAll()
    await new Promise<void>(resolve => requestAnimationFrame(() => { canvas.renderAll(); resolve() }))

    const dataUrl = canvas.toDataURL({ format: 'png', multiplier })
    canvas.dispose()
    return dataUrl
  } finally {
    if (document.body.contains(el)) document.body.removeChild(el)
  }
}
