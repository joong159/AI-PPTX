import Link from 'next/link'

const FEATURES = [
  {
    icon: '⚡',
    title: 'AI 자동 생성',
    desc: '주제만 입력하면 AI가 슬라이드 구성, 내용, 디자인을 자동으로 만들어드립니다.',
  },
  {
    icon: '✏️',
    title: '실시간 편집',
    desc: '슬라이드를 클릭해서 텍스트, 구조, 레이아웃을 캔바처럼 바로 수정하세요.',
  },
  {
    icon: '☁️',
    title: '클라우드 저장',
    desc: '작업물이 자동으로 저장되어 어디서든 이어서 작업할 수 있습니다.',
  },
  {
    icon: '📥',
    title: 'PPTX 내보내기',
    desc: 'PowerPoint 파일로 한 번에 내보내기. 어떤 기기에서도 열 수 있습니다.',
  },
  {
    icon: '📱',
    title: '웹 & 앱 동시 지원',
    desc: 'PC 웹브라우저와 모바일 앱 모두에서 동일하게 작동합니다.',
  },
  {
    icon: '🎨',
    title: '다양한 레이아웃',
    desc: '타이틀, 섹션 헤더, 빅스탯, 카드형, 타임라인 등 7가지 슬라이드 타입.',
  },
]

const SLIDE_PREVIEWS = [
  { type: '제목 + 내용', color: '#4F46E5', icon: '📄' },
  { type: '빅 스탯', color: '#7C3AED', icon: '📊' },
  { type: '카드 3장', color: '#0EA5E9', icon: '🃏' },
  { type: '타임라인', color: '#10B981', icon: '📅' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold" style={{ color: '#4F46E5' }}>SlideAI</span>
          <div className="flex items-center gap-4">
            <Link href="/templates" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              템플릿
            </Link>
            <Link href="/auth" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              로그인
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              대시보드
            </Link>
            <Link
              href="/editor"
              className="text-sm font-medium text-white px-4 py-2 rounded-full transition-opacity hover:opacity-90"
              style={{ background: '#4F46E5' }}
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
            ✨ AI 기반 프레젠테이션 생성
          </div>
          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6 text-gray-900">
            주제만 입력하면<br />
            <span className="gradient-text">AI가 다 만들어줘요</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            5초 만에 전문적인 프레젠테이션 생성. 실시간 편집, 클라우드 저장, PPTX 내보내기까지 한 번에.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/editor"
              className="inline-flex items-center justify-center gap-2 text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #818CF8)' }}
            >
              무료로 시작하기 →
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 text-gray-700 font-semibold text-lg px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-indigo-300 transition-colors"
            >
              더 알아보기
            </a>
          </div>
        </div>

        {/* Slide type previews */}
        <div className="mt-20 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {SLIDE_PREVIEWS.map((p) => (
            <div
              key={p.type}
              className="rounded-2xl p-6 text-white text-left shadow-lg"
              style={{ background: p.color }}
            >
              <div className="text-3xl mb-3">{p.icon}</div>
              <div className="text-sm font-semibold opacity-90">{p.type}</div>
              <div className="mt-3 space-y-1.5">
                {[70, 50, 60].map((w, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-white/30" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">왜 SlideAI인가요?</h2>
            <p className="text-lg text-gray-500">발표 준비에 쓰는 시간을 아이디어에 투자하세요</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-16">3단계로 끝나요</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: '주제 입력', desc: '만들고 싶은 프레젠테이션의 주제나 내용을 입력하세요' },
              { step: '2', title: 'AI 생성', desc: 'AI가 슬라이드 구성과 내용을 자동으로 만들어 드립니다' },
              { step: '3', title: '편집 & 저장', desc: '내용을 자유롭게 수정하고 PPTX로 내보내세요' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-5 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #4F46E5, #818CF8)' }}
                >
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">심플한 요금제</h2>
          <p className="text-gray-500 mb-10">무료로 시작하고, 필요할 때 업그레이드</p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-white rounded-2xl p-7 border border-gray-200 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">무료</p>
              <p className="text-3xl font-black text-gray-900 mb-5">₩0 <span className="text-gray-400 text-base font-normal">/ 월</span></p>
              <ul className="space-y-2 text-sm text-gray-600">
                {['프레젠테이션 3개', '슬라이드 최대 7장', 'AI 생성 · PPTX 내보내기'].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-indigo-500">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/editor" className="mt-6 block text-center py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">무료로 시작하기</Link>
            </div>
            <div className="bg-indigo-600 rounded-2xl p-7 shadow-lg shadow-indigo-200">
              <p className="text-indigo-200 text-sm mb-1">Pro</p>
              <p className="text-3xl font-black text-white mb-5">₩9,900 <span className="text-indigo-200 text-base font-normal">/ 월</span></p>
              <ul className="space-y-2 text-sm text-white">
                {['프레젠테이션 무제한', '슬라이드 무제한', '공유 링크 · PDF · AI 이미지'].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-white/60">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/pricing" className="mt-6 block text-center py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-bold hover:bg-indigo-50 transition-colors">Pro 시작하기</Link>
            </div>
          </div>
          <Link href="/pricing" className="mt-6 inline-block text-sm text-indigo-600 hover:text-indigo-800 font-medium">전체 요금제 보기 →</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-4xl font-black mb-4">지금 바로 시작하세요</h2>
          <p className="text-indigo-200 text-lg mb-8">무료로 사용 가능 · 신용카드 불필요</p>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 bg-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            style={{ color: '#4F46E5' }}
          >
            무료로 시작하기 →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-6 mb-2">
          <Link href="/pricing" className="hover:text-gray-600 transition-colors">요금제</Link>
          <Link href="/templates" className="hover:text-gray-600 transition-colors">템플릿</Link>
          <Link href="/editor" className="hover:text-gray-600 transition-colors">에디터</Link>
        </div>
        © 2026 SlideAI. All rights reserved.
      </footer>
    </div>
  )
}
