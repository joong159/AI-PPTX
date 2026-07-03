import pptxgen from 'pptxgenjs'
import type { Presentation, Slide } from './types'
import type { DesignSettings } from './design-settings'
import { getPalette, DEFAULT_DESIGN } from './design-settings'
import { buildFabricObjects, CANVAS_W, CANVAS_H } from './slide-to-fabric'

const DEFAULT_ACCENT = '#4F46E5'
const DEFAULT_BG = '#F8F9FF'

// Render a slide off-screen using fabric.StaticCanvas → PNG data URL.
async function renderSlideToImage(slide: Slide, accent: string, bg: string): Promise<string> {
  const fab = await import('fabric')
  const { StaticCanvas } = fab

  const el = document.createElement('canvas')
  const canvas = new StaticCanvas(el, { width: CANVAS_W, height: CANVAS_H })

  if (slide.fabricState) {
    await canvas.loadFromJSON(JSON.parse(slide.fabricState))
    canvas.renderAll()
  } else {
    canvas.backgroundColor = bg
    const objs = buildFabricObjects(fab, slide, accent, bg)
    objs.forEach((o: any) => canvas.add(o))
    canvas.renderAll()
  }

  const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 })
  canvas.dispose()
  return dataUrl
}

export async function exportPptx(presentation: Presentation, design?: DesignSettings): Promise<void> {
  const d = design || DEFAULT_DESIGN
  const palette = getPalette(d.paletteId)
  const accent = d.accentColor || palette.accent || presentation.accent_color || DEFAULT_ACCENT
  const bg = d.bgColor || palette.bg || DEFAULT_BG

  const prs = new pptxgen()

  if (d.size === '4:3') {
    prs.defineLayout({ name: 'CUSTOM_4x3', width: 10, height: 7.5 })
    prs.layout = 'CUSTOM_4x3'
  } else if (d.size === 'A4') {
    prs.defineLayout({ name: 'CUSTOM_A4', width: 8.27, height: 11.69 })
    prs.layout = 'CUSTOM_A4'
  } else {
    prs.layout = 'LAYOUT_WIDE'
  }

  for (const slide of presentation.slides) {
    const s = prs.addSlide()
    try {
      const imgData = await renderSlideToImage(slide, accent, bg)
      s.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' })
    } catch (err) {
      console.error('Slide render error:', err)
      s.background = { color: bg.replace('#', '') }
      s.addText(slide.title || '', {
        x: 0.3, y: 0.1, w: 9.4, h: 0.9,
        fontSize: 22, bold: true, color: accent.replace('#', ''),
      })
    }
  }

  const filename = (presentation.title || 'presentation').replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim() || 'presentation'
  await prs.writeFile({ fileName: `${filename}.pptx` })
}
