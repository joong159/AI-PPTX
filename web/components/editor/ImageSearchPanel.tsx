'use client'

import { useState, useCallback, useRef } from 'react'

interface ImageResult {
  id: string
  thumb: string
  regular: string
  alt: string
  author: string
  source: string
}

interface Props {
  onInsert: (url: string, alt: string) => void
}

const QUICK_TERMS = ['비즈니스', '기술', '자연', '도시', '팀워크', '성장', '미래', '교육']

const AI_STYLES = [
  { label: '전문적', value: 'professional clean corporate' },
  { label: '미래적', value: 'futuristic digital neon' },
  { label: '자연', value: 'nature organic minimal' },
  { label: '플랫', value: 'flat design vector illustration' },
]

export default function ImageSearchPanel({ onInsert }: Props) {
  const [tab, setTab] = useState<'search' | 'ai'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ImageResult[]>([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiStyle, setAiStyle] = useState(AI_STYLES[0].value)
  const [aiImages, setAiImages] = useState<string[]>([])
  const [aiGenerating, setAiGenerating] = useState(false)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true); setNotice('')
    try {
      const res = await fetch(`/api/images?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.images || [])
      if (data.notice) setNotice(data.notice)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  const generateAiImages = useCallback(() => {
    if (!aiPrompt.trim()) return
    setAiGenerating(true)
    // Pollinations.ai generates images via URL — generate 4 variations with different seeds
    const basePrompt = `${aiPrompt.trim()}, ${aiStyle}, no text, no logo`
    const urls = Array.from({ length: 4 }, (_, i) =>
      `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}?width=800&height=500&nologo=true&seed=${Date.now() + i}`
    )
    setAiImages(urls)
    setAiGenerating(false)
  }, [aiPrompt, aiStyle])

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex border-b border-gray-100">
        <button onClick={() => setTab('search')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === 'search' ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
          🔍 검색
        </button>
        <button onClick={() => setTab('ai')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === 'ai' ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
          ✨ AI 생성
        </button>
      </div>

      {tab === 'search' ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex gap-1.5">
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search(query)}
                placeholder="이미지 검색..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-300"
              />
              <button onClick={() => search(query)}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
                검색
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {QUICK_TERMS.map(t => (
                <button key={t} onClick={() => { setQuery(t); search(t) }}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors">
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {notice && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">{notice}</p>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-10 text-gray-400 text-sm">검색 중...</div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <span className="text-3xl">🔍</span>
                <span className="text-sm">위에서 검색어를 입력하세요</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {results.map(img => (
                  <button key={img.id} onClick={() => onInsert(img.regular, img.alt)}
                    className="group relative overflow-hidden rounded-lg aspect-video bg-gray-100 hover:ring-2 hover:ring-indigo-500 transition-all">
                    <img src={img.thumb} alt={img.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">+ 삽입</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 text-[9px] text-white/70 bg-black/40 px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {img.author}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* AI Generation Tab */
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-3 border-b border-gray-100 space-y-2">
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="원하는 이미지 설명 (한글 또는 영어)&#10;예: 미래도시 야경, team collaboration meeting"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-300 resize-none h-20"
            />

            {/* Style selector */}
            <div className="flex gap-1">
              {AI_STYLES.map(s => (
                <button key={s.value} onClick={() => setAiStyle(s.value)}
                  className={`flex-1 py-1 text-xs rounded-lg border transition-colors ${aiStyle === s.value ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {s.label}
                </button>
              ))}
            </div>

            <button
              onClick={generateAiImages}
              disabled={!aiPrompt.trim() || aiGenerating}
              className="w-full py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #818CF8)' }}
            >
              {aiGenerating ? '생성 중...' : '✨ 이미지 생성 (4가지)'}
            </button>

            <p className="text-xs text-gray-400 text-center">Pollinations AI · 무료 · 클릭해서 삽입</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {aiImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <span className="text-3xl">✨</span>
                <span className="text-sm text-center px-4">설명을 입력하고<br/>"이미지 생성"을 눌러보세요</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {aiImages.map((url, i) => (
                  <AiImageCard key={url} url={url} index={i} onInsert={onInsert} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AiImageCard({ url, index, onInsert }: { url: string; index: number; onInsert: (url: string, alt: string) => void }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <button onClick={() => !error && onInsert(url, `AI generated ${index + 1}`)}
      className="group relative overflow-hidden rounded-lg aspect-video bg-gray-100 hover:ring-2 hover:ring-indigo-500 transition-all">
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">생성 실패</div>
      ) : (
        <img
          src={url}
          alt={`AI ${index + 1}`}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      )}
      {loaded && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">+ 삽입</span>
        </div>
      )}
    </button>
  )
}
