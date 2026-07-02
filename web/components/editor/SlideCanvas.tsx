'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { Slide } from '@/lib/types'

interface Props {
  slide: Slide
  accent: string
  onChange: (updated: Slide) => void
}

const BG = '#F8F9FF'
const TXT = '#1e293b'

export default function SlideCanvas({ slide, accent, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleChange = useCallback(() => {
    if (!containerRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (!containerRef.current) return
      const get = (id: string) => {
        const el = containerRef.current!.querySelector(`[data-id="${id}"]`) as HTMLElement | null
        return el?.innerText.replace(/\n/g, ' ').trim() ?? null
      }

      const updated: Slide = JSON.parse(JSON.stringify(slide))
      const title = get('title')
      if (title !== null) updated.title = title
      const summary = get('summary')
      if (summary !== null) updated.summary = summary
      const sv = get('stat_value')
      if (sv !== null) updated.stat_value = sv
      const sd = get('stat_desc')
      if (sd !== null) updated.stat_description = sd
      const kw = get('key_takeaway')
      if (kw !== null) updated.key_takeaway = kw

      const buls = containerRef.current!.querySelectorAll('[data-bullet]')
      if (buls.length) updated.bullets = Array.from(buls).map(el => (el as HTMLElement).innerText.replace(/\n/g, ' ').trim())

      const cts = containerRef.current!.querySelectorAll('[data-card-title]')
      const cvs = containerRef.current!.querySelectorAll('[data-card-content]')
      if (cts.length && updated.cards) {
        updated.cards = Array.from(cts).map((el, i) => ({
          card_title: (el as HTMLElement).innerText.replace(/\n/g, ' ').trim(),
          card_content: (cvs[i] as HTMLElement | undefined)?.innerText.replace(/\n/g, ' ').trim() ?? '',
        }))
      }

      const tsts = containerRef.current!.querySelectorAll('[data-step-title]')
      const tsds = containerRef.current!.querySelectorAll('[data-step-desc]')
      if (tsts.length && updated.timeline_steps) {
        updated.timeline_steps = Array.from(tsts).map((el, i) => ({
          step_title: (el as HTMLElement).innerText.replace(/\n/g, ' ').trim(),
          step_desc: (tsds[i] as HTMLElement | undefined)?.innerText.replace(/\n/g, ' ').trim() ?? '',
        }))
      }

      onChange(updated)
    }, 800)
  }, [slide, onChange])

  function ed(el: HTMLElement, dataAttr: string, value: string): HTMLElement {
    el.setAttribute('contenteditable', 'true')
    el.setAttribute('spellcheck', 'false')
    el.dataset[dataAttr.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = ''
    el.setAttribute('data-' + dataAttr, '')
    el.textContent = value
    el.addEventListener('input', scheduleChange)
    el.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter' && !(e as KeyboardEvent).shiftKey) {
        e.preventDefault()
        ;(e.target as HTMLElement).blur()
      }
    })
    el.style.outline = 'none'
    el.style.cursor = 'text'
    el.style.whiteSpace = 'pre-wrap'
    el.style.wordBreak = 'break-word'
    return el
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''

    const W = container.offsetWidth || 720
    const u = W / 100
    const stype = slide.slide_type || 'title_and_content'
    const buls = slide.bullets || []
    const kw = slide.key_takeaway || ''

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

    container.style.background = BG
    container.style.position = 'relative'
    container.style.width = '100%'
    container.style.paddingTop = '56.25%'

    const cv = div({ position: 'absolute', inset: '0', background: BG, borderRadius: '8px', overflow: 'hidden' })
    container.appendChild(cv)

    // Key takeaway bar
    if (stype !== 'section_header') {
      const kwBox = abs(null, 3, 3, 1.5, {
        background: accent + '18',
        borderRadius: 0.5 * u + 'px',
        padding: `${0.8 * u}px ${1.5 * u}px`,
        borderLeft: `${0.3 * u}px solid ${accent}`,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5 * u + 'px',
      })
      const kwIcon = div({ fontSize: 1.4 * u + 'px', flexShrink: '0', userSelect: 'none' })
      kwIcon.textContent = '💡'
      const kwEl = ed(
        div({ fontSize: 1.4 * u + 'px', color: '#555', flex: '1', minHeight: 1.8 * u + 'px' }),
        'key-takeaway', kw || '핵심 메시지'
      )
      kwBox.append(kwIcon, kwEl)
      cv.appendChild(kwBox)
    }

    if (stype === 'section_header') {
      const bg2 = abs(0, 0, 0, 0, {
        background: accent,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 8 * u + 'px',
      })
      const titleEl = ed(div({ fontSize: 3.5 * u + 'px', fontWeight: '800', color: 'white', lineHeight: '1.3', marginBottom: 2 * u + 'px' }), 'title', slide.title || '')
      const line = div({ width: 8 * u + 'px', height: '3px', background: 'rgba(255,255,255,0.5)', borderRadius: '2px', margin: `${2 * u}px auto` })
      const sumEl = ed(div({ fontSize: 1.8 * u + 'px', color: 'rgba(255,255,255,0.85)' }), 'summary', slide.summary || '')
      bg2.append(titleEl, line, sumEl)
      cv.appendChild(bg2)
      return
    }

    // Header bar
    const hdr = abs(0, 0, 0, null, { height: 18 * u + 'px', background: accent, display: 'flex', alignItems: 'center', padding: `0 ${5 * u}px` })
    const titleEl = ed(div({ fontSize: 2.2 * u + 'px', fontWeight: '700', color: 'white', flex: '1', overflow: 'hidden' }), 'title', slide.title || '')
    hdr.appendChild(titleEl)
    cv.appendChild(hdr)

    const contentArea = abs(19, 3, 3, 7, { overflow: 'hidden' })

    if (stype === 'big_stat') {
      const svEl = ed(div({ fontSize: 6 * u + 'px', fontWeight: '900', color: accent, lineHeight: '1', marginBottom: 0.8 * u + 'px' }), 'stat-value', slide.stat_value || '0')
      const sdEl = ed(div({ fontSize: 1.6 * u + 'px', color: '#888', marginBottom: 2 * u + 'px' }), 'stat-desc', slide.stat_description || '')
      contentArea.append(svEl, sdEl)
      buls.forEach((b, j) => {
        const row = div({ display: 'flex', gap: 0.8 * u + 'px', marginBottom: u + 'px', alignItems: 'flex-start' })
        const dot = div({ width: Math.max(5, 0.5 * u) + 'px', height: Math.max(5, 0.5 * u) + 'px', borderRadius: '50%', background: accent, flexShrink: '0', marginTop: 0.4 * u + 'px' })
        const bEl = ed(div({ fontSize: 1.5 * u + 'px', color: '#444', lineHeight: '1.4', flex: '1' }), `bullet-${j}`, b)
        bEl.setAttribute('data-bullet', '')
        row.append(dot, bEl)
        contentArea.appendChild(row)
      })

    } else if (stype === 'three_cards') {
      contentArea.style.display = 'flex'
      contentArea.style.gap = 1.5 * u + 'px'
      ;(slide.cards || []).slice(0, 3).forEach((c, k) => {
        const card = div({ flex: '1', background: accent + '12', borderRadius: 0.8 * u + 'px', padding: 2 * u + 'px', border: `1px solid ${accent}22` })
        const ctEl = ed(div({ fontSize: 1.8 * u + 'px', fontWeight: '700', color: accent, marginBottom: u + 'px' }), `card-title-${k}`, c.card_title || '')
        ctEl.setAttribute('data-card-title', '')
        const cvEl = ed(div({ fontSize: 1.4 * u + 'px', color: '#555', lineHeight: '1.5' }), `card-content-${k}`, c.card_content || '')
        cvEl.setAttribute('data-card-content', '')
        card.append(ctEl, cvEl)
        contentArea.appendChild(card)
      })

    } else if (stype === 'timeline') {
      ;(slide.timeline_steps || []).slice(0, 4).forEach((s, k) => {
        const row = div({ display: 'flex', gap: 1.5 * u + 'px', marginBottom: 2 * u + 'px', alignItems: 'flex-start' })
        const dotWrap = div({ width: Math.max(20, 3.5 * u) + 'px', height: Math.max(20, 3.5 * u) + 'px', borderRadius: '50%', background: accent, flexShrink: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 1.4 * u + 'px', fontWeight: '800' })
        dotWrap.textContent = String(k + 1)
        const wrap = div({ flex: '1' })
        const tstEl = ed(div({ fontSize: 1.8 * u + 'px', fontWeight: '700', color: TXT }), `step-title-${k}`, s.step_title || '')
        tstEl.setAttribute('data-step-title', '')
        const tsdEl = ed(div({ fontSize: 1.4 * u + 'px', color: '#888', marginTop: 0.3 * u + 'px' }), `step-desc-${k}`, s.step_desc || '')
        tsdEl.setAttribute('data-step-desc', '')
        wrap.append(tstEl, tsdEl)
        row.append(dotWrap, wrap)
        contentArea.appendChild(row)
      })

    } else {
      const isTwo = stype === 'two_column'
      const half = isTwo ? Math.ceil(buls.length / 2) : buls.length
      const makeBuls = (list: string[], offset: number, target: HTMLElement) => {
        list.forEach((b, ri) => {
          const j = offset + ri
          const row = div({ display: 'flex', gap: 0.8 * u + 'px', marginBottom: 1.4 * u + 'px', alignItems: 'flex-start' })
          const dot = div({ width: Math.max(5, 0.55 * u) + 'px', height: Math.max(5, 0.55 * u) + 'px', borderRadius: '50%', background: accent, flexShrink: '0', marginTop: 0.5 * u + 'px' })
          const bEl = ed(div({ fontSize: 1.6 * u + 'px', color: '#444', lineHeight: '1.4', flex: '1' }), `bullet-${j}`, b)
          bEl.setAttribute('data-bullet', '')
          row.append(dot, bEl)
          target.appendChild(row)
        })
      }
      if (isTwo) {
        contentArea.style.display = 'flex'
        contentArea.style.gap = 4 * u + 'px'
        const col1 = div({ flex: '1' })
        const col2 = div({ flex: '1' })
        makeBuls(buls.slice(0, half), 0, col1)
        makeBuls(buls.slice(half), half, col2)
        contentArea.append(col1, col2)
      } else {
        makeBuls(buls, 0, contentArea)
      }
    }

    cv.appendChild(contentArea)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide._id, slide.slide_type, accent])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl shadow-lg overflow-hidden"
      style={{ background: BG }}
    />
  )
}
