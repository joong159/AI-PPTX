'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Presentation, Slide, SlideType } from '@/lib/types'
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes'

const SlideCanvas = dynamic(() => import('@/components/editor/SlideCanvas'), { ssr: false })
const SlideList = dynamic(() => import('@/components/editor/SlideList'), { ssr: false })
const AiPanel = dynamic(() => import('@/components/editor/AiPanel'), { ssr: false })
const ThemePicker = dynamic(() => import('@/components/editor/ThemePicker'), { ssr: false })

const BLANK_SLIDE = (index: number): Slide => ({
  _id: `slide_${Date.now()}_${index}`,
  slide_index: index,
  slide_type: 'title_and_content',
  title: '새 슬라이드',
  summary: '',
  bullets: ['첫 번째 포인트', '두 번째 포인트', '세 번째 포인트'],
  key_takeaway: '핵심 메시지',
  speaker_notes: '',
})

export default function EditorPage() {
  const [presentation, setPresentation] = useState<Presentation>({
    title: '새 프레젠테이션',
    theme: 'modern',
    accent_color: '#4F46E5',
    slides: [],
  })
  const [activeIndex, setActiveIndex] = useState(0)
  const [topic, setTopic] = useState('')
  const [slideCount, setSlideCount] = useState(6)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [showGenPanel, setShowGenPanel] = useState(true)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [aiRevision, setAiRevision] = useState<Record<string, number>>({})
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID)
  const theme = getTheme(themeId)

  const activeSlide = presentation.slides[activeIndex]

  async function generate() {
    if (!topic.trim() || generating) return
    setGenerating(true)
    setGenError(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, slide_count: slideCount, language: 'Korean' }),
      })
      const data = await res.json()
      if (data.slides) {
        setPresentation(prev => ({
          ...prev,
          title: data.title || topic,
          slides: data.slides,
        }))
        setActiveIndex(0)
        setShowGenPanel(false)
      } else {
        setGenError(data.error || 'AI 생성에 실패했습니다. 다시 시도해주세요.')
      }
    } catch {
      setGenError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setGenerating(false)
    }
  }

  const updateSlide = useCallback((updated: Slide) => {
    setSaveStatus('saving')
    setPresentation(prev => {
      const slides = [...prev.slides]
      const i = slides.findIndex(s => s._id === updated._id)
      if (i !== -1) slides[i] = updated
      return { ...prev, slides }
    })
    setTimeout(() => setSaveStatus('saved'), 1000)
  }, [])

  const updateSlideFromAi = useCallback((updated: Slide) => {
    updateSlide(updated)
    setAiRevision(prev => ({ ...prev, [updated._id]: (prev[updated._id] || 0) + 1 }))
  }, [updateSlide])

  function updateSlideType(index: number, type: SlideType) {
    setPresentation(prev => {
      const slides = [...prev.slides]
      slides[index] = { ...slides[index], slide_type: type }
      return { ...prev, slides }
    })
  }

  function addSlide() {
    const newSlide = BLANK_SLIDE(presentation.slides.length)
    setPresentation(prev => ({ ...prev, slides: [...prev.slides, newSlide] }))
    setActiveIndex(presentation.slides.length)
  }

  function deleteSlide(index: number) {
    if (presentation.slides.length <= 1) return
    setPresentation(prev => {
      const slides = prev.slides.filter((_, i) => i !== index)
      return { ...prev, slides }
    })
    setActiveIndex(Math.max(0, index - 1))
  }

  function moveSlide(from: number, to: number) {
    setPresentation(prev => {
      const slides = [...prev.slides]
      const [removed] = slides.splice(from, 1)
      slides.splice(to, 0, removed)
      return { ...prev, slides }
    })
    setActiveIndex(to)
  }

  async function handleExport() {
    if (!presentation.slides.length || exporting) return
    setExporting(true)
    try {
      const { exportPptx } = await import('@/lib/export-pptx')
      await exportPptx(presentation)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold" style={{ color: '#4F46E5' }}>SlideAI</Link>
          <div className="w-px h-5 bg-gray-200" />
          <input
            value={presentation.title}
            onChange={(e) => setPresentation(prev => ({ ...prev, title: e.target.value }))}
            className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none w-48 focus:bg-gray-50 focus:px-2 rounded transition-all"
          />
          <span className={`text-xs ${saveStatus === 'saving' ? 'text-yellow-500' : 'text-gray-400'}`}>
            {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '저장됨' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme picker */}
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs text-gray-400 font-medium">테마</span>
            <ThemePicker currentId={themeId} onChange={setThemeId} />
          </div>

          <button
            onClick={() => setShowGenPanel(!showGenPanel)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ✨ AI 생성
          </button>
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            💬 AI 편집
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !presentation.slides.length}
            className="text-sm font-medium px-4 py-1.5 rounded-lg text-white transition-opacity disabled:opacity-50"
            style={{ background: '#4F46E5' }}
          >
            {exporting ? '내보내는 중...' : '📥 PPTX 저장'}
          </button>
        </div>
      </header>

      {/* AI Generation panel (overlay) */}
      {showGenPanel && (
        <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center" onClick={() => presentation.slides.length && setShowGenPanel(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-gray-900 mb-2">AI로 프레젠테이션 만들기</h2>
            <p className="text-gray-500 text-sm mb-6">주제를 입력하면 AI가 슬라이드를 자동으로 구성합니다.</p>

            <label className="block text-sm font-medium text-gray-700 mb-2">주제 또는 내용</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && generate()}
              placeholder="예: 삼성전자 2024 투자 분석, AI 스타트업 피칭 자료, 탄소중립 로드맵..."
              className="w-full border border-gray-200 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-indigo-400 h-28"
            />

            <div className="mt-4 flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">슬라이드 수</label>
              <div className="flex gap-2">
                {[5, 7, 10, 15].map(n => (
                  <button
                    key={n}
                    onClick={() => setSlideCount(n)}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                      slideCount === n ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {n}장
                  </button>
                ))}
              </div>
            </div>

            {genError && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                ⚠️ {genError}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={generate}
                disabled={generating || !topic.trim()}
                className="flex-1 font-semibold text-white py-3 rounded-xl transition-opacity disabled:opacity-50 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #818CF8)' }}
              >
                {generating ? '⏳ 생성 중...' : '✨ 프레젠테이션 생성'}
              </button>
              {presentation.slides.length > 0 && (
                <button onClick={() => setShowGenPanel(false)} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                  취소
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slide list (left) */}
        <div className="w-52 flex-shrink-0">
          <SlideList
            slides={presentation.slides}
            activeIndex={activeIndex}
            accent={theme.accent}
            onSelect={setActiveIndex}
            onTypeChange={updateSlideType}
            onAddSlide={addSlide}
            onDeleteSlide={deleteSlide}
            onMoveSlide={moveSlide}
          />
        </div>

        {/* Canvas (center) */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center gap-4">
          {presentation.slides.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">프레젠테이션을 시작하세요</h3>
              <p className="text-gray-400 text-sm mb-6">AI로 자동 생성하거나 빈 슬라이드를 추가하세요</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGenPanel(true)}
                  className="font-medium text-white px-5 py-2.5 rounded-xl"
                  style={{ background: '#4F46E5' }}
                >
                  ✨ AI로 생성
                </button>
                <button
                  onClick={addSlide}
                  className="font-medium text-gray-700 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50"
                >
                  + 빈 슬라이드
                </button>
              </div>
            </div>
          ) : activeSlide ? (
            <>
              <div className="w-full max-w-4xl">
                <SlideCanvas
                  key={activeSlide._id + activeSlide.slide_type + themeId + (aiRevision[activeSlide._id] || 0)}
                  slide={activeSlide}
                  theme={theme}
                  onChange={updateSlide}
                />
              </div>

              {/* Slide navigation */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
                  disabled={activeIndex === 0}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50"
                >
                  ← 이전
                </button>
                <span className="text-sm text-gray-500 font-medium">
                  {activeIndex + 1} / {presentation.slides.length}
                </span>
                <button
                  onClick={() => setActiveIndex(i => Math.min(presentation.slides.length - 1, i + 1))}
                  disabled={activeIndex === presentation.slides.length - 1}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50"
                >
                  다음 →
                </button>
              </div>

              {/* Speaker notes */}
              <div className="w-full max-w-4xl">
                <textarea
                  value={activeSlide.speaker_notes || ''}
                  onChange={(e) => updateSlide({ ...activeSlide, speaker_notes: e.target.value })}
                  placeholder="발표자 노트... (청중에게는 보이지 않음)"
                  className="w-full text-sm text-gray-500 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-indigo-300 h-20 bg-white"
                />
              </div>
            </>
          ) : null}
        </div>

        {/* AI panel (right) */}
        {showAiPanel && activeSlide && (
          <div className="w-72 flex-shrink-0">
            <AiPanel slide={activeSlide} onUpdateSlide={updateSlideFromAi} />
          </div>
        )}
      </div>
    </div>
  )
}
