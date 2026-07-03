import type { Presentation } from './types'
import type { DesignSettings } from './design-settings'
import { getPalette, DEFAULT_DESIGN } from './design-settings'
import { renderSlideToDataUrl } from './render-slide'

const DEFAULT_ACCENT = '#4F46E5'
const DEFAULT_BG = '#F8F9FF'

export async function exportPdf(presentation: Presentation, design?: DesignSettings): Promise<void> {
  const { default: jsPDF } = await import('jspdf')

  const d = design || DEFAULT_DESIGN
  const palette = getPalette(d.paletteId)
  const accent = d.accentColor || palette.accent || DEFAULT_ACCENT
  const bg = d.bgColor || DEFAULT_BG

  // 16:9 landscape in mm (297 × 167)
  const W = 297, H = 167
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [W, H] })

  for (let i = 0; i < presentation.slides.length; i++) {
    if (i > 0) pdf.addPage([W, H], 'landscape')
    try {
      const imgData = await renderSlideToDataUrl(presentation.slides[i], accent, bg, 1.5)
      pdf.addImage(imgData, 'PNG', 0, 0, W, H)
    } catch {
      pdf.setFillColor(bg)
      pdf.rect(0, 0, W, H, 'F')
      pdf.setFontSize(18)
      pdf.setTextColor(accent)
      pdf.text(presentation.slides[i].title || '', 10, 20)
    }
  }

  const filename = (presentation.title || 'presentation')
    .replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim() || 'presentation'
  pdf.save(`${filename}.pdf`)
}
