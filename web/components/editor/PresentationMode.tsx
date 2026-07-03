'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Slide } from '@/lib/types'
import { renderSlideToDataUrl } from '@/lib/render-slide'

interface Props {
  slides: Slide[]
  accent: string
  bg: string
  startIndex?: number
  onClose: () => void
}

export default function PresentationMode({ slides, accent, bg, startIndex = 0, onClose }: Props) {
  const [current, setCurrent] = useState(startIndex)
  const [images, setImages] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [showControls, setShowControls] = useState(true)

  // Pre-render current + next 2 slides
  const renderSlide = useCallback(async (index: number) => {
    if (images[index] || loading[index] || !slides[index]) return
    setLoading(prev => ({ ...prev, [index]: true }))
    try {
      const url = await renderSlideToDataUrl(slides[index], accent, bg, 1.5)
      setImages(prev => ({ ...prev, [index]: url }))
    } catch (err) {
      console.error('Render error:', err)
    } finally {
      setLoading(prev => ({ ...prev, [index]: false }))
    }
  }, [images, loading, slides, accent, bg])

  useEffect(() => {
    renderSlide(current)
    if (current + 1 < slides.length) renderSlide(current + 1)
    if (current + 2 < slides.length) renderSlide(current + 2)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, slides.length])

  const prev = useCallback(() => setCurrent(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setCurrent(i => Math.min(slides.length - 1, i + 1)), [slides.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev, onClose])

  // Hide controls after 2s of inactivity
  useEffect(() => {
    setShowControls(true)
    const t = setTimeout(() => setShowControls(false), 2500)
    return () => clearTimeout(t)
  }, [current])

  const slide = slides[current]
  const img = images[current]

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onClick={() => setShowControls(v => !v)}
    >
      {/* Slide area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="relative w-full max-w-7xl" style={{ aspectRatio: '16/9' }}>
          {img ? (
            <img src={img} alt={slide?.title} className="w-full h-full object-contain rounded-md" draggable={false} />
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-md" style={{ background: bg }}>
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <div className="w-10 h-10 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">슬라이드 렌더링 중...</span>
              </div>
            </div>
          )}

          {/* Speaker notes overlay (bottom, click to toggle) */}
          {slide?.speaker_notes && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-sm p-3 rounded-b-md opacity-0 hover:opacity-100 transition-opacity">
              {slide.speaker_notes}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className={`absolute inset-x-0 bottom-0 pb-6 flex flex-col items-center gap-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Progress bar */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i) }}
              className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`} />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4 bg-black/60 rounded-2xl px-5 py-2.5 backdrop-blur-sm">
          <button onClick={e => { e.stopPropagation(); prev() }} disabled={current === 0}
            className="text-white/80 hover:text-white disabled:opacity-30 text-lg px-2">◀</button>

          <span className="text-white/80 text-sm font-medium min-w-[70px] text-center">
            {current + 1} / {slides.length}
          </span>

          <button onClick={e => { e.stopPropagation(); next() }} disabled={current === slides.length - 1}
            className="text-white/80 hover:text-white disabled:opacity-30 text-lg px-2">▶</button>

          <div className="w-px h-5 bg-white/20" />

          <button onClick={e => { e.stopPropagation(); onClose() }}
            className="text-white/60 hover:text-white text-sm px-2">
            ✕ 종료
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="text-white/30 text-xs">← → 방향키 · Space · Esc 종료</p>
      </div>

      {/* Left/Right click zones */}
      <div className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize" onClick={e => { e.stopPropagation(); prev() }} />
      <div className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize" onClick={e => { e.stopPropagation(); next() }} />
    </div>
  )
}
