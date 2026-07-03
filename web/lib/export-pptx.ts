import pptxgen from 'pptxgenjs'
import type { Presentation } from './types'
import type { DesignSettings } from './design-settings'
import { getPalette, DEFAULT_DESIGN } from './design-settings'
import { renderSlideToDataUrl } from './render-slide'

const DEFAULT_ACCENT = '#4F46E5'
const DEFAULT_BG = '#F8F9FF'

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
    prs.layout = 'LAYOUT_WIDE'   // 13.33" × 7.5" (16:9)
  }

  for (const slide of presentation.slides) {
    const s = prs.addSlide()
    try {
      // multiplier: 2 gives 2x resolution (2560×1440) for sharper PPTX
      const imgData = await renderSlideToDataUrl(slide, accent, bg, 2)
      s.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' })
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
