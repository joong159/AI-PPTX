import pptxgen from 'pptxgenjs'
import type { Presentation, Slide } from './types'

const ACCENT = '#4F46E5'
const BG = '#F8F9FF'
const TXT = '#1e293b'

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function addSlide(prs: pptxgen, slide: Slide, accent: string) {
  const s = prs.addSlide()
  s.background = { color: BG.replace('#', '') }

  const acc = accent.replace('#', '')
  const { slide_type: stype, title, bullets = [], key_takeaway } = slide

  if (stype === 'section_header') {
    s.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: acc } })
    s.addText(title || '', { x: 0.5, y: 1.5, w: 9, h: 1.5, fontSize: 36, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })
    s.addText(slide.summary || '', { x: 0.5, y: 3.2, w: 9, h: 1, fontSize: 18, color: 'FFFFFFCC', align: 'center' })
    return
  }

  // Header bar
  s.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.1, fill: { color: acc } })
  s.addText(title || '', { x: 0.3, y: 0, w: 9.4, h: 1.1, fontSize: 22, bold: true, color: 'FFFFFF', valign: 'middle' })

  // Key takeaway bar
  if (key_takeaway) {
    s.addShape(prs.ShapeType.rect, { x: 0, y: 6.8, w: '100%', h: 0.65, fill: { color: acc + '22' } })
    s.addText(`💡 ${key_takeaway}`, { x: 0.3, y: 6.8, w: 9.4, h: 0.65, fontSize: 11, color: '555555', valign: 'middle' })
  }

  const contentY = 1.3
  const contentH = 5.3

  if (stype === 'big_stat') {
    s.addText(slide.stat_value || '0', { x: 0.4, y: contentY, w: 9.2, h: 1.6, fontSize: 72, bold: true, color: acc, valign: 'top' })
    s.addText(slide.stat_description || '', { x: 0.4, y: contentY + 1.7, w: 9.2, h: 0.7, fontSize: 16, color: '888888' })
    bullets.forEach((b, i) => {
      s.addText(`• ${b}`, { x: 0.4, y: contentY + 2.6 + i * 0.55, w: 9.2, h: 0.5, fontSize: 14, color: TXT.replace('#', '') })
    })

  } else if (stype === 'three_cards') {
    const cards = (slide.cards || []).slice(0, 3)
    cards.forEach((c, k) => {
      const x = 0.3 + k * 3.2
      s.addShape(prs.ShapeType.roundRect, { x, y: contentY, w: 3.0, h: contentH, fill: { color: acc + '18' }, line: { color: acc + '33', width: 1 }, rectRadius: 0.1 })
      s.addText(c.card_title || '', { x: x + 0.15, y: contentY + 0.2, w: 2.7, h: 0.7, fontSize: 16, bold: true, color: acc })
      s.addText(c.card_content || '', { x: x + 0.15, y: contentY + 1.0, w: 2.7, h: 4.0, fontSize: 13, color: TXT.replace('#', ''), valign: 'top', wrap: true })
    })

  } else if (stype === 'timeline') {
    const steps = (slide.timeline_steps || []).slice(0, 4)
    steps.forEach((st, k) => {
      const y = contentY + k * 1.25
      s.addShape(prs.ShapeType.ellipse, { x: 0.3, y: y, w: 0.5, h: 0.5, fill: { color: acc } })
      s.addText(String(k + 1), { x: 0.3, y: y, w: 0.5, h: 0.5, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })
      s.addText(st.step_title || '', { x: 1.0, y: y, w: 8.5, h: 0.45, fontSize: 16, bold: true, color: TXT.replace('#', '') })
      s.addText(st.step_desc || '', { x: 1.0, y: y + 0.47, w: 8.5, h: 0.6, fontSize: 13, color: '888888' })
    })

  } else if (stype === 'two_column') {
    const half = Math.ceil(bullets.length / 2)
    const left = bullets.slice(0, half)
    const right = bullets.slice(half)
    left.forEach((b, i) => {
      s.addText(`• ${b}`, { x: 0.3, y: contentY + i * 0.75, w: 4.5, h: 0.65, fontSize: 14, color: TXT.replace('#', ''), wrap: true })
    })
    right.forEach((b, i) => {
      s.addText(`• ${b}`, { x: 5.1, y: contentY + i * 0.75, w: 4.5, h: 0.65, fontSize: 14, color: TXT.replace('#', ''), wrap: true })
    })

  } else {
    bullets.forEach((b, i) => {
      s.addShape(prs.ShapeType.ellipse, { x: 0.3, y: contentY + i * 0.82 + 0.12, w: 0.13, h: 0.13, fill: { color: acc } })
      s.addText(b, { x: 0.6, y: contentY + i * 0.82, w: 9.0, h: 0.72, fontSize: 15, color: TXT.replace('#', ''), valign: 'middle', wrap: true })
    })
  }
}

export async function exportPptx(presentation: Presentation): Promise<void> {
  const prs = new pptxgen()
  prs.layout = 'LAYOUT_WIDE'

  const accent = presentation.accent_color || ACCENT

  for (const slide of presentation.slides) {
    addSlide(prs, slide, accent)
  }

  const filename = (presentation.title || 'presentation').replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim() || 'presentation'
  await prs.writeFile({ fileName: `${filename}.pptx` })
}
