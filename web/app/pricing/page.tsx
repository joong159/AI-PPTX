'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SUPABASE_ENABLED } from '@/lib/supabase'

const FREE_FEATURES = [
  '프레젠테이션 3개',
  '슬라이드 최대 7장',
  'AI 슬라이드 생성',
  'PPTX 내보내기',
  '10개 도형 & 아이콘',
]

const PRO_FEATURES = [
  '프레젠테이션 무제한',
  '슬라이드 무제한',
  'AI 슬라이드 생성 무제한',
  'PPTX · PDF 내보내기',
  '모든 도형 & 아이콘',
  '공유 링크 생성',
  'AI 이미지 자동 삽입',
  '폰트 18종 선택',
  '우선 지원',
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [annual, setAnnual] = useState(false)

  const monthlyPrice = 9900
  const annualPrice = Math.round(monthlyPrice * 0.75)
  const displayPrice = annual ? annualPrice : monthlyPrice

  async function handleUpgrade() {
    if (!SUPABASE_ENABLED) { router.push('/auth'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else if (data.error === 'Unauthorized') router.push('/auth?redirect=/pricing')
      else if (data.error === 'Stripe not configured') alert('결제 시스템이 아직 준비 중입니다.')
    } catch { alert('오류가 발생했습니다. 다시 시도해주세요.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-white">Slide<span className="text-indigo-400">AI</span></Link>
        <div className="flex items-center gap-4">
          <Link href="/editor" className="text-white/60 hover:text-white text-sm transition-colors">에디터</Link>
          <Link href="/auth" className="text-sm font-medium text-white px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition-colors">로그인</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Headline */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4">
            심플한 요금제
          </h1>
          <p className="text-white/60 text-lg">무료로 시작하고, 필요할 때 업그레이드하세요</p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm ${!annual ? 'text-white' : 'text-white/40'}`}>월간</span>
            <button
              onClick={() => setAnnual(v => !v)}
              className={`w-12 h-6 rounded-full transition-colors relative ${annual ? 'bg-indigo-500' : 'bg-white/20'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm ${annual ? 'text-white' : 'text-white/40'}`}>연간</span>
            {annual && <span className="text-xs font-bold text-green-400 bg-green-400/20 px-2 py-0.5 rounded-full">25% 할인</span>}
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-white/50 text-sm font-medium mb-1">무료</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-white">₩0</span>
                <span className="text-white/40 text-sm mb-1">/ 월</span>
              </div>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                  <span className="text-white/30 text-base">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/editor"
              className="w-full py-3 rounded-2xl text-center text-sm font-semibold text-white/80 border border-white/20 hover:bg-white/10 transition-colors">
              무료로 시작하기
            </Link>
          </div>

          {/* Pro */}
          <div className="relative bg-indigo-600 rounded-3xl p-8 flex flex-col shadow-2xl shadow-indigo-900/40">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-xs font-bold px-4 py-1 rounded-full">
              ✨ 가장 인기
            </div>
            <div className="mb-6">
              <p className="text-indigo-200 text-sm font-medium mb-1">Pro</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-white">₩{displayPrice.toLocaleString()}</span>
                <span className="text-indigo-200 text-sm mb-1">/ 월</span>
              </div>
              {annual && <p className="text-indigo-200 text-xs mt-1">연간 ₩{(annualPrice * 12).toLocaleString()} 청구</p>}
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white">
                  <span className="text-white/70 text-base">✓</span> {f}
                </li>
              ))}
            </ul>
            <button onClick={handleUpgrade} disabled={loading}
              className="w-full py-3 rounded-2xl text-sm font-bold text-indigo-700 bg-white hover:bg-indigo-50 transition-colors disabled:opacity-70">
              {loading ? '연결 중...' : `Pro 시작하기`}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">자주 묻는 질문</h2>
          <div className="space-y-4">
            {[
              ['언제든지 취소할 수 있나요?', '네, 구독은 언제든지 취소할 수 있습니다. 취소 후에도 현재 구독 기간이 끝날 때까지 Pro 기능을 사용할 수 있습니다.'],
              ['무료 플랜에서 만든 자료는 어떻게 되나요?', 'Pro로 업그레이드하거나 다시 무료로 전환해도 기존에 만든 자료는 모두 유지됩니다.'],
              ['결제 수단은 어떤 것을 지원하나요?', 'Visa, Mastercard, 카카오페이 등 주요 신용카드 및 간편결제를 지원합니다.'],
            ].map(([q, a]) => (
              <details key={q} className="group bg-white/5 border border-white/10 rounded-2xl px-5 py-4 cursor-pointer">
                <summary className="text-white font-medium text-sm list-none flex justify-between items-center">
                  {q}
                  <span className="text-white/40 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="text-white/60 text-sm mt-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
