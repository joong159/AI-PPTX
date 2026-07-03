'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/templates'
import type { Template } from '@/lib/templates'

const THEME_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  modern:    { bg: '#F8F9FF', accent: '#4F46E5', text: '#1e293b' },
  dark:      { bg: '#0F172A', accent: '#0EA5E9', text: '#e2e8f0' },
  gradient:  { bg: '#FAF5FF', accent: '#7C3AED', text: '#1e1b4b' },
  minimal:   { bg: '#ffffff', accent: '#1e293b', text: '#374151' },
  corporate: { bg: '#F8FAFC', accent: '#475569', text: '#0f172a' },
  creative:  { bg: '#ECFDF5', accent: '#059669', text: '#064e3b' },
}

function MiniSlidePreview({ template }: { template: Template }) {
  const colors = THEME_COLORS[template.themeId] || THEME_COLORS.modern
  const acc = template.accentColor || colors.accent
  const firstSlide = template.data.slides[0]
  const secondSlide = template.data.slides[1]

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-md" style={{ paddingTop: '56.25%', background: colors.bg }}>
      <div className="absolute inset-0 flex flex-col gap-1 p-0">
        {/* First slide */}
        <div className="flex-1 relative overflow-hidden" style={{ background: colors.bg }}>
          <div className="absolute inset-x-0 top-0 h-[28%] flex items-center px-3" style={{ background: acc }}>
            <span className="text-white font-bold truncate" style={{ fontSize: '7px' }}>{firstSlide?.title}</span>
          </div>
          <div className="absolute inset-x-0 top-[30%] px-3 space-y-1">
            {(firstSlide?.bullets || []).slice(0, 3).map((b, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: acc }} />
                <div className="truncate" style={{ fontSize: '5px', color: colors.text + 'cc' }}>{b}</div>
              </div>
            ))}
            {firstSlide?.slide_type === 'big_stat' && (
              <div style={{ fontSize: '18px', fontWeight: 900, color: acc, lineHeight: 1 }}>
                {firstSlide.stat_value}
              </div>
            )}
            {firstSlide?.slide_type === 'section_header' && (
              <div className="text-center mt-2" style={{ fontSize: '9px', fontWeight: 700, color: colors.text }}>
                {firstSlide.summary}
              </div>
            )}
          </div>
        </div>
        {/* Second slide preview (tiny strip) */}
        {secondSlide && (
          <div className="h-[18%] relative overflow-hidden border-t border-black/5" style={{ background: secondSlide.slide_type === 'section_header' ? acc : colors.bg }}>
            <div className="absolute inset-0 flex items-center px-3">
              <span className="truncate font-semibold" style={{
                fontSize: '5px',
                color: secondSlide.slide_type === 'section_header' ? 'white' : colors.text,
              }}>{secondSlide.title}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TemplateCard({ template, onUse }: { template: Template; onUse: (t: Template) => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="group rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-200"
      style={{ borderColor: hovered ? template.accentColor : '#e5e7eb' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onUse(template)}
    >
      <div className="p-3">
        <MiniSlidePreview template={template} />
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{template.emoji}</span>
            <div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{template.name}</h3>
              <span className="text-xs text-gray-400">{template.data.slides.length}개 슬라이드</span>
            </div>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: template.accentColor + '15', color: template.accentColor }}
          >
            {template.category}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{template.description}</p>
        <button
          className="mt-3 w-full py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: template.accentColor }}
          onClick={(e) => { e.stopPropagation(); onUse(template) }}
        >
          이 템플릿 사용하기
        </button>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string>('전체')
  const [search, setSearch] = useState('')

  const categories = ['전체', ...TEMPLATE_CATEGORIES]

  const filtered = TEMPLATES.filter(t => {
    const matchCat = activeCategory === '전체' || t.category === activeCategory
    const matchSearch = !search || t.name.includes(search) || t.description.includes(search)
    return matchCat && matchSearch
  })

  function handleUse(template: Template) {
    const encoded = encodeURIComponent(JSON.stringify(template.data))
    router.push(`/editor?template=${encoded}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SlideAI
            </a>
            <span className="text-gray-200">|</span>
            <span className="text-gray-600 font-medium">템플릿 갤러리</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/editor" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              빈 슬라이드 시작
            </a>
            <a
              href="/editor"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              에디터 열기
            </a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-b from-indigo-50 to-gray-50 py-12 text-center">
        <h1 className="text-4xl font-black text-gray-900 mb-3">
          프로 디자이너가 만든 <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">템플릿</span>
        </h1>
        <p className="text-gray-500 text-lg mb-6">클릭 한 번으로 전문적인 발표 자료를 시작하세요</p>
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="템플릿 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-5 py-3 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-indigo-400 text-sm bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400">{filtered.length}개 템플릿</span>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(t => (
              <TemplateCard key={t.id} template={t} onUse={handleUse} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium">검색 결과가 없습니다</p>
            <p className="text-sm mt-1">다른 키워드로 검색해보세요</p>
          </div>
        )}

        {/* AI CTA */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-10 text-center text-white">
          <h2 className="text-2xl font-black mb-2">원하는 템플릿이 없나요?</h2>
          <p className="text-indigo-200 mb-6">AI가 주제에 맞는 프레젠테이션을 자동으로 생성해드립니다</p>
          <a
            href="/editor"
            className="inline-block px-8 py-3 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors text-sm"
          >
            ✨ AI로 새 발표 만들기
          </a>
        </div>
      </div>
    </div>
  )
}
