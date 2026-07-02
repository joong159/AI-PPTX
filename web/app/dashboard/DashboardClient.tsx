'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { PresentationRow } from '@/lib/supabase'

interface Props {
  user: { email: string }
  presentations: PresentationRow[]
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

const THEME_COLORS: Record<string, string> = {
  modern: '#4F46E5',
  dark: '#818CF8',
  gradient: '#667eea',
  minimal: '#0f172a',
  corporate: '#1e3a5f',
  creative: '#f97316',
}

export default function DashboardClient({ user, presentations: initial }: Props) {
  const router = useRouter()
  const [presentations, setPresentations] = useState(initial)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function logout() {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function deletePresentation(id: string) {
    if (!confirm('이 프레젠테이션을 삭제하시겠습니까?')) return
    setDeletingId(id)
    const sb = createClient()
    await sb.from('presentations').delete().eq('id', id)
    setPresentations(prev => prev.filter(p => p.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-black" style={{ color: '#4F46E5' }}>SlideAI</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.email}</span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Title row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">내 프레젠테이션</h1>
            <p className="text-sm text-gray-400 mt-0.5">총 {presentations.length}개</p>
          </div>
          <Link
            href="/editor"
            className="font-semibold text-white px-5 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #818CF8)' }}
          >
            + 새 프레젠테이션
          </Link>
        </div>

        {presentations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">아직 프레젠테이션이 없습니다</h3>
            <p className="text-sm text-gray-400 mb-6">AI로 첫 번째 프레젠테이션을 만들어보세요</p>
            <Link
              href="/editor"
              className="font-semibold text-white px-6 py-3 rounded-xl text-sm"
              style={{ background: '#4F46E5' }}
            >
              ✨ AI로 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {presentations.map(p => {
              const accent = THEME_COLORS[p.theme] || '#4F46E5'
              const slideCount = Array.isArray(p.slides) ? p.slides.length : 0
              return (
                <div key={p.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                  {/* Thumbnail */}
                  <Link href={`/editor?id=${p.id}`}>
                    <div
                      className="h-36 flex items-center justify-center relative overflow-hidden"
                      style={{ background: accent + '12' }}
                    >
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
                        }}
                      />
                      <div className="relative text-center px-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                          style={{ background: accent }}
                        >
                          <span className="text-white text-lg">📊</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-600 line-clamp-2">{p.title}</p>
                      </div>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-3">
                    <Link href={`/editor?id=${p.id}`}>
                      <h3 className="text-sm font-semibold text-gray-800 truncate hover:text-indigo-600 transition-colors">
                        {p.title}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">{slideCount}장 · {timeAgo(p.updated_at)}</span>
                      <button
                        onClick={() => deletePresentation(p.id)}
                        disabled={deletingId === p.id}
                        className="text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
