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

export default function ImageSearchPanel({ onInsert }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ImageResult[]>([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

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

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex gap-1.5">
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(query)}
            placeholder="이미지 검색..."
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-300"
          />
          <button onClick={() => search(query)}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
            검색
          </button>
        </div>

        {/* Quick terms */}
        <div className="flex flex-wrap gap-1 mt-2">
          {QUICK_TERMS.map(t => (
            <button key={t} onClick={() => { setQuery(t); search(t) }}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors">
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
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
  )
}
