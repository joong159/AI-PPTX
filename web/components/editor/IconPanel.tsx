'use client'

import { useState, useMemo } from 'react'

// Curated SVG icon set (path data only, viewBox 0 0 24 24)
const ICONS: { name: string; tags: string; path: string }[] = [
  // Business
  { name: '차트', tags: '차트 그래프 통계 business', path: 'M3 3v18h18M7 16l4-4 4 4 4-4' },
  { name: '막대차트', tags: '막대 차트 통계', path: 'M18 20V10M12 20V4M6 20v-6' },
  { name: '파이차트', tags: '파이 차트 비율', path: 'M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z' },
  { name: '트렌드상승', tags: '상승 성장 트렌드', path: 'M22 7l-8.5 8.5-5-5L2 17M22 7h-6M22 7v6' },
  { name: '타겟', tags: '타겟 목표 목표치', path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  { name: '가방', tags: '비즈니스 가방 서류', path: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2' },
  { name: '돈', tags: '돈 금액 가격 달러', path: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { name: '신용카드', tags: '카드 결제 신용', path: 'M1 4h22v16H1zM1 10h22' },
  // Communication
  { name: '채팅', tags: '채팅 메시지 대화', path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { name: '이메일', tags: '이메일 메일', path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6' },
  { name: '전화', tags: '전화 통화', path: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z' },
  { name: '공유', tags: '공유 share', path: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13' },
  // Technology
  { name: '컴퓨터', tags: '컴퓨터 노트북 기술', path: 'M20 16H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2zM8 21h8M12 16v5' },
  { name: '스마트폰', tags: '스마트폰 모바일', path: 'M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 18h.01' },
  { name: '클라우드', tags: '클라우드 저장 cloud', path: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z' },
  { name: '잠금', tags: '잠금 보안 security', path: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4' },
  { name: 'AI', tags: 'AI 인공지능 로봇', path: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01' },
  { name: '데이터', tags: '데이터 서버 database', path: 'M12 2a9 3 0 1 0 0 6A9 3 0 0 0 12 2zM3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3' },
  // People
  { name: '사람', tags: '사람 유저 user', path: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { name: '팀', tags: '팀 그룹 사람들', path: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { name: '하트', tags: '하트 좋아요 love', path: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
  { name: '별점', tags: '별점 평점 star rating', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  // Actions
  { name: '체크', tags: '체크 완료 ok done', path: 'M20 6L9 17l-5-5' },
  { name: 'X', tags: 'X 닫기 삭제 close', path: 'M18 6L6 18M6 6l12 12' },
  { name: '더하기', tags: '추가 더하기 plus', path: 'M12 5v14M5 12h14' },
  { name: '화살표오른쪽', tags: '화살표 오른쪽 다음', path: 'M5 12h14M12 5l7 7-7 7' },
  { name: '업로드', tags: '업로드 올리기', path: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12' },
  { name: '다운로드', tags: '다운로드 내려받기', path: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3' },
  { name: '새로고침', tags: '새로고침 반복', path: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' },
  { name: '설정', tags: '설정 gear 환경설정', path: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
  // Objects
  { name: '전구', tags: '아이디어 전구 idea', path: 'M9 21h6M12 3a6 6 0 0 1 6 6c0 2.22-1.2 4.16-3 5.2V17H9v-2.8A6 6 0 0 1 6 9a6 6 0 0 1 6-6z' },
  { name: '지도', tags: '지도 위치 map location', path: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  { name: '달력', tags: '달력 날짜 calendar', path: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18' },
  { name: '시계', tags: '시계 시간 time', path: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2' },
  { name: '트로피', tags: '트로피 우승 상', path: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M6 4h12v11a6 6 0 0 1-12 0V4zM8 21h8M12 17v4' },
  { name: '로켓', tags: '로켓 성장 스타트업', path: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5' },
]

interface Props {
  onInsert: (svgPath: string, name: string) => void
}

export default function IconPanel({ onInsert }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    search.trim()
      ? ICONS.filter(ic => ic.tags.includes(search.toLowerCase()) || ic.name.includes(search))
      : ICONS
  , [search])

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-100">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="아이콘 검색..."
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-300"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-4 gap-1.5">
          {filtered.map(ic => (
            <button key={ic.name} title={ic.name} onClick={() => onInsert(ic.path, ic.name)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 transition-colors group">
              <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d={ic.path} />
              </svg>
              <span className="text-[10px] text-gray-500 group-hover:text-indigo-600 truncate w-full text-center leading-tight">{ic.name}</span>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-10 text-gray-400 text-sm">검색 결과 없음</div>
        )}
      </div>
    </div>
  )
}
