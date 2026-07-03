import type { Slide } from './types'

export const CANVAS_W = 1280
export const CANVAS_H = 720

// Programmatically populate a fabric Canvas with objects for the given slide.
// fab = the dynamically imported 'fabric' module.
export function buildFabricObjects(fab: any, slide: Slide, accent: string, bg: string): any[] {
  const { Rect, Circle, Triangle, Line, Textbox } = fab
  const objs: any[] = []
  const txt = '#1e293b'
  const W = CANVAS_W
  const H = CANVAS_H

  const mkRect = (o: object) => new Rect({ strokeWidth: 0, rx: 0, ry: 0, ...o })
  const mkText = (text: string, o: object) => new Textbox(text, {
    fontFamily: 'Arial, sans-serif', fontSize: 24, fill: txt, editable: true, ...o,
  })

  const addBg = (fill = bg) => objs.push(mkRect({
    left: 0, top: 0, width: W, height: H,
    fill, selectable: false, evented: false, data: { role: 'bg' },
  }))

  const addHeader = (fill = accent) => {
    objs.push(mkRect({ left: 0, top: 0, width: W, height: 90, fill, selectable: false, evented: false, data: { role: 'hdr' } }))
    if (slide.title) objs.push(mkText(slide.title, {
      left: 24, top: 14, width: W - 48, fontSize: 34, fontWeight: 'bold', fill: '#ffffff', data: { role: 'title' },
    }))
  }

  const addBullets = (startY: number, fontSize = 22) => {
    ;(slide.bullets || []).forEach((b, i) => {
      objs.push(mkRect({ left: 34, top: startY + i * 85 + 10, width: 8, height: 8, fill: accent, angle: 45, selectable: false, evented: false }))
      objs.push(mkText(b, { left: 58, top: startY + i * 85, width: W - 88, fontSize, data: { role: `bullet_${i}` } }))
    })
  }

  const addKeyTakeaway = () => {
    if (!slide.key_takeaway) return
    objs.push(mkRect({ left: 0, top: H - 58, width: W, height: 58, fill: accent + '15', selectable: false, evented: false }))
    objs.push(mkText('💡 ' + slide.key_takeaway, { left: 20, top: H - 50, width: W - 40, fontSize: 17, fill: '#555555', data: { role: 'kw' } }))
  }

  // ── SECTION HEADER ──────────────────────────────────────
  if (slide.slide_type === 'section_header') {
    addBg(accent)
    // Decorative circle top-right
    objs.push(new Circle({ left: W - 160, top: -80, radius: 160, fill: '#ffffff14', selectable: false, evented: false }))
    objs.push(new Circle({ left: W - 100, top: -40, radius: 80, fill: '#ffffff1a', selectable: false, evented: false }))
    objs.push(mkText(slide.title || '', { left: 80, top: H / 2 - 70, width: W - 160, fontSize: 56, fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', data: { role: 'title' } }))
    objs.push(new Line([W / 2 - 80, H / 2 + 10, W / 2 + 80, H / 2 + 10], { stroke: '#ffffff55', strokeWidth: 2, selectable: false, evented: false }))
    if (slide.summary) objs.push(mkText(slide.summary, { left: 80, top: H / 2 + 30, width: W - 160, fontSize: 24, fill: '#ffffffcc', textAlign: 'center', data: { role: 'summary' } }))
  }

  // ── TITLE AND CONTENT ────────────────────────────────────
  else if (slide.slide_type === 'title_and_content') {
    addBg(); addHeader(); addBullets(108); addKeyTakeaway()
  }

  // ── BIG STAT ─────────────────────────────────────────────
  else if (slide.slide_type === 'big_stat') {
    addBg(); addHeader()
    if (slide.stat_value) objs.push(mkText(slide.stat_value, {
      left: 40, top: 108, width: W - 80, fontSize: 130, fontWeight: 'bold', fill: accent, data: { role: 'stat' },
    }))
    objs.push(new Line([40, 280, 220, 280], { stroke: accent, strokeWidth: 3, selectable: false, evented: false }))
    if (slide.stat_description) objs.push(mkText(slide.stat_description, { left: 40, top: 295, width: W - 80, fontSize: 22, fill: '#777777', data: { role: 'stat_desc' } }))
    addBullets(350, 20)
    addKeyTakeaway()
  }

  // ── THREE CARDS ──────────────────────────────────────────
  else if (slide.slide_type === 'three_cards') {
    addBg(); addHeader()
    ;(slide.cards || []).slice(0, 3).forEach((c, k) => {
      const cx = 40 + k * 398, cy = 108
      objs.push(mkRect({ left: cx, top: cy, width: 378, height: H - 128, fill: accent + '12', rx: 8, ry: 8, stroke: accent + '30', strokeWidth: 1 }))
      objs.push(mkRect({ left: cx, top: cy, width: 378, height: 6, fill: accent, rx: 4, ry: 4, selectable: false, evented: false }))
      objs.push(new Circle({ left: cx + 14, top: cy + 16, radius: 16, fill: accent, selectable: false, evented: false }))
      objs.push(mkText(String(k + 1), { left: cx + 14, top: cy + 10, width: 32, height: 32, fontSize: 14, fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', selectable: false, evented: false }))
      objs.push(mkText(c.card_title || '', { left: cx + 16, top: cy + 50, width: 346, fontSize: 18, fontWeight: 'bold', fill: accent, data: { role: `ct_${k}` } }))
      objs.push(mkText(c.card_content || '', { left: cx + 16, top: cy + 86, width: 346, fontSize: 15, fill: txt, data: { role: `cc_${k}` } }))
    })
    addKeyTakeaway()
  }

  // ── TIMELINE ─────────────────────────────────────────────
  else if (slide.slide_type === 'timeline') {
    addBg(); addHeader()
    ;(slide.timeline_steps || []).slice(0, 4).forEach((st, k) => {
      const y = 118 + k * 130
      objs.push(new Circle({ left: 30, top: y, radius: 20, fill: accent, selectable: false, evented: false }))
      objs.push(mkText(String(k + 1), { left: 30, top: y, width: 40, height: 40, fontSize: 14, fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', selectable: false, evented: false }))
      if (k < 3) objs.push(new Line([50, y + 40, 50, y + 130], { stroke: accent + '40', strokeWidth: 3, selectable: false, evented: false }))
      objs.push(mkText(st.step_title || '', { left: 88, top: y, width: W - 110, fontSize: 20, fontWeight: 'bold', data: { role: `st_${k}` } }))
      objs.push(mkText(st.step_desc || '', { left: 88, top: y + 32, width: W - 110, fontSize: 16, fill: '#777777', data: { role: `sd_${k}` } }))
    })
  }

  // ── TWO COLUMN ──────────────────────────────────────────
  else if (slide.slide_type === 'two_column') {
    addBg(); addHeader()
    const half = Math.ceil((slide.bullets || []).length / 2)
    ;(slide.bullets || []).slice(0, half).forEach((b, i) => objs.push(mkText(`• ${b}`, { left: 32, top: 108 + i * 90, width: 575, fontSize: 20, data: { role: `l_${i}` } })))
    ;(slide.bullets || []).slice(half).forEach((b, i) => objs.push(mkText(`• ${b}`, { left: 656, top: 108 + i * 90, width: 575, fontSize: 20, data: { role: `r_${i}` } })))
    objs.push(new Line([624, 100, 624, H - 20], { stroke: accent + '25', strokeWidth: 2, selectable: false, evented: false }))
    addKeyTakeaway()
  }

  // ── QUOTE SLIDE ─────────────────────────────────────────
  else if (slide.slide_type === 'quote_slide') {
    addBg()
    objs.push(mkRect({ left: 40, top: 140, width: 8, height: H - 280, fill: accent, selectable: false, evented: false }))
    objs.push(mkText('"', { left: 50, top: 30, width: 220, fontSize: 200, fill: accent + '1A', fontFamily: 'Georgia, serif', selectable: false, evented: false }))
    objs.push(mkText(slide.title || '', { left: 70, top: 170, width: W - 120, fontSize: 36, fontWeight: 'bold', fontFamily: 'Georgia, serif', data: { role: 'quote' } }))
    objs.push(new Line([W / 2 - 100, H - 120, W / 2 + 100, H - 120], { stroke: accent, strokeWidth: 2, selectable: false, evented: false }))
    if (slide.summary) objs.push(mkText(slide.summary, { left: 40, top: H - 108, width: W - 80, fontSize: 20, fill: accent, textAlign: 'center', fontStyle: 'italic', fontFamily: 'Georgia, serif', data: { role: 'attr' } }))
  }

  // ── IMAGE TEXT ──────────────────────────────────────────
  else if (slide.slide_type === 'image_text') {
    addBg(); addHeader()
    objs.push(mkRect({ left: 32, top: 108, width: 500, height: H - 128, fill: accent + '10', rx: 8, ry: 8, stroke: accent + '25', strokeWidth: 1 }))
    objs.push(new Circle({ left: 180, top: 190, radius: 110, fill: accent + '1F', selectable: false, evented: false }))
    objs.push(new Circle({ left: 220, top: 230, radius: 70, fill: accent + '38', selectable: false, evented: false }))
    objs.push(new Circle({ left: 252, top: 262, radius: 38, fill: accent, selectable: false, evented: false }))
    if (slide.summary) objs.push(mkText(slide.summary, { left: 40, top: H - 48, width: 490, fontSize: 13, fill: '#888888', textAlign: 'center', fontStyle: 'italic' }))
    ;(slide.bullets || []).slice(0, 5).forEach((b, i) => objs.push(mkText(`• ${b}`, { left: 558, top: 118 + i * 90, width: 688, fontSize: 20, data: { role: `b_${i}` } })))
    addKeyTakeaway()
  }

  // ── COMPARISON ──────────────────────────────────────────
  else if (slide.slide_type === 'comparison') {
    addBg(); addHeader()
    const cH = H - 128
    const [lc, rc] = [slide.cards?.[0] || { card_title: 'A', card_content: '' }, slide.cards?.[1] || { card_title: 'B', card_content: '' }]
    // Left
    objs.push(mkRect({ left: 32, top: 108, width: 570, height: cH, fill: accent + '15', rx: 8, ry: 8, stroke: accent, strokeWidth: 2 }))
    objs.push(mkRect({ left: 32, top: 108, width: 570, height: 60, fill: accent, rx: 6, ry: 6, selectable: false, evented: false }))
    objs.push(mkText('A  ' + (lc.card_title || ''), { left: 50, top: 118, width: 534, fontSize: 22, fontWeight: 'bold', fill: '#ffffff', data: { role: 'lt' } }))
    objs.push(mkText(lc.card_content || '', { left: 50, top: 182, width: 534, fontSize: 18, fill: txt, data: { role: 'lc' } }))
    // VS
    objs.push(new Circle({ left: W / 2 - 34, top: 108 + cH / 2 - 34, radius: 34, fill: accent, selectable: false, evented: false }))
    objs.push(mkText('VS', { left: W / 2 - 34, top: 108 + cH / 2 - 14, width: 68, fontSize: 15, fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', selectable: false, evented: false }))
    // Right
    objs.push(mkRect({ left: W - 602, top: 108, width: 570, height: cH, fill: bg, rx: 8, ry: 8, stroke: accent + '60', strokeWidth: 1.5 }))
    objs.push(new Circle({ left: W - 598, top: 112, radius: 24, fill: accent, selectable: false, evented: false }))
    objs.push(mkText('B', { left: W - 598, top: 112, width: 48, height: 48, fontSize: 15, fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', selectable: false, evented: false }))
    objs.push(mkText(rc.card_title || '', { left: W - 558, top: 118, width: 510, fontSize: 22, fontWeight: 'bold', fill: txt, data: { role: 'rt' } }))
    objs.push(mkText(rc.card_content || '', { left: W - 558, top: 182, width: 510, fontSize: 18, fill: txt, data: { role: 'rc' } }))
    addKeyTakeaway()
  }

  // ── DEFAULT ─────────────────────────────────────────────
  else {
    addBg(); addHeader(); addBullets(108); addKeyTakeaway()
  }

  return objs
}
