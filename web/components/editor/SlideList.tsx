'use client'

import type { Slide, SlideType } from '@/lib/types'

const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  title_and_content: '📄 내용',
  section_header: '🎯 섹션',
  big_stat: '📊 스탯',
  three_cards: '🃏 카드',
  timeline: '📅 타임라인',
  two_column: '⬛ 2열',
  team_grid: '👥 팀',
  quote_slide: '💬 인용',
}

interface Props {
  slides: Slide[]
  activeIndex: number
  accent: string
  onSelect: (index: number) => void
  onTypeChange: (index: number, type: SlideType) => void
  onAddSlide: () => void
  onDeleteSlide: (index: number) => void
  onMoveSlide: (from: number, to: number) => void
}

export default function SlideList({ slides, activeIndex, accent, onSelect, onTypeChange, onAddSlide, onDeleteSlide, onMoveSlide }: Props) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Header */}
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">슬라이드</span>
        <button
          onClick={onAddSlide}
          className="text-xs font-medium px-2.5 py-1 rounded-lg text-white transition-opacity hover:opacity-80"
          style={{ background: accent }}
        >
          + 추가
        </button>
      </div>

      {/* Slide list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {slides.map((slide, i) => (
          <div
            key={slide._id}
            onClick={() => onSelect(i)}
            className={`group relative rounded-xl p-3 cursor-pointer transition-all border-2 ${
              activeIndex === i
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            {/* Slide number + type badge */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400">{i + 1}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
                {SLIDE_TYPE_LABELS[slide.slide_type] || slide.slide_type}
              </span>
            </div>

            {/* Mini preview */}
            <div
              className="w-full rounded-md overflow-hidden"
              style={{ paddingTop: '56.25%', position: 'relative', background: '#F8F9FF' }}
            >
              <div
                className="absolute inset-0 flex flex-col"
                style={{ background: slide.slide_type === 'section_header' ? accent : '#F8F9FF' }}
              >
                <div
                  className="px-2 py-1 text-white text-xs font-semibold truncate"
                  style={{
                    background: slide.slide_type === 'section_header' ? 'transparent' : accent,
                    fontSize: '8px',
                  }}
                >
                  {slide.title}
                </div>
                <div className="p-1.5 space-y-1">
                  {(slide.bullets || []).slice(0, 3).map((b, j) => (
                    <div key={j} className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: accent + '88' }} />
                      <div className="text-gray-400 truncate" style={{ fontSize: '6px' }}>{b}</div>
                    </div>
                  ))}
                  {slide.slide_type === 'big_stat' && (
                    <div style={{ fontSize: '12px', fontWeight: 900, color: accent }}>{slide.stat_value}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Hover actions */}
            <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); if (i > 0) onMoveSlide(i, i - 1) }}
                className="w-5 h-5 rounded bg-white shadow text-gray-500 hover:text-indigo-600 text-xs flex items-center justify-center"
                title="위로"
              >↑</button>
              <button
                onClick={(e) => { e.stopPropagation(); if (i < slides.length - 1) onMoveSlide(i, i + 1) }}
                className="w-5 h-5 rounded bg-white shadow text-gray-500 hover:text-indigo-600 text-xs flex items-center justify-center"
                title="아래로"
              >↓</button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteSlide(i) }}
                className="w-5 h-5 rounded bg-white shadow text-red-400 hover:text-red-600 text-xs flex items-center justify-center"
                title="삭제"
              >✕</button>
            </div>

            {/* Type switcher */}
            {activeIndex === i && (
              <select
                value={slide.slide_type}
                onChange={(e) => onTypeChange(i, e.target.value as SlideType)}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 w-full text-xs border border-gray-200 rounded-lg p-1.5 bg-white focus:outline-none focus:border-indigo-300"
              >
                {(Object.keys(SLIDE_TYPE_LABELS) as SlideType[]).map((t) => (
                  <option key={t} value={t}>{SLIDE_TYPE_LABELS[t]}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
