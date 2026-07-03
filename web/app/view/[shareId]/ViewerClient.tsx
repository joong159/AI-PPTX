'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Presentation } from '@/lib/types'

const PresentationMode = dynamic(() => import('@/components/editor/PresentationMode'), { ssr: false })

interface Props {
  presentation: Presentation
}

export default function ViewerClient({ presentation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [started, setStarted] = useState(false)

  const accent = presentation.accent_color || '#4F46E5'
  const bg = '#F8F9FF'
  const slide = presentation.slides[currentIndex]

  if (started) {
    return (
      <PresentationMode
        slides={presentation.slides}
        accent={accent}
        bg={bg}
        startIndex={currentIndex}
        onClose={() => setStarted(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/10">
        <Link href="/" className="text-lg font-black text-white/80 hover:text-white transition-colors">
          Slide<span style={{ color: accent }}>AI</span>
        </Link>
        <div className="flex items-center gap-2 text-sm text-white/50">
          공유된 프레젠테이션 · {presentation.slides.length}장
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
        {/* Title card */}
        <div className="text-center max-w-2xl">
          <h1 className="text-3xl font-black text-white mb-3">{presentation.title}</h1>
          <p className="text-white/50 text-sm">{presentation.slides.length}개의 슬라이드</p>
        </div>

        {/* Slide grid preview */}
        <div className="flex items-center gap-3 flex-wrap justify-center max-w-3xl">
          {presentation.slides.slice(0, 6).map((s, i) => (
            <button key={s._id} onClick={() => { setCurrentIndex(i); setStarted(true) }}
              className={`w-28 h-16 rounded-xl border-2 flex items-center justify-center text-xs text-white/60 transition-all hover:scale-105 hover:border-white/40 ${i === currentIndex ? 'border-white/50' : 'border-white/10'}`}
              style={{ background: i === 0 ? accent + '30' : '#ffffff08' }}
            >
              <span className="text-[10px] text-center px-1 leading-tight line-clamp-2">{s.title}</span>
            </button>
          ))}
          {presentation.slides.length > 6 && (
            <div className="w-28 h-16 rounded-xl border-2 border-white/10 flex items-center justify-center text-white/30 text-xs">
              +{presentation.slides.length - 6}
            </div>
          )}
        </div>

        {/* Start button */}
        <button
          onClick={() => setStarted(true)}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-100 shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}
        >
          ▶ 발표 시작
        </button>

        <p className="text-white/20 text-xs">← → 방향키 또는 클릭으로 슬라이드 전환</p>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <Link href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors">
          SlideAI로 나만의 프레젠테이션 만들기 →
        </Link>
      </footer>
    </div>
  )
}
