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

  if (stype === 'section_header') {
    s.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: accHex } })
    s.addText(title || '', {
      x: 0.5, y: 1.5, w: 9, h: 1.5,
      fontSize: 36, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: font,
    })
    s.addText(slide.summary || '', {
      x: 0.5, y: 3.2, w: 9, h: 1,
      fontSize: 18, color: 'FFFFFFCC', align: 'center', fontFace: font,
    })
    return
  }

  // Header bar
  s.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.1, fill: { color: accHex } })
  s.addText(title || '', {
    x: 0.3, y: 0, w: 9.4, h: 1.1,
    fontSize: 22, bold: true, color: 'FFFFFF', valign: 'middle', fontFace: font,
  })

  // Key takeaway bar
  if (key_takeaway) {
    s.addShape(prs.ShapeType.rect, { x: 0, y: 6.8, w: '100%', h: 0.65, fill: { color: accHex + '22' } })
    s.addText(`💡 ${key_takeaway}`, {
      x: 0.3, y: 6.8, w: 9.4, h: 0.65,
      fontSize: 11, color: '555555', valign: 'middle', fontFace: font,
    })
  }

  const contentY = 1.3
  const contentH = 5.3

  if (stype === 'big_stat') {
    s.addText(slide.stat_value || '0', {
      x: 0.4, y: contentY, w: 9.2, h: 1.6,
      fontSize: 72, bold: true, color: accHex, valign: 'top', fontFace: font,
    })
    s.addText(slide.stat_description || '', {
      x: 0.4, y: contentY + 1.7, w: 9.2, h: 0.7,
      fontSize: 16, color: '888888', fontFace: font,
    })
    bullets.forEach((b, i) => {
      s.addText(`• ${b}`, {
        x: 0.4, y: contentY + 2.6 + i * 0.55, w: 9.2, h: 0.5,
        fontSize: 14, color: txtHex, fontFace: font,
      })
    })

  } else if (stype === 'three_cards') {
    const cards = (slide.cards || []).slice(0, 3)
    cards.forEach((c, k) => {
      const x = 0.3 + k * 3.2
      s.addShape(prs.ShapeType.roundRect, {
        x, y: contentY, w: 3.0, h: contentH,
        fill: { color: accHex + '18' }, line: { color: accHex + '33', width: 1 }, rectRadius: 0.1,
      })
      s.addText(c.card_title || '', {
        x: x + 0.15, y: contentY + 0.2, w: 2.7, h: 0.7,
        fontSize: 16, bold: true, color: accHex, fontFace: font,
      })
      s.addText(c.card_content || '', {
        x: x + 0.15, y: contentY + 1.0, w: 2.7, h: 4.0,
        fontSize: 13, color: txtHex, valign: 'top', wrap: true, fontFace: font,
      })
    })

  } else if (stype === 'timeline') {
    const steps = (slide.timeline_steps || []).slice(0, 4)
    steps.forEach((st, k) => {
      const y = contentY + k * 1.25
      s.addShape(prs.ShapeType.ellipse, { x: 0.3, y, w: 0.5, h: 0.5, fill: { color: accHex } })
      s.addText(String(k + 1), {
        x: 0.3, y, w: 0.5, h: 0.5,
        fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: font,
      })
      s.addText(st.step_title || '', {
        x: 1.0, y, w: 8.5, h: 0.45,
        fontSize: 16, bold: true, color: txtHex, fontFace: font,
      })
      s.addText(st.step_desc || '', {
        x: 1.0, y: y + 0.47, w: 8.5, h: 0.6,
        fontSize: 13, color: '888888', fontFace: font,
      })
    })

  } else if (stype === 'two_column') {
    const half = Math.ceil(bullets.length / 2)
    const left = bullets.slice(0, half)
    const right = bullets.slice(half)
    left.forEach((b, i) => {
      s.addText(`• ${b}`, {
        x: 0.3, y: contentY + i * 0.75, w: 4.5, h: 0.65,
        fontSize: 14, color: txtHex, wrap: true, fontFace: font,
      })
    })
    right.forEach((b, i) => {
      s.addText(`• ${b}`, {
        x: 5.1, y: contentY + i * 0.75, w: 4.5, h: 0.65,
        fontSize: 14, color: txtHex, wrap: true, fontFace: font,
      })
    })

  } else {
    bullets.forEach((b, i) => {
      s.addShape(prs.ShapeType.ellipse, {
        x: 0.3, y: contentY + i * 0.82 + 0.12, w: 0.13, h: 0.13,
        fill: { color: accHex },
      })
      s.addText(b, {
        x: 0.6, y: contentY + i * 0.82, w: 9.0, h: 0.72,
        fontSize: 15, color: txtHex, valign: 'middle', wrap: true, fontFace: font,
      })
    })
  }
}

export async function exportPptx(presentation: Presentation, design?: DesignSettings): Promise<void> {
  const d = design || DEFAULT_DESIGN
  const palette = getPalette(d.paletteId)

  const prs = new pptxgen()

  // Slide size
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
