import type { Slide } from './types'

export const CANVAS_W = 1280
export const CANVAS_H = 720

// Smart font size: scale down if text is long
function smartSize(text: string, base: number, softLimit = 30, hardMin = 12): number {
  if (!text || text.length <= softLimit) return base
  const ratio = softLimit / text.length
  return Math.max(hardMin, Math.round(base * Math.sqrt(ratio)))
}

// Clamp bullet font size based on count
function bulletFontSize(count: number): number {
  if (count <= 3) return 24
  if (count <= 5) return 20
  if (count <= 7) return 17
  return 14
}

// Bullet Y spacing based on count
function bulletSpacing(count: number): number {
  if (count <= 3) return 110
  if (count <= 5) return 88
  if (count <= 7) return 72
  return 58
}

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
    const titleFs = smartSize(slide.title || '', 34, 35, 20)
    objs.push(mkRect({ left: 0, top: 0, width: W, height: 90, fill, selectable: false, evented: false, data: { role: 'hdr' } }))
    if (slide.title) objs.push(mkText(slide.title, {
      left: 24, top: 14, width: W - 48, fontSize: titleFs, fontWeight: 'bold', fill: '#ffffff', data: { role: 'title' },
    }))
  }

  const addBullets = (startY: number, overrideFontSize?: number) => {
    const bullets = slide.bullets || []
    const fs = overrideFontSize ?? bulletFontSize(bullets.length)
    const sp = bulletSpacing(bullets.length)
    bullets.forEach((b, i) => {
      objs.push(mkRect({ left: 34, top: startY + i * sp + 14, width: 7, height: 7, fill: accent, angle: 45, selectable: false, evented: false }))
      objs.push(mkText(b, { left: 56, top: startY + i * sp, width: W - 80, fontSize: fs, data: { role: `bullet_${i}` } }))
    })
  }

  const addKeyTakeaway = () => {
    if (!slide.key_takeaway) return
    const fs = smartSize(slide.key_takeaway, 17, 80, 12)
    objs.push(mkRect({ left: 0, top: H - 58, width: W, height: 58, fill: accent + '15', selectable: false, evented: false }))
    objs.push(mkText('💡 ' + slide.key_takeaway, { left: 20, top: H - 50, width: W - 40, fontSize: fs, fill: '#555555', data: { role: 'kw' } }))
  }

  // ── SECTION HEADER ──────────────────────────────────────
  if (slide.slide_type === 'section_header') {
    addBg(accent)
    objs.push(new Circle({ left: W - 160, top: -80, radius: 160, fill: '#ffffff14', selectable: false, evented: false }))
    objs.push(new Circle({ left: W - 100, top: -40, radius: 80, fill: '#ffffff1a', selectable: false, evented: false }))
    // Image placeholder area (lower third) — replaced by real image if imageUrl present
    if (!slide.imageUrl) {
      objs.push(mkRect({ left: 0, top: H * 0.6, width: W, height: H * 0.4, fill: '#00000025', selectable: false, evented: false, data: { role: 'img-placeholder' } }))
    }
    const titleFs = smartSize(slide.title || '', 56, 30, 28)
    objs.push(mkText(slide.title || '', { left: 80, top: H / 2 - 70, width: W - 160, fontSize: titleFs, fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', data: { role: 'title' } }))
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
    const statFs = smartSize(slide.stat_value || '', 130, 6, 60)
    if (slide.stat_value) objs.push(mkText(slide.stat_value, {
      left: 40, top: 108, width: W * 0.55, fontSize: statFs, fontWeight: 'bold', fill: accent, data: { role: 'stat' },
    }))
    objs.push(new Line([40, 290, 220, 290], { stroke: accent, strokeWidth: 3, selectable: false, evented: false }))
    if (slide.stat_description) {
      const descFs = smartSize(slide.stat_description, 22, 60, 14)
      objs.push(mkText(slide.stat_description, { left: 40, top: 305, width: W * 0.55, fontSize: descFs, fill: '#777777', data: { role: 'stat_desc' } }))
    }
    // Right side: image placeholder or bullets
    if (!slide.imageUrl) {
      objs.push(mkRect({ left: W * 0.6, top: 108, width: W * 0.38, height: H - 168, fill: accent + '0D', rx: 8, ry: 8, selectable: false, evented: false, data: { role: 'img-placeholder' } }))
      ;(slide.bullets || []).slice(0, 3).forEach((b, i) => {
        objs.push(mkText(`• ${b}`, { left: W * 0.62, top: 130 + i * 90, width: W * 0.35, fontSize: 18, fill: txt, data: { role: `bullet_${i}` } }))
      })
    }
    addKeyTakeaway()
  }

  // ── THREE CARDS ──────────────────────────────────────────
  else if (slide.slide_type === 'three_cards') {
    addBg(); addHeader()
    ;(slide.cards || []).slice(0, 3).forEach((c, k) => {
      const cx = 40 + k * 398, cy = 108
      const cardH = H - 128
      objs.push(mkRect({ left: cx, top: cy, width: 378, height: cardH, fill: accent + '12', rx: 8, ry: 8, stroke: accent + '30', strokeWidth: 1 }))
      objs.push(mkRect({ left: cx, top: cy, width: 378, height: 6, fill: accent, rx: 4, ry: 4, selectable: false, evented: false }))
      objs.push(new Circle({ left: cx + 14, top: cy + 16, radius: 16, fill: accent, selectable: false, evented: false }))
      objs.push(mkText(String(k + 1), { left: cx + 14, top: cy + 10, width: 32, height: 32, fontSize: 14, fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', selectable: false, evented: false }))
      const ctFs = smartSize(c.card_title || '', 18, 25, 12)
      const ccFs = smartSize(c.card_content || '', 15, 120, 11)
      objs.push(mkText(c.card_title || '', { left: cx + 16, top: cy + 50, width: 346, fontSize: ctFs, fontWeight: 'bold', fill: accent, data: { role: `ct_${k}` } }))
      objs.push(mkText(c.card_content || '', { left: cx + 16, top: cy + 86, width: 346, fontSize: ccFs, fill: txt, data: { role: `cc_${k}` } }))
    })
    addKeyTakeaway()
  }

  // ── TIMELINE ─────────────────────────────────────────────
  else if (slide.slide_type === 'timeline') {
    addBg(); addHeader()
    const steps = (slide.timeline_steps || []).slice(0, 5)
    const sp = steps.length <= 3 ? 148 : steps.length <= 4 ? 126 : 100
    steps.forEach((st, k) => {
      const y = 108 + k * sp
      objs.push(new Circle({ left: 30, top: y, radius: 20, fill: accent, selectable: false, evented: false }))
      objs.push(mkText(String(k + 1), { left: 30, top: y, width: 40, height: 40, fontSize: 14, fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', selectable: false, evented: false }))
      if (k < steps.length - 1) objs.push(new Line([50, y + 40, 50, y + sp], { stroke: accent + '40', strokeWidth: 3, selectable: false, evented: false }))
      const stFs = smartSize(st.step_title || '', 20, 30, 14)
      const sdFs = smartSize(st.step_desc || '', 16, 60, 12)
      objs.push(mkText(st.step_title || '', { left: 88, top: y, width: W - 110, fontSize: stFs, fontWeight: 'bold', data: { role: `st_${k}` } }))
      objs.push(mkText(st.step_desc || '', { left: 88, top: y + 30, width: W - 110, fontSize: sdFs, fill: '#777777', data: { role: `sd_${k}` } }))
    })
  }

  // ── TWO COLUMN ──────────────────────────────────────────
  else if (slide.slide_type === 'two_column') {
    addBg(); addHeader()
    const bullets = slide.bullets || []
    const half = Math.ceil(bullets.length / 2)
    const fs = bulletFontSize(half)
    const sp = bulletSpacing(half)
    bullets.slice(0, half).forEach((b, i) => objs.push(mkText(`• ${b}`, { left: 32, top: 108 + i * sp, width: 575, fontSize: fs, data: { role: `l_${i}` } })))
    bullets.slice(half).forEach((b, i) => objs.push(mkText(`• ${b}`, { left: 656, top: 108 + i * sp, width: 575, fontSize: fs, data: { role: `r_${i}` } })))
    objs.push(new Line([624, 100, 624, H - 20], { stroke: accent + '25', strokeWidth: 2, selectable: false, evented: false }))
    addKeyTakeaway()
  }

  // ── QUOTE SLIDE ─────────────────────────────────────────
  else if (slide.slide_type === 'quote_slide') {
    addBg()
    objs.push(mkRect({ left: 40, top: 140, width: 8, height: H - 280, fill: accent, selectable: false, evented: false }))
    objs.push(mkText('"', { left: 50, top: 30, width: 220, fontSize: 200, fill: accent + '1A', fontFamily: 'Georgia, serif', selectable: false, evented: false }))
    const quoteFs = smartSize(slide.title || '', 36, 80, 20)
    objs.push(mkText(slide.title || '', { left: 70, top: 170, width: W - 120, fontSize: quoteFs, fontWeight: 'bold', fontFamily: 'Georgia, serif', data: { role: 'quote' } }))
    objs.push(new Line([W / 2 - 100, H - 120, W / 2 + 100, H - 120], { stroke: accent, strokeWidth: 2, selectable: false, evented: false }))
    if (slide.summary) objs.push(mkText(slide.summary, { left: 40, top: H - 108, width: W - 80, fontSize: 20, fill: accent, textAlign: 'center', fontStyle: 'italic', fontFamily: 'Georgia, serif', data: { role: 'attr' } }))
  }

  // ── IMAGE TEXT ──────────────────────────────────────────
  else if (slide.slide_type === 'image_text') {
    addBg(); addHeader()
    // Left: image area (placeholder until real image loads)
    objs.push(mkRect({ left: 32, top: 108, width: 500, height: H - 128, fill: accent + '10', rx: 8, ry: 8, stroke: accent + '25', strokeWidth: 1, data: { role: 'img-placeholder' } }))
    if (!slide.imageUrl) {
      // Decorative circles only when no real image
      objs.push(new Circle({ left: 180, top: 190, radius: 110, fill: accent + '1F', selectable: false, evented: false }))
      objs.push(new Circle({ left: 220, top: 230, radius: 70, fill: accent + '38', selectable: false, evented: false }))
      objs.push(new Circle({ left: 252, top: 262, radius: 38, fill: accent, selectable: false, evented: false }))
    }
    if (slide.summary) objs.push(mkText(slide.summary, { left: 40, top: H - 48, width: 490, fontSize: 13, fill: '#888888', textAlign: 'center', fontStyle: 'italic' }))
    // Right: bullets
    const bullets = (slide.bullets || []).slice(0, 5)
    const fs = bulletFontSize(bullets.length)
    const sp = bulletSpacing(Math.min(bullets.length, 4))
    bullets.forEach((b, i) => objs.push(mkText(`• ${b}`, { left: 558, top: 118 + i * sp, width: 688, fontSize: fs, data: { role: `b_${i}` } })))
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
    const ltFs = smartSize(lc.card_title || '', 22, 25, 14)
    const lcFs = smartSize(lc.card_content || '', 18, 120, 12)
    objs.push(mkText('A  ' + (lc.card_title || ''), { left: 50, top: 118, width: 534, fontSize: ltFs, fontWeight: 'bold', fill: '#ffffff', data: { role: 'lt' } }))
    objs.push(mkText(lc.card_content || '', { left: 50, top: 182, width: 534, fontSize: lcFs, fill: txt, data: { role: 'lc' } }))
    // VS badge
    objs.push(new Circle({ left: W / 2 - 34, top: 108 + cH / 2 - 34, radius: 34, fill: accent, selectable: false, evented: false }))
    objs.push(mkText('VS', { left: W / 2 - 34, top: 108 + cH / 2 - 14, width: 68, fontSize: 15, fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', selectable: false, evented: false }))
    // Right
    const rtFs = smartSize(rc.card_title || '', 22, 25, 14)
    const rcFs = smartSize(rc.card_content || '', 18, 120, 12)
    objs.push(mkRect({ left: W - 602, top: 108, width: 570, height: cH, fill: bg, rx: 8, ry: 8, stroke: accent + '60', strokeWidth: 1.5 }))
    objs.push(new Circle({ left: W - 598, top: 112, radius: 24, fill: accent, selectable: false, evented: false }))
    objs.push(mkText('B', { left: W - 598, top: 112, width: 48, height: 48, fontSize: 15, fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', selectable: false, evented: false }))
    objs.push(mkText(rc.card_title || '', { left: W - 558, top: 118, width: 510, fontSize: rtFs, fontWeight: 'bold', fill: txt, data: { role: 'rt' } }))
    objs.push(mkText(rc.card_content || '', { left: W - 558, top: 182, width: 510, fontSize: rcFs, fill: txt, data: { role: 'rc' } }))
    addKeyTakeaway()
  }

  // ── DEFAULT ─────────────────────────────────────────────
  else {
    addBg(); addHeader(); addBullets(108); addKeyTakeaway()
  }

  return objs
}
