'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Presentation, Slide, SlideType } from '@/lib/types'
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes'
import { DEFAULT_DESIGN, type DesignSettings } from '@/lib/design-settings'
import { createClient, SUPABASE_ENABLED } from '@/lib/supabase'
import type { CanvasTool, CanvasHandle } from '@/components/editor/FabricCanvas'

const FabricCanvas = dynamic(() => import('@/components/editor/FabricCanvas'), { ssr: false })
const CanvasToolBar = dynamic(() => import('@/components/editor/CanvasToolBar'), { ssr: false })
const ObjectPropertiesPanel = dynamic(() => import('@/components/editor/ObjectPropertiesPanel'), { ssr: false })
const SlideList = dynamic(() => import('@/components/editor/SlideList'), { ssr: false })
const AiPanel = dynamic(() => import('@/components/editor/AiPanel'), { ssr: false })
const ThemePicker = dynamic(() => import('@/components/editor/ThemePicker'), { ssr: false })
const DesignPanel = dynamic(() => import('@/components/editor/DesignPanel'), { ssr: false })

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

export default function EditorClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presentationId = searchParams.get('id')
  const templateParam = searchParams.get('template')

  function initPresentation(): Presentation {
    if (templateParam) {
      try { return JSON.parse(decodeURIComponent(templateParam)) as Presentation } catch { /**/ }
    }
    return { title: '새 프레젠테이션', theme: 'modern', accent_color: '#4F46E5', slides: [] }
  }

  const [presentation, setPresentation] = useState<Presentation>(initPresentation)
  const [dbId, setDbId] = useState<string | null>(presentationId)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [topic, setTopic] = useState('')
  const [slideCount, setSlideCount] = useState(6)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [showGenPanel, setShowGenPanel] = useState(!presentationId && !templateParam)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showDesignPanel, setShowDesignPanel] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [themeId, setThemeId] = useState(() => {
    if (templateParam) { try { return (JSON.parse(decodeURIComponent(templateParam)) as Presentation).theme || DEFAULT_THEME_ID } catch { /**/ } }
    return DEFAULT_THEME_ID
  })
  const [design, setDesign] = useState<DesignSettings>(DEFAULT_DESIGN)
  const [loading, setLoading] = useState(!!presentationId)
  const [activeTool, setActiveTool] = useState<CanvasTool>('select')
  const [selectedObject, setSelectedObject] = useState<any | null>(null)

  const canvasHandleRef = useRef<CanvasHandle | null>(null)
  const canvasInstanceRef = useRef<any | null>(null)
  const theme = getTheme(themeId)
  const activeSlide = presentation.slides[activeIndex]
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auth + load presentation
  useEffect(() => {
    if (!SUPABASE_ENABLED) return
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => { if (user) setUserEmail(user.email || null) })

    if (presentationId) {
      sb.from('presentations').select('*').eq('id', presentationId).single()
        .then(({ data, error }) => {
          if (error || !data) { setLoading(false); return }
          setPresentation({ title: data.title, theme: data.theme || 'modern', accent_color: data.accent_color || '#4F46E5', slides: (data.slides as Slide[]) || [] })
          if (data.design) setDesign(data.design as DesignSettings)
          setThemeId(data.theme || DEFAULT_THEME_ID)
          setLoading(false)
        })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveToCloud = useCallback(async (pres: Presentation, des: DesignSettings, tid: string) => {
    if (!SUPABASE_ENABLED || !userEmail) return
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const payload = { user_id: user.id, title: pres.title, theme: tid, accent_color: pres.accent_color || '#4F46E5', slides: pres.slides as unknown as Record<string, unknown>[], design: des as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }
    if (dbId) {
      await sb.from('presentations').update(payload).eq('id', dbId)
    } else {
      const { data } = await sb.from('presentations').insert(payload).select('id').single()
      if (data?.id) { setDbId(data.id); router.replace(`/editor?id=${data.id}`) }
    }
  }, [userEmail, dbId, router])

  const triggerAutoSave = useCallback((pres: Presentation, des: DesignSettings, tid: string) => {
    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => { await saveToCloud(pres, des, tid); setSaveStatus('saved') }, 2000)
  }, [saveToCloud])

  async function generate() {
    if (!topic.trim() || generating) return
    setGenerating(true); setGenError(null)
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, slide_count: slideCount, language: 'Korean' }) })
      const data = await res.json()
      if (data.slides) {
        // Clear fabricState so canvas rebuilds from structured data
        const slides = data.slides.map((s: Slide) => ({ ...s, fabricState: undefined }))
        const updated = { ...presentation, title: data.title || topic, slides }
        setPresentation(updated); setActiveIndex(0); setShowGenPanel(false)
        triggerAutoSave(updated, design, themeId)
      } else {
        setGenError(data.error || 'AI 생성에 실패했습니다.')
      }
    } catch { setGenError('서버 연결에 실패했습니다.') }
    finally { setGenerating(false) }
  }

  const updateSlide = useCallback((updated: Slide) => {
    setPresentation(prev => {
      const slides = [...prev.slides]
      const i = slides.findIndex(s => s._id === updated._id)
      if (i !== -1) slides[i] = updated
      const next = { ...prev, slides }
      triggerAutoSave(next, design, themeId)
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, themeId, triggerAutoSave])

  const updateSlideFromAi = useCallback((updated: Slide) => {
    // Clear fabricState so canvas rebuilds from AI-updated structured data
    updateSlide({ ...updated, fabricState: undefined })
  }, [updateSlide])

  function updateSlideType(index: number, type: SlideType) {
    setPresentation(prev => {
      const slides = [...prev.slides]
      // Clearing fabricState forces canvas to rebuild for new slide type
      slides[index] = { ...slides[index], slide_type: type, fabricState: undefined }
      const next = { ...prev, slides }
      triggerAutoSave(next, design, themeId)
      return next
    })
  }

  function addSlide() {
    const newSlide = BLANK_SLIDE(presentation.slides.length)
    const updated = { ...presentation, slides: [...presentation.slides, newSlide] }
    setPresentation(updated); setActiveIndex(presentation.slides.length)
    triggerAutoSave(updated, design, themeId)
  }

  function deleteSlide(index: number) {
    if (presentation.slides.length <= 1) return
    setPresentation(prev => {
      const slides = prev.slides.filter((_, i) => i !== index)
      const next = { ...prev, slides }
      triggerAutoSave(next, design, themeId)
      return next
    })
    setActiveIndex(Math.max(0, index - 1))
  }

  function moveSlide(from: number, to: number) {
    setPresentation(prev => {
      const slides = [...prev.slides]
      const [removed] = slides.splice(from, 1)
      slides.splice(to, 0, removed)
      const next = { ...prev, slides }
      triggerAutoSave(next, design, themeId)
      return next
    })
    setActiveIndex(to)
  }

  function handleDesignChange(d: DesignSettings) { setDesign(d); triggerAutoSave(presentation, d, themeId) }
  function handleThemeChange(tid: string) { setThemeId(tid); triggerAutoSave(presentation, design, tid) }

  async function handleExport() {
    if (!presentation.slides.length || exporting) return
    setExporting(true)
    try {
      const { exportPptx } = await import('@/lib/export-pptx')
      await exportPptx(presentation, design)
    } catch (err) { console.error('Export error:', err) }
    finally { setExporting(false) }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><div className="text-3xl mb-3">⏳</div><p className="text-gray-500 text-sm">불러오는 중...</p></div>
    </div>
  )

  const accent = design.accentColor || theme.accent || '#4F46E5'
  const bg = design.bgColor || '#F8F9FF'

  // Which right panel to show
  const rightPanel = selectedObject ? 'properties' : showAiPanel ? 'ai' : showDesignPanel ? 'design' : null

  return (
    <div className="relative flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link href={userEmail ? '/dashboard' : '/'} className="text-lg font-bold" style={{ color: '#4F46E5' }}>SlideAI</Link>
          <div className="w-px h-5 bg-gray-200" />
          <input
            value={presentation.title}
            onChange={e => { const updated = { ...presentation, title: e.target.value }; setPresentation(updated); triggerAutoSave(updated, design, themeId) }}
            className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none w-48 focus:bg-gray-50 focus:px-2 rounded transition-all"
          />
          <span className={`text-xs ${saveStatus === 'saving' ? 'text-yellow-500' : 'text-green-500'}`}>
            {saveStatus === 'saving' ? '저장 중...' : userEmail && saveStatus === 'saved' ? '☁️ 저장됨' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs text-gray-400 font-medium">테마</span>
            <ThemePicker currentId={themeId} onChange={handleThemeChange} />
          </div>

          <Link href="/templates" className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            📋 템플릿
          </Link>
          <button onClick={() => setShowGenPanel(!showGenPanel)} className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            ✨ AI 생성
          </button>
          <button
            onClick={() => { setShowAiPanel(!showAiPanel); setShowDesignPanel(false) }}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${showAiPanel ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            💬 AI 편집
          </button>
          <button
            onClick={() => { setShowDesignPanel(!showDesignPanel); setShowAiPanel(false) }}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${showDesignPanel ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            🎨 디자인
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !presentation.slides.length}
            className="text-sm font-medium px-4 py-1.5 rounded-lg text-white transition-opacity disabled:opacity-50"
            style={{ background: '#4F46E5' }}
          >
            {exporting ? '...' : '📥 PPTX'}
          </button>

          {SUPABASE_ENABLED && (
            userEmail
              ? <Link href="/dashboard" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors px-1">대시보드</Link>
              : <Link href="/auth" className="text-sm font-medium px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors">로그인</Link>
          )}
        </div>
      </header>

      {/* Login nudge */}
      {SUPABASE_ENABLED && !userEmail && presentation.slides.length > 0 && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-center gap-3">
          <span className="text-sm text-indigo-700">로그인하면 작업을 자동으로 저장할 수 있습니다.</span>
          <Link href="/auth" className="text-sm font-semibold text-indigo-600 underline hover:text-indigo-800">로그인 / 회원가입</Link>
        </div>
      )}

      {/* AI Generation panel (overlay) */}
      {showGenPanel && (
        <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center" onClick={() => presentation.slides.length && setShowGenPanel(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-gray-900 mb-2">AI로 프레젠테이션 만들기</h2>
            <p className="text-gray-500 text-sm mb-6">주제를 입력하면 AI가 슬라이드를 자동으로 구성합니다.</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">주제 또는 내용</label>
            <textarea
              value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.ctrlKey && generate()}
              placeholder="예: 삼성전자 2024 투자 분석, AI 스타트업 피칭 자료..."
              className="w-full border border-gray-200 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-indigo-400 h-28"
            />
            <div className="mt-4 flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">슬라이드 수</label>
              <div className="flex gap-2">
                {[5, 7, 10, 15].map(n => (
                  <button key={n} onClick={() => setSlideCount(n)}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${slideCount === n ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}>
                    {n}장
                  </button>
                ))}
              </div>
            </div>
            {genError && <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">⚠️ {genError}</div>}
            <div className="mt-4 flex gap-3">
              <button onClick={generate} disabled={generating || !topic.trim()}
                className="flex-1 font-semibold text-white py-3 rounded-xl transition-opacity disabled:opacity-50 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #818CF8)' }}>
                {generating ? '⏳ 생성 중...' : '✨ 프레젠테이션 생성'}
              </button>
              {presentation.slides.length > 0 && (
                <button onClick={() => setShowGenPanel(false)} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">취소</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Slide list */}
        <div className="w-52 flex-shrink-0">
          <SlideList
            slides={presentation.slides}
            activeIndex={activeIndex}
            accent={accent}
            onSelect={i => { setActiveIndex(i); setSelectedObject(null) }}
            onTypeChange={updateSlideType}
            onAddSlide={addSlide}
            onDeleteSlide={deleteSlide}
            onMoveSlide={moveSlide}
          />
        </div>

        {/* Center: Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {presentation.slides.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 p-8">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">프레젠테이션을 시작하세요</h3>
              <p className="text-gray-400 text-sm mb-6">AI로 자동 생성하거나 빈 슬라이드를 추가하세요</p>
              <div className="flex gap-3">
                <button onClick={() => setShowGenPanel(true)} className="font-medium text-white px-5 py-2.5 rounded-xl" style={{ background: '#4F46E5' }}>✨ AI로 생성</button>
                <button onClick={addSlide} className="font-medium text-gray-700 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50">+ 빈 슬라이드</button>
              </div>
            </div>
          ) : activeSlide ? (
            <>
              {/* Tool bar */}
              <CanvasToolBar
                activeTool={activeTool}
                onChange={setActiveTool}
                onUndo={() => canvasHandleRef.current?.undo()}
                onRedo={() => canvasHandleRef.current?.redo()}
                onImageFile={file => canvasHandleRef.current?.addImage(file)}
              />

              {/* Canvas */}
              <div className="flex-1 overflow-auto p-6 flex flex-col items-center gap-4">
                <div className="w-full max-w-4xl">
                  <FabricCanvas
                    key={`${activeSlide._id}-${activeSlide.slide_type}-${activeSlide.title}-${!activeSlide.fabricState}`}
                    slide={activeSlide}
                    design={design}
                    accentColor={accent}
                    bgColor={bg}
                    activeTool={activeTool}
                    onToolReset={() => setActiveTool('select')}
                    onChange={updateSlide}
                    onSelectionChange={obj => {
                      setSelectedObject(obj)
                      if (obj) canvasInstanceRef.current = canvasHandleRef.current?.getCanvas()
                    }}
                    onReady={handle => {
                      canvasHandleRef.current = handle
                      canvasInstanceRef.current = handle.getCanvas()
                    }}
                  />
                </div>

                {/* Slide nav */}
                <div className="flex items-center gap-3">
                  <button onClick={() => { setActiveIndex(i => Math.max(0, i - 1)); setSelectedObject(null) }} disabled={activeIndex === 0}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50">← 이전</button>
                  <span className="text-sm text-gray-500 font-medium">{activeIndex + 1} / {presentation.slides.length}</span>
                  <button onClick={() => { setActiveIndex(i => Math.min(presentation.slides.length - 1, i + 1)); setSelectedObject(null) }} disabled={activeIndex === presentation.slides.length - 1}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50">다음 →</button>
                </div>

                {/* Speaker notes */}
                <div className="w-full max-w-4xl">
                  <textarea
                    value={activeSlide.speaker_notes || ''}
                    onChange={e => updateSlide({ ...activeSlide, speaker_notes: e.target.value })}
                    placeholder="발표자 노트... (청중에게는 보이지 않음)"
                    className="w-full text-sm text-gray-500 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-indigo-300 h-20 bg-white"
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Right: Properties / AI / Design panel */}
        {rightPanel === 'properties' && (
          <ObjectPropertiesPanel
            selectedObject={selectedObject}
            canvas={canvasInstanceRef.current}
            onSave={() => {
              const canvas = canvasHandleRef.current?.getCanvas()
              if (canvas) {
                const json = JSON.stringify(canvas.toJSON(['data']))
                const updated = { ...activeSlide, fabricState: json }
                updateSlide(updated)
              }
            }}
          />
        )}
        {rightPanel === 'ai' && activeSlide && (
          <div className="w-72 flex-shrink-0">
            <AiPanel slide={activeSlide} onUpdateSlide={updateSlideFromAi} />
          </div>
        )}
        {rightPanel === 'design' && (
          <DesignPanel design={design} onChange={handleDesignChange} />
        )}
      </div>
    </div>
  )
}
