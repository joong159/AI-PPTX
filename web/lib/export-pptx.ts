import pptxgen from 'pptxgenjs'
import type { Presentation } from './types'
import type { DesignSettings } from './design-settings'
import { getPalette, DEFAULT_DESIGN } from './design-settings'
import { renderTemplateBackgroundToDataUrl, getSlideFabricObjects } from './render-slide'
import { HTML_TEMPLATES } from './html-templates'
import { addFabricObjectsToSlide, addTemplateZonesToSlide } from './pptx-native'

const DEFAULT_ACCENT = '#4F46E5'
const DEFAULT_BG = '#F8F9FF'
const CANVAS_W = 1280
const CANVAS_H = 720

export async function exportPptx(presentation: Presentation, design?: DesignSettings): Promise<void> {
  const d = design || DEFAULT_DESIGN
  const palette = getPalette(d.paletteId)
  const accent = d.accentColor || palette.accent || presentation.accent_color || DEFAULT_ACCENT
  const bg = d.bgColor || palette.bg || DEFAULT_BG

  const prs = new pptxgen()

  let layoutW = 13.333
  let layoutH = 7.5
  if (d.size === '4:3') {
    prs.defineLayout({ name: 'CUSTOM_4x3', width: 10, height: 7.5 })
    prs.layout = 'CUSTOM_4x3'
    layoutW = 10; layoutH = 7.5
  } else if (d.size === 'A4') {
    prs.defineLayout({ name: 'CUSTOM_A4', width: 8.27, height: 11.69 })
    prs.layout = 'CUSTOM_A4'
    layoutW = 8.27; layoutH = 11.69
  } else {
    prs.layout = 'LAYOUT_WIDE'   // 13.33" × 7.5" (16:9)
  }

  // px (1280×720 design canvas) -> inches, at the chosen output layout size
  const scale = { x: layoutW / CANVAS_W, y: layoutH / CANVAS_H }

  for (const slide of presentation.slides) {
    const s = prs.addSlide()
    try {
      if (slide.templateId) {
        // Background art (gradients/blur/organic shapes) stays a raster image —
        // title/summary/bullets/stat are real, editable text boxes on top of it.
        const template = HTML_TEMPLATES.find(t => t.id === slide.templateId)
        if (!template) throw new Error(`Unknown templateId: ${slide.templateId}`)
        const bgData = await renderTemplateBackgroundToDataUrl(slide.templateId, 2)
        if (bgData) s.addImage({ data: bgData, x: 0, y: 0, w: '100%', h: '100%' })
        await addTemplateZonesToSlide(s, template, slide, scale)
      } else {
        // Fabric.js canvas (AI default layout or user-edited): convert each object
        // to a native pptx text box / shape instead of flattening to one picture.
        const { objects, dispose } = await getSlideFabricObjects(slide, accent, bg || DEFAULT_BG)
        try {
          addFabricObjectsToSlide(s, objects, scale)
        } finally {
          dispose()
        }
      }
    } catch (err) {
      console.error('Slide render error:', err)
      // Fallback: plain slide with title
      s.background = { color: bg.replace('#', '') }
      s.addText(slide.title || '', {
        x: 0.3, y: 0.3, w: 9.4, h: 0.9,
        fontSize: 24, bold: true, color: accent.replace('#', ''),
      })
    }
  }

  const filename = (presentation.title || 'presentation')
    .replace(/[^a-zA-Z0-9가-힣\s]/g, '')
    .trim() || 'presentation'
  await prs.writeFile({ fileName: `${filename}.pptx` })
}
