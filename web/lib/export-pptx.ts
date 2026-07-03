import pptxgen from 'pptxgenjs'
import type { Presentation, Slide } from './types'
import type { DesignSettings } from './design-settings'
import { getPalette, DEFAULT_DESIGN } from './design-settings'

const DEFAULT_ACCENT = '#4F46E5'
const DEFAULT_BG = '#F8F9FF'
const DEFAULT_TXT = '#1e293b'

const FONT_MAP: Record<string, string> = {
  sans:  'Calibri',
  serif: 'Georgia',
  mono:  'Courier New',
  round: 'Trebuchet MS',
}

function addSlide(prs: pptxgen, slide: Slide, acc: string, bg: string, txt: string, font: string) {
  const s = prs.addSlide()
  s.background = { color: bg.replace('#', '') }

  const accHex = acc.replace('#', '')
  const txtHex = txt.replace('#', '')
  const { slide_type: stype, title, bullets = [], key_takeaway } = slide

  // ── SECTION HEADER ──
  if (stype === 'section_header') {
    s.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: accHex } })
    // Decorative circle
    s.addShape(prs.ShapeType.ellipse, { x: 8.5, y: -1, w: 4, h: 4, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF', width: 0 } })
    s.addText(title || '', { x: 0.5, y: 1.8, w: 9, h: 1.8, fontSize: 38, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: font })
    s.addShape(prs.ShapeType.rect, { x: 4, y: 3.8, w: 2, h: 0.06, fill: { color: 'FFFFFF' } })
    s.addText(slide.summary || '', { x: 0.5, y: 4.1, w: 9, h: 0.8, fontSize: 17, color: 'FFFFFFCC', align: 'center', fontFace: font })
    return
  }

  // ── QUOTE SLIDE ──
  if (stype === 'quote_slide') {
    s.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: accHex + '10' } })
    s.addShape(prs.ShapeType.rect, { x: 0.4, y: 1.5, w: 0.12, h: 4, fill: { color: accHex } })
    s.addText('“', { x: 0.5, y: 0.2, w: 3, h: 2, fontSize: 100, bold: true, color: accHex + '25', fontFace: 'Georgia' })
    s.addText(title || '', { x: 0.8, y: 1.8, w: 8, h: 2.8, fontSize: 26, bold: true, color: txtHex, valign: 'middle', wrap: true, fontFace: font })
    s.addShape(prs.ShapeType.rect, { x: 3.5, y: 4.9, w: 3, h: 0.05, fill: { color: accHex } })
    s.addText(slide.summary || '', { x: 0.8, y: 5.1, w: 8.5, h: 0.6, fontSize: 16, color: accHex, align: 'center', italic: true, fontFace: font })
    return
  }

  // ── COMMON HEADER for remaining types ──
  s.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.1, fill: { color: accHex } })
  s.addText(title || '', { x: 0.3, y: 0, w: 9.4, h: 1.1, fontSize: 22, bold: true, color: 'FFFFFF', valign: 'middle', fontFace: font })

  // Key takeaway bar at bottom
  const kwY = 6.8
  if (key_takeaway) {
    s.addShape(prs.ShapeType.rect, { x: 0, y: kwY, w: '100%', h: 0.65, fill: { color: accHex + '18' } })
    s.addText(`💡 ${key_takeaway}`, { x: 0.3, y: kwY, w: 9.4, h: 0.65, fontSize: 11, color: '555555', valign: 'middle', fontFace: font })
  }

  const contentY = 1.3
  const contentH = key_takeaway ? 5.3 : 5.9

  // ── BIG STAT ──
  if (stype === 'big_stat') {
    s.addText(slide.stat_value || '0', { x: 0.4, y: contentY, w: 9.2, h: 1.8, fontSize: 80, bold: true, color: accHex, valign: 'top', fontFace: font })
    s.addShape(prs.ShapeType.rect, { x: 0.4, y: contentY + 1.9, w: 1.5, h: 0.06, fill: { color: accHex } })
    s.addText(slide.stat_description || '', { x: 0.4, y: contentY + 2.1, w: 9.2, h: 0.7, fontSize: 17, color: '777777', fontFace: font })
    bullets.slice(0, 4).forEach((b, i) => {
      s.addShape(prs.ShapeType.ellipse, { x: 0.4, y: contentY + 3.0 + i * 0.58 + 0.1, w: 0.12, h: 0.12, fill: { color: accHex } })
      s.addText(b, { x: 0.65, y: contentY + 3.0 + i * 0.58, w: 9.0, h: 0.52, fontSize: 14, color: txtHex, valign: 'middle', wrap: true, fontFace: font })
    })

  // ── THREE CARDS ──
  } else if (stype === 'three_cards') {
    const cards = (slide.cards || []).slice(0, 3)
    cards.forEach((c, k) => {
      const x = 0.3 + k * 3.17
      s.addShape(prs.ShapeType.roundRect, { x, y: contentY, w: 3.0, h: contentH, fill: { color: accHex + '12' }, line: { color: accHex + '30', width: 1 }, rectRadius: 0.1 })
      s.addShape(prs.ShapeType.rect, { x, y: contentY, w: 3.0, h: 0.07, fill: { color: accHex } })
      s.addShape(prs.ShapeType.ellipse, { x: x + 0.15, y: contentY + 0.2, w: 0.45, h: 0.45, fill: { color: accHex } })
      s.addText(String(k + 1), { x: x + 0.15, y: contentY + 0.2, w: 0.45, h: 0.45, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: font })
      s.addText(c.card_title || '', { x: x + 0.15, y: contentY + 0.8, w: 2.7, h: 0.6, fontSize: 15, bold: true, color: accHex, fontFace: font })
      s.addText(c.card_content || '', { x: x + 0.15, y: contentY + 1.5, w: 2.7, h: 3.5, fontSize: 12, color: txtHex, valign: 'top', wrap: true, fontFace: font })
    })

  // ── TIMELINE ──
  } else if (stype === 'timeline') {
    const steps = (slide.timeline_steps || []).slice(0, 4)
    steps.forEach((st, k) => {
      const y = contentY + k * 1.28
      s.addShape(prs.ShapeType.ellipse, { x: 0.25, y: y + 0.02, w: 0.5, h: 0.5, fill: { color: accHex } })
      s.addText(String(k + 1), { x: 0.25, y: y + 0.02, w: 0.5, h: 0.5, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: font })
      if (k < steps.length - 1) {
        s.addShape(prs.ShapeType.rect, { x: 0.48, y: y + 0.52, w: 0.04, h: 0.76, fill: { color: accHex + '40' } })
      }
      s.addText(st.step_title || '', { x: 0.9, y: y, w: 8.7, h: 0.48, fontSize: 16, bold: true, color: txtHex, fontFace: font })
      s.addText(st.step_desc || '', { x: 0.9, y: y + 0.5, w: 8.7, h: 0.6, fontSize: 13, color: '777777', fontFace: font })
    })

  // ── TWO COLUMN ──
  } else if (stype === 'two_column') {
    const half = Math.ceil(bullets.length / 2)
    bullets.slice(0, half).forEach((b, i) => {
      s.addShape(prs.ShapeType.ellipse, { x: 0.3, y: contentY + i * 0.78 + 0.1, w: 0.12, h: 0.12, fill: { color: accHex } })
      s.addText(b, { x: 0.55, y: contentY + i * 0.78, w: 4.4, h: 0.68, fontSize: 14, color: txtHex, wrap: true, fontFace: font })
    })
    bullets.slice(half).forEach((b, i) => {
      s.addShape(prs.ShapeType.ellipse, { x: 5.2, y: contentY + i * 0.78 + 0.1, w: 0.12, h: 0.12, fill: { color: accHex } })
      s.addText(b, { x: 5.45, y: contentY + i * 0.78, w: 4.4, h: 0.68, fontSize: 14, color: txtHex, wrap: true, fontFace: font })
    })
    // Vertical divider
    s.addShape(prs.ShapeType.rect, { x: 4.95, y: contentY, w: 0.03, h: contentH, fill: { color: accHex + '25' } })

  // ── IMAGE + TEXT ──
  } else if (stype === 'image_text') {
    // Left: colored illustration placeholder
    s.addShape(prs.ShapeType.roundRect, { x: 0.3, y: contentY, w: 4.2, h: contentH, fill: { color: accHex + '12' }, line: { color: accHex + '25', width: 1 }, rectRadius: 0.12 })
    // Decorative shapes inside placeholder
    s.addShape(prs.ShapeType.ellipse, { x: 1.2, y: contentY + 0.5, w: 2.4, h: 2.4, fill: { color: accHex + '20' } })
    s.addShape(prs.ShapeType.ellipse, { x: 1.6, y: contentY + 0.9, w: 1.6, h: 1.6, fill: { color: accHex + '35' } })
    s.addShape(prs.ShapeType.ellipse, { x: 1.95, y: contentY + 1.25, w: 0.9, h: 0.9, fill: { color: accHex } })
    s.addText(slide.summary || '', { x: 0.4, y: contentY + contentH - 0.5, w: 4.0, h: 0.4, fontSize: 10, color: '888888', align: 'center', italic: true, fontFace: font })
    // Right: bullets
    bullets.slice(0, 5).forEach((b, i) => {
      s.addShape(prs.ShapeType.ellipse, { x: 4.9, y: contentY + i * 0.9 + 0.1, w: 0.12, h: 0.12, fill: { color: accHex } })
      s.addText(b, { x: 5.15, y: contentY + i * 0.9, w: 4.5, h: 0.8, fontSize: 14, color: txtHex, wrap: true, valign: 'middle', fontFace: font })
    })

  // ── COMPARISON ──
  } else if (stype === 'comparison') {
    const cards = slide.cards || []
    const left = cards[0] || { card_title: '옵션 A', card_content: '' }
    const right = cards[1] || { card_title: '옵션 B', card_content: '' }
    // Left column
    s.addShape(prs.ShapeType.roundRect, { x: 0.3, y: contentY, w: 4.4, h: contentH, fill: { color: accHex + '15' }, line: { color: accHex, width: 2 }, rectRadius: 0.1 })
    s.addShape(prs.ShapeType.roundRect, { x: 0.3, y: contentY, w: 4.4, h: 0.65, fill: { color: accHex }, line: { color: accHex, width: 1 }, rectRadius: 0.05 })
    s.addText('A', { x: 0.35, y: contentY + 0.05, w: 0.55, h: 0.55, fontSize: 16, bold: true, color: accHex, align: 'center', valign: 'middle', fontFace: font })
    s.addShape(prs.ShapeType.ellipse, { x: 0.35, y: contentY + 0.05, w: 0.55, h: 0.55, fill: { color: 'FFFFFF' } })
    s.addText('A', { x: 0.35, y: contentY + 0.05, w: 0.55, h: 0.55, fontSize: 14, bold: true, color: accHex, align: 'center', valign: 'middle', fontFace: font })
    s.addText(left.card_title || '', { x: 1.0, y: contentY + 0.05, w: 3.6, h: 0.55, fontSize: 16, bold: true, color: 'FFFFFF', valign: 'middle', fontFace: font })
    s.addText(left.card_content || '', { x: 0.45, y: contentY + 0.8, w: 4.1, h: contentH - 1.0, fontSize: 13, color: txtHex, valign: 'top', wrap: true, fontFace: font })
    // VS
    s.addShape(prs.ShapeType.ellipse, { x: 4.5, y: contentY + contentH / 2 - 0.4, w: 0.8, h: 0.8, fill: { color: accHex } })
    s.addText('VS', { x: 4.5, y: contentY + contentH / 2 - 0.4, w: 0.8, h: 0.8, fontSize: 11, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: font })
    // Right column
    s.addShape(prs.ShapeType.roundRect, { x: 5.1, y: contentY, w: 4.4, h: contentH, fill: { color: bg.replace('#', '') }, line: { color: accHex + '60', width: 1.5 }, rectRadius: 0.1 })
    s.addShape(prs.ShapeType.rect, { x: 5.1, y: contentY, w: 4.4, h: 0.65, fill: { color: bg.replace('#', '') } })
    s.addShape(prs.ShapeType.ellipse, { x: 5.15, y: contentY + 0.05, w: 0.55, h: 0.55, fill: { color: accHex } })
    s.addText('B', { x: 5.15, y: contentY + 0.05, w: 0.55, h: 0.55, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: font })
    s.addText(right.card_title || '', { x: 5.8, y: contentY + 0.05, w: 3.6, h: 0.55, fontSize: 16, bold: true, color: txtHex, valign: 'middle', fontFace: font })
    s.addText(right.card_content || '', { x: 5.25, y: contentY + 0.8, w: 4.1, h: contentH - 1.0, fontSize: 13, color: txtHex, valign: 'top', wrap: true, fontFace: font })

  // ── DEFAULT (title_and_content, team_grid, etc.) ──
  } else {
    bullets.forEach((b, i) => {
      s.addShape(prs.ShapeType.ellipse, { x: 0.3, y: contentY + i * 0.85 + 0.12, w: 0.14, h: 0.14, fill: { color: accHex } })
      s.addText(b, { x: 0.6, y: contentY + i * 0.85, w: 9.0, h: 0.75, fontSize: 15, color: txtHex, valign: 'middle', wrap: true, fontFace: font })
    })
  }
}

export async function exportPptx(presentation: Presentation, design?: DesignSettings): Promise<void> {
  const d = design || DEFAULT_DESIGN
  const palette = getPalette(d.paletteId)

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

  const accent = d.accentColor || palette.accent || presentation.accent_color || DEFAULT_ACCENT
  const bg = d.bgColor || palette.bg || DEFAULT_BG
  const txt = d.textColor || palette.text || DEFAULT_TXT
  const font = FONT_MAP[d.font] || 'Calibri'

  for (const slide of presentation.slides) {
    addSlide(prs, slide, accent, bg, txt, font)
  }

  const filename = (presentation.title || 'presentation').replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim() || 'presentation'
  await prs.writeFile({ fileName: `${filename}.pptx` })
}
