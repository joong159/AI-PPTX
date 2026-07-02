'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { Slide } from '@/lib/types'
import type { Theme } from '@/lib/themes'
import type { DesignSettings } from '@/lib/design-settings'
import { getFontCss, getSizeRatio, applyDesignToTheme } from '@/lib/design-settings'
import { getIllustrationSvg, pickIllustration } from '@/lib/illustrations'

interface Props {
  slide: Slide
  theme: Theme
  design?: DesignSettings
  onChange: (updated: Slide) => void
}

export default function SlideCanvas({ slide, theme, design, onChange }: Props) {
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
    const t = design ? applyDesignToTheme(theme, design) : theme
    const stype = slide.slide_type || 'title_and_content'
    const buls = slide.bullets || []
    const kw = slide.key_takeaway || ''
    const isMinimal = t.id === 'minimal'
    const isDark = t.id === 'dark'
    const isGradient = t.id === 'gradient'
    const isCorporate = t.id === 'corporate'
    const isCreative = t.id === 'creative'

    function div(styles: Partial<CSSStyleDeclaration> = {}): HTMLDivElement {
      const d = document.createElement('div')
      Object.assign(d.style, styles)
      return d
    }

    // Canvas wrapper
    container.style.position = 'relative'
    container.style.width = '100%'
    container.style.paddingTop = getSizeRatio(design?.size || '16:9') + '%'
    container.style.fontFamily = getFontCss(design?.font || 'sans')

    const cv = div({
      position: 'absolute', inset: '0', overflow: 'hidden',
      borderRadius: '12px',
      backgroundColor: t.bg,
    })
    container.appendChild(cv)

    // ── BACKGROUND TREATMENT (per theme) ──
    if (t.id === 'modern') {
      // Dot grid pattern
      const pat = div({
        position: 'absolute', inset: '0', pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle, ${t.accent}20 1.5px, transparent 1.5px)`,
        backgroundSize: '24px 24px',
      })
      cv.appendChild(pat)
      // Large decorative ring top-right
      const ring = div({
        position: 'absolute', pointerEvents: 'none',
        width: 38 * u + 'px', height: 38 * u + 'px', borderRadius: '50%',
        border: `${1.5 * u}px solid ${t.accent}18`,
        top: -10 * u + 'px', right: -10 * u + 'px',
      })
      cv.appendChild(ring)
      const ring2 = div({
        position: 'absolute', pointerEvents: 'none',
        width: 22 * u + 'px', height: 22 * u + 'px', borderRadius: '50%',
        border: `${u}px solid ${t.accent}12`,
        top: -3 * u + 'px', right: -3 * u + 'px',
      })
      cv.appendChild(ring2)

    } else if (isDark) {
      // Dark gradient base
      cv.style.background = t.bgGradient || t.bg
      // Subtle grid lines
      const grid = div({
        position: 'absolute', inset: '0', pointerEvents: 'none',
        backgroundImage: `linear-gradient(${t.accent}10 1px, transparent 1px), linear-gradient(90deg, ${t.accent}10 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      })
      cv.appendChild(grid)
      // Glow orb
      const orb = div({
        position: 'absolute', pointerEvents: 'none',
        width: 50 * u + 'px', height: 50 * u + 'px', borderRadius: '50%',
        background: `radial-gradient(circle, ${t.accent}25, transparent 70%)`,
        top: -15 * u + 'px', right: -10 * u + 'px',
      })
      cv.appendChild(orb)

    } else if (isGradient) {
      cv.style.background = '#ffffff'
      // Colorful blur blobs
      const blob1 = div({
        position: 'absolute', pointerEvents: 'none',
        width: 40 * u + 'px', height: 40 * u + 'px', borderRadius: '50%',
        background: '#667eea40',
        filter: `blur(${8 * u}px)`,
        top: -10 * u + 'px', left: -10 * u + 'px',
      })
      cv.appendChild(blob1)
      const blob2 = div({
        position: 'absolute', pointerEvents: 'none',
        width: 30 * u + 'px', height: 30 * u + 'px', borderRadius: '50%',
        background: '#f093fb35',
        filter: `blur(${6 * u}px)`,
        bottom: 5 * u + 'px', right: -5 * u + 'px',
      })
      cv.appendChild(blob2)
      const blob3 = div({
        position: 'absolute', pointerEvents: 'none',
        width: 20 * u + 'px', height: 20 * u + 'px', borderRadius: '50%',
        background: '#f5576c30',
        filter: `blur(${4 * u}px)`,
        top: 30 * u + 'px', right: 20 * u + 'px',
      })
      cv.appendChild(blob3)

    } else if (isMinimal) {
      cv.style.background = '#ffffff'
      // Clean, just a very subtle bottom gradient
      const fade = div({
        position: 'absolute', pointerEvents: 'none',
        bottom: '0', left: '0', right: '0', height: '30%',
        background: 'linear-gradient(to top, #f8fafc, transparent)',
      })
      cv.appendChild(fade)

    } else if (isCorporate) {
      cv.style.background = t.bg
      // Very faint diagonal lines
      const diag = div({
        position: 'absolute', inset: '0', pointerEvents: 'none',
        backgroundImage: `repeating-linear-gradient(135deg, ${t.accent}06 0, ${t.accent}06 1px, transparent 0, transparent 50%)`,
        backgroundSize: '30px 30px',
      })
      cv.appendChild(diag)
      // Left accent bar (thick)
      const leftBar = div({
        position: 'absolute', pointerEvents: 'none',
        left: '0', top: '0', bottom: '0', width: 1.2 * u + 'px',
        background: t.accent,
      })
      cv.appendChild(leftBar)

    } else if (isCreative) {
      cv.style.background = t.bg
      // Scattered geometric shapes
      const shapes = [
        { x: 85, y: 5, s: 12, rot: 15, col: '#f9731620', shape: 'circle' },
        { x: 75, y: 55, s: 8, rot: 45, col: '#ec489920', shape: 'rect' },
        { x: 92, y: 70, s: 6, rot: 20, col: '#8b5cf620', shape: 'circle' },
        { x: 3, y: 80, s: 10, rot: 0, col: '#f9731615', shape: 'rect' },
        { x: 8, y: 10, s: 5, rot: 30, col: '#ec489915', shape: 'circle' },
      ]
      shapes.forEach(sh => {
        const el = div({
          position: 'absolute', pointerEvents: 'none',
          width: sh.s * u + 'px', height: sh.s * u + 'px',
          background: sh.col,
          borderRadius: sh.shape === 'circle' ? '50%' : '20%',
          left: sh.x + '%', top: sh.y + '%',
          transform: `rotate(${sh.rot}deg)`,
        })
        cv.appendChild(el)
      })
    }

    // ── QUOTE SLIDE (special full-page layout) ──
    if (stype === 'quote_slide') {
      const panel = div({
        position: 'absolute', inset: '0',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: `${8 * u}px`,
        textAlign: 'center',
      })
      // Quote mark decoration
      const qMark = div({
        fontSize: 18 * u + 'px', fontWeight: '900', lineHeight: '1',
        color: t.accent + '30', fontFamily: 'Georgia, serif',
        marginBottom: -3 * u + 'px', userSelect: 'none', pointerEvents: 'none',
      })
      qMark.textContent = '"'
      // Accent line
      const accentLine = div({
        width: 6 * u + 'px', height: 0.5 * u + 'px',
        background: t.accent, borderRadius: '2px',
        marginBottom: 3 * u + 'px', flexShrink: '0',
      })
      const quoteEl = ed(div({
        fontSize: 2.8 * u + 'px', fontWeight: '700',
        color: t.bodyText, lineHeight: '1.5',
        maxWidth: '85%',
      }), 'title')
      quoteEl.textContent = slide.title || '여기에 인용문을 입력하세요'
      const closeMark = div({
        fontSize: 18 * u + 'px', fontWeight: '900', lineHeight: '1',
        color: t.accent + '30', fontFamily: 'Georgia, serif',
        marginTop: -3 * u + 'px', userSelect: 'none', pointerEvents: 'none',
        alignSelf: 'flex-end', marginRight: '7%',
      })
      closeMark.textContent = '"'
      const authorEl = ed(div({
        fontSize: 1.6 * u + 'px', color: t.subtleText,
        marginTop: 3 * u + 'px', fontStyle: 'italic',
      }), 'summary')
      authorEl.textContent = slide.summary || '— 출처'

      panel.append(qMark, accentLine, quoteEl, closeMark, authorEl)
      cv.appendChild(panel)
      return
    }

    // ── SECTION HEADER ──
    if (stype === 'section_header') {
      const bg2 = div({
        position: 'absolute', inset: '0',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: `${8 * u}px`,
      })
      if (t.sectionBg.startsWith('linear')) {
        bg2.style.backgroundImage = t.sectionBg
      } else {
        bg2.style.background = t.sectionBg
      }

      // Theme-specific decorations for section header
      if (isCreative) {
        // Large circle in background
        const bigCircle = div({
          position: 'absolute', pointerEvents: 'none',
          width: 60 * u + 'px', height: 60 * u + 'px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
          right: -15 * u + 'px', bottom: -15 * u + 'px',
        })
        bg2.appendChild(bigCircle)
        const smallCircle = div({
          position: 'absolute', pointerEvents: 'none',
          width: 20 * u + 'px', height: 20 * u + 'px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          left: 5 * u + 'px', top: 5 * u + 'px',
        })
        bg2.appendChild(smallCircle)
      } else if (isCorporate) {
        // Gold line at bottom
        const goldLine = div({
          position: 'absolute', bottom: '0', left: '0', right: '0',
          height: 0.8 * u + 'px', background: t.accent,
        })
        bg2.appendChild(goldLine)
      } else {
        // Generic: subtle corner circles
        const c1 = div({
          position: 'absolute', pointerEvents: 'none',
          width: 40 * u + 'px', height: 40 * u + 'px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          top: -8 * u + 'px', right: -8 * u + 'px',
        })
        const c2 = div({
          position: 'absolute', pointerEvents: 'none',
          width: 24 * u + 'px', height: 24 * u + 'px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          bottom: -5 * u + 'px', left: -5 * u + 'px',
        })
        bg2.appendChild(c1)
        bg2.appendChild(c2)
      }

      // Section chip label
      const chip = div({
        display: 'inline-flex', alignItems: 'center',
        background: 'rgba(255,255,255,0.18)',
        borderRadius: 20 * u + 'px', padding: `${0.7 * u}px ${2 * u}px`,
        marginBottom: 3 * u + 'px', backdropFilter: 'blur(4px)',
      })
      const chipTxt = div({ fontSize: 1.1 * u + 'px', color: 'rgba(255,255,255,0.9)', fontWeight: '700', letterSpacing: '0.08em' })
      chipTxt.textContent = 'SECTION'
      chip.appendChild(chipTxt)

      const titleEl = ed(div({
        fontSize: 4.2 * u + 'px', fontWeight: '900', color: t.sectionText,
        lineHeight: '1.2', marginBottom: 2 * u + 'px', maxWidth: '80%',
      }), 'title')
      titleEl.textContent = slide.title || ''

      const line = div({
        width: 5 * u + 'px', height: 0.4 * u + 'px',
        background: 'rgba(255,255,255,0.5)', borderRadius: '2px',
        margin: `${1.5 * u}px auto`,
      })
      const sumEl = ed(div({
        fontSize: 1.8 * u + 'px', color: 'rgba(255,255,255,0.75)',
        maxWidth: '70%', lineHeight: '1.6',
      }), 'summary')
      sumEl.textContent = slide.summary || ''

      bg2.append(chip, titleEl, line, sumEl)
      cv.appendChild(bg2)
      return
    }

    // ── HEADER ──
    let headerH: number

    if (isMinimal) {
      // Minimal: elegant typography, no header bar
      headerH = 20
      const titleArea = div({
        position: 'absolute',
        top: 2 * u + 'px', left: 5 * u + 'px', right: 5 * u + 'px',
        borderBottom: `1.5px solid ${t.accent}`,
        paddingBottom: 2.5 * u + 'px',
      })
      const titleEl = ed(div({
        fontSize: 3 * u + 'px', fontWeight: '800', color: t.bodyText,
        lineHeight: '1.2',
      }), 'title')
      titleEl.textContent = slide.title || ''
      titleArea.appendChild(titleEl)
      cv.appendChild(titleArea)

      // Slide number bottom-right
      const slideNum = div({
        position: 'absolute', bottom: 2 * u + 'px', right: 4 * u + 'px',
        fontSize: 1.2 * u + 'px', color: t.subtleText, fontWeight: '300',
        userSelect: 'none', pointerEvents: 'none',
      })
      slideNum.textContent = String((slide.slide_index || 0) + 1)
      cv.appendChild(slideNum)

    } else {
      // Standard themed header
      headerH = 20

      const hdr = div({
        position: 'absolute', top: '0', left: '0', right: '0',
        height: headerH * u + 'px',
        display: 'flex', alignItems: 'center',
        padding: `0 ${5 * u}px`,
        overflow: 'hidden',
      })

      // Theme-specific header background
      if (isCreative) {
        hdr.style.backgroundImage = t.headerGradient || t.headerBg
        hdr.style.clipPath = `polygon(0 0, 100% 0, 97% 100%, 0 100%)`
        hdr.style.paddingRight = 8 * u + 'px'
      } else if (isCorporate) {
        hdr.style.background = t.headerBg
        // Gold bottom line
        const goldLine = div({
          position: 'absolute', bottom: '0', left: '0', right: '0',
          height: 0.6 * u + 'px', background: t.accent,
        })
        hdr.appendChild(goldLine)
      } else if (isDark) {
        if (t.headerGradient) {
          hdr.style.backgroundImage = t.headerGradient
        } else {
          hdr.style.background = t.headerBg
        }
        // Glow line at bottom
        const glowLine = div({
          position: 'absolute', bottom: '0', left: '0', right: '0',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)`,
        })
        hdr.appendChild(glowLine)
      } else if (isGradient) {
        if (t.headerGradient) {
          hdr.style.backgroundImage = t.headerGradient
        } else {
          hdr.style.background = t.headerBg
        }
        // Diagonal clip for gradient theme
        hdr.style.clipPath = `polygon(0 0, 100% 0, 100% 85%, 0 100%)`
        headerH = 22
        hdr.style.height = headerH * u + 'px'
      } else {
        // Modern
        if (t.headerGradient) {
          hdr.style.backgroundImage = t.headerGradient
        } else {
          hdr.style.background = t.headerBg
        }
      }

      const titleEl = ed(div({
        fontSize: 2.4 * u + 'px', fontWeight: '800', color: t.headerText,
        flex: '1', overflow: 'hidden', lineHeight: '1.3', position: 'relative', zIndex: '1',
        textShadow: isDark ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
      }), 'title')
      titleEl.textContent = slide.title || ''
      hdr.appendChild(titleEl)
      cv.appendChild(hdr)
    }

    // ── KEY TAKEAWAY (bottom bar) ──
    const kwBottom = div({
      position: 'absolute', left: isMinimal ? 5 * u + 'px' : '0', right: '0',
      bottom: '0', height: 8 * u + 'px',
      display: 'flex', alignItems: 'center',
      padding: `0 ${4 * u}px`,
      gap: 0.8 * u + 'px',
    })
    if (isDark) {
      kwBottom.style.background = t.accent + '20'
      kwBottom.style.backdropFilter = 'blur(8px)'
    } else if (isCorporate) {
      kwBottom.style.background = t.headerBg + '08'
      kwBottom.style.borderTop = `1px solid ${t.accent}40`
    } else {
      kwBottom.style.background = t.accent + '12'
    }
    const kwIcon = div({ fontSize: 1.3 * u + 'px', flexShrink: '0', userSelect: 'none' })
    kwIcon.textContent = '💡'
    const kwEl = ed(div({
      fontSize: 1.3 * u + 'px', color: t.kwText, flex: '1',
      fontWeight: '500', overflow: 'hidden',
    }), 'key_takeaway')
    kwEl.textContent = kw || '핵심 메시지'
    kwBottom.append(kwIcon, kwEl)
    cv.appendChild(kwBottom)

    // ── CONTENT AREA ──
    const topOff = headerH + 1.5
    const contentArea = div({
      position: 'absolute',
      top: topOff * u + 'px',
      left: isCorporate ? 3.5 * u + 'px' : 3 * u + 'px',
      right: 3 * u + 'px',
      bottom: 9 * u + 'px',
      overflow: 'hidden',
    })

    // ── BULLET helper (theme-specific styles) ──
    function makeBulletRow(text: string, idx: number, target: HTMLElement) {
      const row = div({ display: 'flex', gap: 1.2 * u + 'px', marginBottom: 1.8 * u + 'px', alignItems: 'flex-start' })
      let markerEl: HTMLElement

      if (t.id === 'modern') {
        // Numbered circle badge
        markerEl = div({
          width: 2.5 * u + 'px', height: 2.5 * u + 'px', borderRadius: '50%',
          background: t.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 1.1 * u + 'px', fontWeight: '800', flexShrink: '0',
          marginTop: 0.2 * u + 'px',
        })
        markerEl.textContent = String(idx + 1)
      } else if (isDark) {
        markerEl = div({
          width: 0.7 * u + 'px', height: 0.7 * u + 'px', borderRadius: '50%',
          background: t.accent, flexShrink: '0', marginTop: 0.65 * u + 'px',
          boxShadow: `0 0 6px ${t.accent}`,
        })
      } else if (isGradient) {
        markerEl = div({
          width: 0.4 * u + 'px', height: 1.6 * u + 'px', borderRadius: '2px',
          background: `linear-gradient(135deg, #667eea, #764ba2)`,
          flexShrink: '0', marginTop: 0.3 * u + 'px',
        })
      } else if (isMinimal) {
        markerEl = div({
          width: 1.8 * u + 'px', height: 0.15 * u + 'px',
          background: t.accent, flexShrink: '0', marginTop: 0.9 * u + 'px',
        })
      } else if (isCorporate) {
        markerEl = div({
          width: 0.55 * u + 'px', height: 0.55 * u + 'px',
          background: t.accent, flexShrink: '0', marginTop: 0.7 * u + 'px',
          borderRadius: '1px',
        })
      } else if (isCreative) {
        // Rotating colored circles
        const colors = ['#f97316', '#ec4899', '#8b5cf6', '#0ea5e9', '#10b981']
        markerEl = div({
          width: 0.8 * u + 'px', height: 0.8 * u + 'px', borderRadius: '50%',
          background: colors[idx % colors.length], flexShrink: '0', marginTop: 0.5 * u + 'px',
        })
      } else {
        markerEl = div({
          width: 0.6 * u + 'px', height: 0.6 * u + 'px', borderRadius: '50%',
          background: t.bulletDot, flexShrink: '0', marginTop: 0.6 * u + 'px',
        })
      }

      const bEl = ed(div({
        fontSize: 1.65 * u + 'px', color: t.bodyText,
        lineHeight: '1.55', flex: '1',
        fontWeight: t.id === 'minimal' ? '400' : '400',
      }), `bullet-${idx}`)
      bEl.setAttribute('data-bullet', '')
      bEl.textContent = text
      row.append(markerEl, bEl)
      target.appendChild(row)
    }

    // ── SLIDE TYPE RENDERERS ──

    if (stype === 'big_stat') {
      // Stat number with dramatic sizing
      const statWrap = div({ display: 'flex', alignItems: 'flex-end', gap: u + 'px', marginBottom: 1.5 * u + 'px' })
      const svEl = ed(div({
        fontSize: 9 * u + 'px', fontWeight: '900', color: t.statColor,
        lineHeight: '1',
        textShadow: isDark ? `0 0 30px ${t.accent}60` : 'none',
      }), 'stat_value')
      svEl.textContent = slide.stat_value || '0'
      statWrap.appendChild(svEl)
      contentArea.appendChild(statWrap)

      const sdEl = ed(div({
        fontSize: 1.8 * u + 'px', color: t.subtleText,
        marginBottom: 3 * u + 'px', fontWeight: '500',
      }), 'stat_desc')
      sdEl.textContent = slide.stat_description || ''
      contentArea.appendChild(sdEl)

      // Context line above bullets
      const dividerLine = div({
        width: 5 * u + 'px', height: 0.3 * u + 'px',
        background: t.accent, borderRadius: '2px', marginBottom: 2 * u + 'px',
      })
      contentArea.appendChild(dividerLine)

      buls.forEach((b, j) => makeBulletRow(b, j, contentArea))

    } else if (stype === 'three_cards') {
      contentArea.style.display = 'flex'
      contentArea.style.gap = 1.8 * u + 'px'
      ;(slide.cards || []).slice(0, 3).forEach((c, k) => {
        const card = div({
          flex: '1',
          borderRadius: 1.2 * u + 'px',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          border: `1.5px solid ${t.cardBorder}`,
          background: t.cardBg,
          boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
        })
        // Card color bar at top (theme-specific)
        const colors = isDark
          ? [t.accent, t.accentLight, t.accent + 'aa']
          : isCreative
          ? ['#f97316', '#ec4899', '#8b5cf6']
          : [t.accent, t.accent + 'cc', t.accent + '99']

        const topBar = div({
          height: 0.5 * u + 'px',
          background: colors[k % colors.length],
          flexShrink: '0',
        })
        card.appendChild(topBar)

        const cardBody = div({ padding: `${2 * u}px`, display: 'flex', flexDirection: 'column', flex: '1' })

        // Badge with number
        const badge = div({
          width: 3 * u + 'px', height: 3 * u + 'px', borderRadius: '50%',
          background: colors[k % colors.length], color: 'white',
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
        const cvEl = ed(div({ fontSize: 1.3 * u + 'px', color: t.subtleText, lineHeight: '1.6', flex: '1' }), `card-content-${k}`)
        cvEl.setAttribute('data-card-content', '')
        cvEl.textContent = c.card_content || ''
        cardBody.append(badge, ctEl, cvEl)
        card.appendChild(cardBody)
        contentArea.appendChild(card)
      })

    } else if (stype === 'timeline') {
      ;(slide.timeline_steps || []).slice(0, 4).forEach((s, k) => {
        const row = div({ display: 'flex', gap: 2 * u + 'px', marginBottom: 2.5 * u + 'px', alignItems: 'flex-start' })
        const numWrap = div({ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: '0' })

        // Step number - themed
        const numStyle: Partial<CSSStyleDeclaration> = {
          width: 4 * u + 'px', height: 4 * u + 'px', borderRadius: '50%',
          background: t.accent, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 1.5 * u + 'px', fontWeight: '800',
          boxShadow: isDark ? `0 0 10px ${t.accent}80` : `0 0 0 ${0.4 * u}px ${t.accent}25`,
        }
        if (isCorporate) {
          numStyle.borderRadius = '4px'
          numStyle.background = t.accent
        }
        const num = div(numStyle)
        num.textContent = String(k + 1)
        numWrap.appendChild(num)

        if (k < (slide.timeline_steps?.length ?? 0) - 1) {
          const line = div({
            width: '2px', flex: '1', minHeight: u + 'px',
            background: isDark ? t.accent + '40' : t.accent + '25',
            marginTop: 0.4 * u + 'px',
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
          fontSize: 1.35 * u + 'px', color: t.subtleText,
          marginTop: 0.4 * u + 'px', lineHeight: '1.5',
        }), `step-desc-${k}`)
        tsdEl.setAttribute('data-step-desc', '')
        tsdEl.textContent = s.step_desc || ''
        wrap.append(tstEl, tsdEl)
        row.append(numWrap, wrap)
        contentArea.appendChild(row)
      })

    } else if (stype === 'image_text') {
      // ── IMAGE + TEXT SPLIT LAYOUT ──
      contentArea.style.display = 'flex'
      contentArea.style.gap = 3 * u + 'px'
      contentArea.style.alignItems = 'stretch'

      // Left: SVG illustration panel
      const illName = pickIllustration(slide.title || '')
      const illPanel = div({
        flex: '0 0 42%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: t.accent + '10',
        borderRadius: 1.5 * u + 'px',
        padding: 2 * u + 'px',
      })
      const svgStr = getIllustrationSvg(illName, t.accent)
      illPanel.innerHTML = svgStr
      const svgEl = illPanel.querySelector('svg')
      if (svgEl) {
        svgEl.style.width = '100%'
        svgEl.style.height = 'auto'
        svgEl.style.maxHeight = 100 * u + 'px'
      }
      // Caption under illustration
      const caption = ed(div({
        fontSize: 1.2 * u + 'px', color: t.subtleText, textAlign: 'center',
        marginTop: 1.5 * u + 'px', fontStyle: 'italic', lineHeight: '1.4',
      }), 'summary')
      caption.textContent = slide.summary || illName
      illPanel.appendChild(caption)

      // Right: text content
      const textCol = div({ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' })
      buls.forEach((b, i) => makeBulletRow(b, i, textCol))

      contentArea.append(illPanel, textCol)

    } else if (stype === 'comparison') {
      // ── A vs B COMPARISON LAYOUT ──
      contentArea.style.display = 'flex'
      contentArea.style.gap = 0 + 'px'
      contentArea.style.alignItems = 'stretch'

      const cards = slide.cards || [
        { card_title: '옵션 A', card_content: '' },
        { card_title: '옵션 B', card_content: '' },
      ]
      const leftCard = cards[0] || { card_title: '옵션 A', card_content: '' }
      const rightCard = cards[1] || { card_title: '옵션 B', card_content: '' }

      const sideStyles = [
        { bg: t.accent + '15', border: t.accent, headerBg: t.accent, headerText: '#fff' },
        { bg: t.accent + '08', border: t.accent + '60', headerBg: t.bg, headerText: t.bodyText },
      ]

      ;[leftCard, rightCard].forEach((card, k) => {
        const ss = sideStyles[k]
        const col = div({
          flex: '1', display: 'flex', flexDirection: 'column',
          background: ss.bg,
          borderRadius: 1.5 * u + 'px',
          border: `2px solid ${ss.border}`,
          overflow: 'hidden',
          marginLeft: k === 1 ? 2 * u + 'px' : '0',
        })
        // Column header
        const colHdr = div({
          background: ss.headerBg, padding: `${1.5 * u}px ${2 * u}px`,
          display: 'flex', alignItems: 'center', gap: u + 'px',
        })
        const badge = div({
          width: 3 * u + 'px', height: 3 * u + 'px', borderRadius: '50%',
          background: k === 0 ? '#fff' : t.accent,
          color: k === 0 ? t.accent : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 1.3 * u + 'px', fontWeight: '900', flexShrink: '0',
        })
        badge.textContent = k === 0 ? 'A' : 'B'
        const colTitle = ed(div({
          fontSize: 1.8 * u + 'px', fontWeight: '800', color: ss.headerText, flex: '1',
        }), `card-title-${k}`)
        colTitle.setAttribute('data-card-title', '')
        colTitle.textContent = card.card_title || ''
        colHdr.append(badge, colTitle)
        col.appendChild(colHdr)

        // Content area
        const colBody = div({ padding: `${1.5 * u}px ${2 * u}px`, flex: '1' })
        const colContent = ed(div({
          fontSize: 1.4 * u + 'px', color: t.bodyText, lineHeight: '1.7', whiteSpace: 'pre-wrap',
        }), `card-content-${k}`)
        colContent.setAttribute('data-card-content', '')
        colContent.textContent = card.card_content || ''
        colBody.appendChild(colContent)
        col.appendChild(colBody)
        contentArea.appendChild(col)
      })

      // VS badge in center
      const vsBadge = div({
        position: 'absolute',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 4 * u + 'px', height: 4 * u + 'px', borderRadius: '50%',
        background: t.accent, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 1.3 * u + 'px', fontWeight: '900',
        boxShadow: `0 0 0 ${0.5 * u}px ${t.bg}, 0 0 0 ${u}px ${t.accent}50`,
        zIndex: '5', pointerEvents: 'none',
      })
      vsBadge.textContent = 'VS'
      contentArea.style.position = 'relative'
      contentArea.appendChild(vsBadge)

    } else {
      // title_and_content, two_column, team_grid → bullet-based
      const isTwo = stype === 'two_column'
      const half = isTwo ? Math.ceil(buls.length / 2) : buls.length

      if (isTwo) {
        contentArea.style.display = 'flex'
        contentArea.style.gap = 4 * u + 'px'
        const col1 = div({ flex: '1' })
        const col2 = div({ flex: '1' })
        buls.slice(0, half).forEach((b, i) => makeBulletRow(b, i, col1))
        buls.slice(half).forEach((b, i) => makeBulletRow(b, half + i, col2))
        contentArea.append(col1, col2)
      } else {
        buls.forEach((b, i) => makeBulletRow(b, i, contentArea))
      }
    }

    cv.appendChild(contentArea)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide._id, slide.slide_type, theme.id, design?.size, design?.font, design?.paletteId, design?.bgColor])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ boxShadow: theme.id === 'dark' ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 40px rgba(0,0,0,0.12)' }}
    />
  )
}
