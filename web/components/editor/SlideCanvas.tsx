'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { Slide } from '@/lib/types'
import type { Theme } from '@/lib/themes'

interface Props {
  slide: Slide
  theme: Theme
  onChange: (updated: Slide) => void
}

export default function SlideCanvas({ slide, theme, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleChange = useCallback(() => {
    if (!containerRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (!containerRef.current) return
      const get = (attr: string) => {
        const el = containerRef.current!.querySelector(`[data-field="${attr}"]`) as HTMLElement | null
        return el?.innerText.replace(/\n/g, ' ').trim() ?? null
      }
      const updated: Slide = JSON.parse(JSON.stringify(slide))
      const title = get('title'); if (title !== null) updated.title = title
      const summary = get('summary'); if (summary !== null) updated.summary = summary
      const sv = get('stat_value'); if (sv !== null) updated.stat_value = sv
      const sd = get('stat_desc'); if (sd !== null) updated.stat_description = sd
      const kw = get('key_takeaway'); if (kw !== null) updated.key_takeaway = kw
      const buls = containerRef.current!.querySelectorAll('[data-bullet]')
      if (buls.length) updated.bullets = Array.from(buls).map(el => (el as HTMLElement).innerText.replace(/\n/g, ' ').trim())
      const cts = containerRef.current!.querySelectorAll('[data-card-title]')
      const cvs = containerRef.current!.querySelectorAll('[data-card-content]')
      if (cts.length && updated.cards) updated.cards = Array.from(cts).map((el, i) => ({
        card_title: (el as HTMLElement).innerText.replace(/\n/g, ' ').trim(),
        card_content: (cvs[i] as HTMLElement | undefined)?.innerText.replace(/\n/g, ' ').trim() ?? '',
      }))
      const tsts = containerRef.current!.querySelectorAll('[data-step-title]')
      const tsds = containerRef.current!.querySelectorAll('[data-step-desc]')
      if (tsts.length && updated.timeline_steps) updated.timeline_steps = Array.from(tsts).map((el, i) => ({
        step_title: (el as HTMLElement).innerText.replace(/\n/g, ' ').trim(),
        step_desc: (tsds[i] as HTMLElement | undefined)?.innerText.replace(/\n/g, ' ').trim() ?? '',
      }))
      onChange(updated)
    }, 800)
  }, [slide, onChange])

  function ed(el: HTMLElement, field: string): HTMLElement {
    el.setAttribute('contenteditable', 'true')
    el.setAttribute('spellcheck', 'false')
    el.setAttribute('data-field', field)
    el.style.outline = 'none'
    el.style.cursor = 'text'
    el.style.whiteSpace = 'pre-wrap'
    el.style.wordBreak = 'break-word'
    el.addEventListener('input', scheduleChange)
    el.addEventListener('keydown', e => {
      if ((e as KeyboardEvent).key === 'Enter' && !(e as KeyboardEvent).shiftKey) {
        e.preventDefault(); (e.target as HTMLElement).blur()
      }
    })
    return el
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''

    const W = container.offsetWidth || 720
    const u = W / 100
    const t = theme
    const stype = slide.slide_type || 'title_and_content'
    const buls = slide.bullets || []
    const kw = slide.key_takeaway || ''
    const isMinimal = t.id === 'minimal'
    const isDark = t.id === 'dark'

    function div(styles: Partial<CSSStyleDeclaration> = {}): HTMLDivElement {
      const d = document.createElement('div')
      Object.assign(d.style, styles)
      return d
    }
    function abs(top: number | null, left: number | null, right: number | null, bottom: number | null, extra: Partial<CSSStyleDeclaration> = {}): HTMLDivElement {
      const s: Partial<CSSStyleDeclaration> = { position: 'absolute' }
      if (top !== null) s.top = top * u + 'px'
      if (left !== null) s.left = left * u + 'px'
      if (right !== null) s.right = right * u + 'px'
      if (bottom !== null) s.bottom = bottom * u + 'px'
      return div({ ...s, ...extra })
    }

    // Canvas wrapper
    container.style.position = 'relative'
    container.style.width = '100%'
    container.style.paddingTop = '56.25%'
    const cv = div({
      position: 'absolute', inset: '0', overflow: 'hidden',
      borderRadius: '12px',
      background: t.bgGradient || t.bg,
    })
    container.appendChild(cv)

    // ── Decorative elements ──
    if (t.decorStyle === 'circles' && stype !== 'section_header') {
      const c1 = abs(-8, null, -12, null, {
        width: 32 * u + 'px', height: 32 * u + 'px', borderRadius: '50%',
        background: t.accent + '18', pointerEvents: 'none',
      })
      cv.appendChild(c1)
      const c2 = abs(null, -6, null, -10, {
        width: 20 * u + 'px', height: 20 * u + 'px', borderRadius: '50%',
        background: t.accentLight + '20', pointerEvents: 'none',
      })
      cv.appendChild(c2)
    }
    if (t.decorStyle === 'dots' && stype !== 'section_header') {
      for (let i = 0; i < 6; i++) {
        const dot = abs(null, null, null, null, {
          position: 'absolute',
          width: 0.6 * u + 'px', height: 0.6 * u + 'px', borderRadius: '50%',
          background: t.accent + '40', pointerEvents: 'none',
          top: (10 + i * 14) * u + 'px',
          right: 3 * u + 'px',
        })
        cv.appendChild(dot)
      }
    }
    if (t.decorStyle === 'geo' && stype !== 'section_header') {
      const geo = abs(-5, null, -5, null, {
        width: 25 * u + 'px', height: 25 * u + 'px',
        background: t.accent + '10',
        transform: 'rotate(45deg)',
        pointerEvents: 'none',
        borderRadius: '3px',
      })
      cv.appendChild(geo)
    }

    // ── SECTION HEADER ──
    if (stype === 'section_header') {
      const bg2 = abs(0, 0, 0, 0, {
        background: t.sectionBg.startsWith('linear') ? undefined : t.sectionBg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: 8 * u + 'px',
      })
      if (t.sectionBg.startsWith('linear')) bg2.style.backgroundImage = t.sectionBg

      // Decorative circle on section slides
      const deco = div({
        position: 'absolute', width: 40 * u + 'px', height: 40 * u + 'px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        top: -8 * u + 'px', right: -8 * u + 'px', pointerEvents: 'none',
      })
      bg2.appendChild(deco)
      const deco2 = div({
        position: 'absolute', width: 24 * u + 'px', height: 24 * u + 'px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        bottom: -5 * u + 'px', left: -5 * u + 'px', pointerEvents: 'none',
      })
      bg2.appendChild(deco2)

      const chip = div({
        display: 'inline-block', background: 'rgba(255,255,255,0.2)',
        borderRadius: 20 * u + 'px', padding: `${0.8 * u}px ${2 * u}px`,
        marginBottom: 3 * u + 'px', backdropFilter: 'blur(4px)',
      })
      const chipTxt = div({ fontSize: 1.2 * u + 'px', color: 'rgba(255,255,255,0.9)', fontWeight: '600', letterSpacing: '0.05em' })
      chipTxt.textContent = `SECTION`
      chip.appendChild(chipTxt)

      const titleEl = ed(div({
        fontSize: 4 * u + 'px', fontWeight: '900', color: t.sectionText,
        lineHeight: '1.2', marginBottom: 2 * u + 'px', maxWidth: '80%',
      }), 'title')
      titleEl.textContent = slide.title || ''

      const line = div({
        width: 6 * u + 'px', height: 0.4 * u + 'px',
        background: 'rgba(255,255,255,0.5)', borderRadius: '2px',
        margin: `${1.5 * u}px auto`,
      })
      const sumEl = ed(div({
        fontSize: 1.8 * u + 'px', color: 'rgba(255,255,255,0.75)',
        maxWidth: '70%', lineHeight: '1.5',
      }), 'summary')
      sumEl.textContent = slide.summary || ''

      bg2.append(chip, titleEl, line, sumEl)
      cv.appendChild(bg2)
      return
    }

    // ── HEADER ──
    let headerH: number

    if (isMinimal) {
      // Minimal: left accent bar + title, no header bg
      headerH = 18
      const leftBar = abs(2, 3, null, null, {
        width: 0.5 * u + 'px', height: 14 * u + 'px',
        background: t.accent, borderRadius: '2px',
      })
      const titleEl = ed(div({
        fontSize: 2.6 * u + 'px', fontWeight: '800', color: t.bodyText,
        lineHeight: '1.2', maxWidth: '85%',
      }), 'title')
      titleEl.textContent = slide.title || ''
      const titleWrap = abs(2, 5, 3, null, {})
      titleWrap.appendChild(titleEl)
      cv.append(leftBar, titleWrap)
      // Thin separator line
      const sep = abs(null, 3, 3, null, { height: '1px', background: '#e2e8f0', top: 17 * u + 'px' })
      cv.appendChild(sep)
    } else {
      // Standard header bar
      headerH = 19
      const hdr = abs(0, 0, 0, null, {
        height: headerH * u + 'px',
        background: t.headerGradient ? undefined : t.headerBg,
        display: 'flex', alignItems: 'center',
        padding: `0 ${5 * u}px`,
        position: 'absolute',
      })
      if (t.headerGradient) hdr.style.backgroundImage = t.headerGradient

      // Subtle header pattern
      if (t.id === 'corporate') {
        const goldLine = div({
          position: 'absolute', left: '0', right: '0', bottom: '0',
          height: '3px', background: t.accent,
        })
        hdr.appendChild(goldLine)
      }

      const titleEl = ed(div({
        fontSize: 2.4 * u + 'px', fontWeight: '800', color: t.headerText,
        flex: '1', overflow: 'hidden', lineHeight: '1.3',
        textShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
      }), 'title')
      titleEl.textContent = slide.title || ''
      hdr.appendChild(titleEl)
      cv.appendChild(hdr)
    }

    // ── KEY TAKEAWAY ──
    const kwBox = abs(null, 3, 3, 1.5, {
      background: t.kwBg.startsWith('linear') ? undefined : t.kwBg,
      borderRadius: 0.8 * u + 'px',
      padding: `${0.8 * u}px ${1.5 * u}px`,
      borderLeft: `${0.35 * u}px solid ${t.kwBorder}`,
      display: 'flex', alignItems: 'center', gap: 0.6 * u + 'px',
      backdropFilter: isDark ? 'blur(8px)' : 'none',
    })
    if (t.kwBg.startsWith('linear')) kwBox.style.backgroundImage = t.kwBg
    const kwIcon = div({ fontSize: 1.3 * u + 'px', flexShrink: '0', userSelect: 'none' })
    kwIcon.textContent = '💡'
    const kwEl = ed(div({
      fontSize: 1.3 * u + 'px', color: t.kwText, flex: '1',
      minHeight: 1.6 * u + 'px', fontWeight: '500',
    }), 'key_takeaway')
    kwEl.textContent = kw || '핵심 메시지'
    kwBox.append(kwIcon, kwEl)
    cv.appendChild(kwBox)

    // ── CONTENT ──
    const topOff = headerH + 1
    const contentArea = abs(topOff, 3, 3, 8, { overflow: 'hidden' })

    if (stype === 'big_stat') {
      // Large stat number
      const statWrap = div({ display: 'flex', alignItems: 'flex-start', gap: 2 * u + 'px', marginBottom: 2 * u + 'px' })
      const svEl = ed(div({
        fontSize: t.id === 'minimal' ? 9 * u + 'px' : 7 * u + 'px',
        fontWeight: '900', color: t.statColor, lineHeight: '1',
        textShadow: isDark ? `0 0 30px ${t.accent}60` : 'none',
      }), 'stat_value')
      svEl.textContent = slide.stat_value || '0'
      statWrap.appendChild(svEl)
      contentArea.appendChild(statWrap)

      const sdEl = ed(div({
        fontSize: 1.8 * u + 'px', color: t.subtleText,
        marginBottom: 2.5 * u + 'px', fontWeight: '500',
      }), 'stat_desc')
      sdEl.textContent = slide.stat_description || ''
      contentArea.appendChild(sdEl)

      buls.forEach((b, j) => {
        const row = div({ display: 'flex', gap: u + 'px', marginBottom: 1.2 * u + 'px', alignItems: 'flex-start' })
        const dot = div({
          width: Math.max(5, 0.5 * u) + 'px', height: Math.max(5, 0.5 * u) + 'px',
          borderRadius: '50%', background: t.bulletDot, flexShrink: '0', marginTop: 0.5 * u + 'px',
        })
        const bEl = ed(div({ fontSize: 1.5 * u + 'px', color: t.bodyText, lineHeight: '1.5', flex: '1' }), `bullet-${j}`)
        bEl.setAttribute('data-bullet', '')
        bEl.textContent = b
        row.append(dot, bEl); contentArea.appendChild(row)
      })

    } else if (stype === 'three_cards') {
      contentArea.style.display = 'flex'
      contentArea.style.gap = 1.8 * u + 'px'
      ;(slide.cards || []).slice(0, 3).forEach((c, k) => {
        const card = div({
          flex: '1', background: t.cardBg,
          borderRadius: u + 'px', padding: 2 * u + 'px',
          border: `1.5px solid ${t.cardBorder}`,
          boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column',
        })
        // Card number badge
        const badge = div({
          width: 3 * u + 'px', height: 3 * u + 'px', borderRadius: '50%',
          background: t.accent, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 1.3 * u + 'px', fontWeight: '800', marginBottom: u + 'px', flexShrink: '0',
        })
        badge.textContent = String(k + 1)
        const ctEl = ed(div({
          fontSize: 1.7 * u + 'px', fontWeight: '700', color: t.bodyText,
          marginBottom: 0.8 * u + 'px', lineHeight: '1.3',
        }), `card-title-${k}`)
        ctEl.setAttribute('data-card-title', '')
        ctEl.textContent = c.card_title || ''
        const cvEl = ed(div({ fontSize: 1.35 * u + 'px', color: t.subtleText, lineHeight: '1.6', flex: '1' }), `card-content-${k}`)
        cvEl.setAttribute('data-card-content', '')
        cvEl.textContent = c.card_content || ''
        card.append(badge, ctEl, cvEl); contentArea.appendChild(card)
      })

    } else if (stype === 'timeline') {
      ;(slide.timeline_steps || []).slice(0, 4).forEach((s, k) => {
        const row = div({ display: 'flex', gap: 2 * u + 'px', marginBottom: 2.5 * u + 'px', alignItems: 'flex-start' })
        const numWrap = div({ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: '0' })
        const num = div({
          width: 4 * u + 'px', height: 4 * u + 'px', borderRadius: '50%',
          background: t.accent, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 1.5 * u + 'px', fontWeight: '800',
          boxShadow: `0 0 0 ${0.4 * u}px ${t.accent}30`,
        })
        num.textContent = String(k + 1)
        numWrap.appendChild(num)
        if (k < 3) {
          const line = div({
            width: '2px', flex: '1', minHeight: u + 'px',
            background: t.accent + '30', marginTop: 0.4 * u + 'px',
          })
          numWrap.appendChild(line)
        }
        const wrap = div({ flex: '1' })
        const tstEl = ed(div({
          fontSize: 1.8 * u + 'px', fontWeight: '700', color: t.bodyText, lineHeight: '1.3',
        }), `step-title-${k}`)
        tstEl.setAttribute('data-step-title', '')
        tstEl.textContent = s.step_title || ''
        const tsdEl = ed(div({
          fontSize: 1.4 * u + 'px', color: t.subtleText,
          marginTop: 0.4 * u + 'px', lineHeight: '1.5',
        }), `step-desc-${k}`)
        tsdEl.setAttribute('data-step-desc', '')
        tsdEl.textContent = s.step_desc || ''
        wrap.append(tstEl, tsdEl)
        row.append(numWrap, wrap); contentArea.appendChild(row)
      })

    } else {
      const isTwo = stype === 'two_column'
      const half = isTwo ? Math.ceil(buls.length / 2) : buls.length
      const makeBuls = (list: string[], offset: number, target: HTMLElement) => {
        list.forEach((b, ri) => {
          const j = offset + ri
          const row = div({ display: 'flex', gap: u + 'px', marginBottom: 1.6 * u + 'px', alignItems: 'flex-start' })
          let dotEl: HTMLElement
          if (t.id === 'minimal') {
            dotEl = div({
              width: 1.5 * u + 'px', height: 0.2 * u + 'px',
              background: t.bulletDot, flexShrink: '0', marginTop: 1.0 * u + 'px', borderRadius: '1px',
            })
          } else {
            dotEl = div({
              width: Math.max(5, 0.6 * u) + 'px', height: Math.max(5, 0.6 * u) + 'px',
              borderRadius: '50%', background: t.bulletDot,
              flexShrink: '0', marginTop: 0.55 * u + 'px',
              boxShadow: isDark ? `0 0 6px ${t.accent}80` : 'none',
            })
          }
          const bEl = ed(div({
            fontSize: 1.65 * u + 'px', color: t.bodyText, lineHeight: '1.55', flex: '1',
          }), `bullet-${j}`)
          bEl.setAttribute('data-bullet', '')
          bEl.textContent = b
          row.append(dotEl, bEl); target.appendChild(row)
        })
      }
      if (isTwo) {
        contentArea.style.display = 'flex'
        contentArea.style.gap = 4 * u + 'px'
        const col1 = div({ flex: '1' }), col2 = div({ flex: '1' })
        makeBuls(buls.slice(0, half), 0, col1)
        makeBuls(buls.slice(half), half, col2)
        contentArea.append(col1, col2)
      } else {
        makeBuls(buls, 0, contentArea)
      }
    }

    cv.appendChild(contentArea)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide._id, slide.slide_type, theme.id])

  return (
    <div ref={containerRef} className="w-full rounded-xl overflow-hidden"
      style={{ boxShadow: theme.id === 'dark' ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 40px rgba(0,0,0,0.12)' }}
    />
  )
}
