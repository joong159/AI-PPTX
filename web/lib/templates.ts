import type { Presentation } from './types'

export interface Template {
  id: string
  name: string
  description: string
  category: string
  emoji: string
  themeId: string
  accentColor: string
  data: Presentation
}

export const TEMPLATE_CATEGORIES = ['비즈니스', '마케팅', '교육', '스타트업', '팀·조직', '연간 보고']

export const TEMPLATES: Template[] = [
  // ─── Pitch Deck ───
  {
    id: 'pitch-deck',
    name: '스타트업 피치덱',
    description: '투자자에게 아이디어를 설득하는 핵심 구조',
    category: '스타트업',
    emoji: '🚀',
    themeId: 'modern',
    accentColor: '#4F46E5',
    data: {
      title: '스타트업 피치덱',
      theme: 'modern',
      accent_color: '#4F46E5',
      slides: [
        {
          _id: 's1', slide_index: 0, slide_type: 'title_and_content',
          title: '우리가 해결하는 문제', summary: '왜 지금인가',
          bullets: ['시장의 핵심 페인포인트 1', '기존 솔루션의 한계', '타겟 고객의 규모와 심각성'],
          key_takeaway: '10억 명이 겪는 문제, 해결책은 아직 없다', speaker_notes: '',
        },
        {
          _id: 's2', slide_index: 1, slide_type: 'section_header',
          title: '우리의 솔루션', summary: '단순하고 강력한 한 가지 답',
          bullets: [], key_takeaway: '', speaker_notes: '',
        },
        {
          _id: 's3', slide_index: 2, slide_type: 'three_cards',
          title: '핵심 기능 3가지', summary: '',
          bullets: [], key_takeaway: '고객이 가장 먼저 경험하는 가치',
          speaker_notes: '',
          cards: [
            { card_title: '🎯 핵심 기능 1', card_content: '고객의 가장 큰 문제를 직접 해결하는 메인 기능 설명' },
            { card_title: '⚡ 핵심 기능 2', card_content: '차별화 포인트가 되는 두 번째 기능의 가치 제안' },
            { card_title: '🔗 핵심 기능 3', card_content: '락인 효과 또는 네트워크 효과를 만드는 세 번째 기능' },
          ],
        },
        {
          _id: 's4', slide_index: 3, slide_type: 'big_stat',
          title: '시장 규모', summary: '',
          bullets: ['TAM: 전체 목표 시장', 'SAM: 실질 공략 가능 시장', 'SOM: 3년 내 확보 목표'],
          key_takeaway: '빠르게 성장 중인 블루오션 시장',
          speaker_notes: '',
          stat_value: '$50B', stat_description: '2027년 글로벌 시장 규모 (CAGR 34%)',
        },
        {
          _id: 's5', slide_index: 4, slide_type: 'timeline',
          title: '실행 로드맵', summary: '',
          bullets: [], key_takeaway: '12개월 내 PMF 달성',
          speaker_notes: '',
          timeline_steps: [
            { step_title: 'Q1: MVP 출시', step_desc: '핵심 기능만으로 베타 사용자 100명 확보' },
            { step_title: 'Q2: PMF 검증', step_desc: 'NPS 50+ 달성 및 월간 활성 사용자 1,000명' },
            { step_title: 'Q3: 성장 가속', step_desc: '유료 전환율 15%, MRR $50K 달성' },
            { step_title: 'Q4: 시리즈 A 준비', step_desc: 'ARR $1M 달성 및 투자 라운드 진행' },
          ],
        },
        {
          _id: 's6', slide_index: 5, slide_type: 'comparison',
          title: '경쟁사 vs 우리', summary: '',
          bullets: [], key_takeaway: '10배 더 빠르고, 절반의 비용',
          speaker_notes: '',
          cards: [
            { card_title: '기존 경쟁사', card_content: '• 구축에 3~6개월 소요\n• 연간 $50,000+ 비용\n• 개발자 필요\n• 커스터마이징 어려움\n• 느린 고객 지원' },
            { card_title: '우리 제품', card_content: '• 당일 시작 가능\n• 월 $199부터\n• 코딩 불필요\n• 무제한 커스터마이징\n• 24시간 AI 지원' },
          ],
        },
        {
          _id: 's7', slide_index: 6, slide_type: 'quote_slide',
          title: '우리 팀은 이 문제를 10년간 직접 겪었고, 이제 우리가 해결한다.', summary: '— 창업자 이름, CEO',
          bullets: [], key_takeaway: '', speaker_notes: '',
        },
      ],
    },
  },

  // ─── Business Report ───
  {
    id: 'business-report',
    name: '비즈니스 보고서',
    description: '분기 실적과 전략을 명확하게 전달하는 임원 보고서',
    category: '비즈니스',
    emoji: '📊',
    themeId: 'corporate',
    accentColor: '#475569',
    data: {
      title: '분기 비즈니스 보고서',
      theme: 'corporate',
      accent_color: '#475569',
      slides: [
        {
          _id: 's1', slide_index: 0, slide_type: 'title_and_content',
          title: '경영 요약', summary: '2024년 3분기 핵심 성과',
          bullets: ['매출 목표 대비 108% 달성', '신규 고객 234개 사 확보', '고객 이탈률 전분기 대비 2.3%p 개선', '영업이익률 23.4% 기록'],
          key_takeaway: '3분기 연속 두 자릿수 성장 달성', speaker_notes: '',
        },
        {
          _id: 's2', slide_index: 1, slide_type: 'big_stat',
          title: '매출 성과', summary: '',
          bullets: ['국내: ₩38.4억 (전년비 +22%)', '해외: ₩12.1억 (전년비 +67%)', '서비스 매출: ₩8.9억 (신규 추가)'],
          key_takeaway: '해외 매출 비중 처음으로 20% 초과',
          speaker_notes: '', stat_value: '₩59.4억', stat_description: '3분기 누적 매출 (목표: ₩55억)',
        },
        {
          _id: 's3', slide_index: 2, slide_type: 'three_cards',
          title: '부문별 성과', summary: '',
          bullets: [], key_takeaway: '세 부문 모두 목표 초과 달성',
          speaker_notes: '',
          cards: [
            { card_title: '영업팀', card_content: '신규 계약 234건\n목표 대비 116%\n평균 계약 규모 18% 증가' },
            { card_title: '제품팀', card_content: '기능 출시 12건\n버그 수정 48건\n고객 만족도 4.7/5.0' },
            { card_title: '마케팅팀', card_content: 'MQL 1,847건 창출\n전환율 12.7%\nCAC 전분기 대비 -15%' },
          ],
        },
        {
          _id: 's4', slide_index: 3, slide_type: 'two_column',
          title: '4분기 전략 방향', summary: '',
          bullets: [
            '엔터프라이즈 세그먼트 집중', '파트너사 3개 추가 확보', '해외 2개국 신규 진출',
            '제품 안정성 최우선', '고객 성공팀 2배 확대', 'NPS 60 달성 목표',
          ],
          key_takeaway: '성장과 안정의 균형', speaker_notes: '',
        },
        {
          _id: 's5', slide_index: 4, slide_type: 'timeline',
          title: '4분기 실행 계획', summary: '',
          bullets: [], key_takeaway: '',
          speaker_notes: '',
          timeline_steps: [
            { step_title: '10월: 기반 강화', step_desc: '엔터프라이즈 온보딩 프로세스 개선, 파트너 계약 체결' },
            { step_title: '11월: 확장 실행', step_desc: '일본·동남아 베타 출시, 대형 고객사 3개 미팅' },
            { step_title: '12월: 마감 스프린트', step_desc: '연간 목표 초과 달성 및 내년도 예산 확정' },
          ],
        },
      ],
    },
  },

  // ─── Marketing Plan ───
  {
    id: 'marketing-plan',
    name: '마케팅 전략 기획서',
    description: '캠페인 목표부터 실행 계획까지 한눈에',
    category: '마케팅',
    emoji: '📣',
    themeId: 'gradient',
    accentColor: '#7C3AED',
    data: {
      title: '마케팅 전략 기획서',
      theme: 'gradient',
      accent_color: '#7C3AED',
      slides: [
        {
          _id: 's1', slide_index: 0, slide_type: 'section_header',
          title: '2024 마케팅 전략', summary: '브랜드 인지도 300% 성장을 위한 실행 계획',
          bullets: [], key_takeaway: '', speaker_notes: '',
        },
        {
          _id: 's2', slide_index: 1, slide_type: 'three_cards',
          title: '핵심 목표 (OKR)', summary: '',
          bullets: [], key_takeaway: '측정 가능한 3가지 핵심 결과',
          speaker_notes: '',
          cards: [
            { card_title: '🎯 브랜드 인지도', card_content: '소셜 팔로워 10만\n월 유기 방문자 50만\n검색 노출 1위 키워드 20개' },
            { card_title: '📈 리드 창출', card_content: '월 MQL 2,000개\n이메일 구독자 5만\n웨비나 참석자 500명/회' },
            { card_title: '💰 매출 기여', card_content: '마케팅 기인 매출 40%\n광고 ROAS 5배\nCAC 20% 절감' },
          ],
        },
        {
          _id: 's3', slide_index: 2, slide_type: 'image_text',
          title: '타겟 고객 프로필', summary: '핵심 페르소나',
          bullets: ['나이 28-42세, 중간 관리자 이상', '디지털 친화적, 생산성 도구 적극 활용', '예산 결정권 있는 실무자', '콘텐츠로 정보 수집, 신뢰 기반 구매'],
          key_takeaway: '의사결정자이자 실무자인 하이브리드 타겟', speaker_notes: '',
        },
        {
          _id: 's4', slide_index: 3, slide_type: 'timeline',
          title: '분기별 캠페인 로드맵', summary: '',
          bullets: [], key_takeaway: '',
          speaker_notes: '',
          timeline_steps: [
            { step_title: 'Q1: 브랜드 구축', step_desc: '블로그 50편, 유튜브 채널 개설, 검색광고 최적화' },
            { step_title: 'Q2: 리드 확대', step_desc: '웨비나 시리즈, 파트너 co-marketing, 이메일 자동화' },
            { step_title: 'Q3: 전환 최적화', step_desc: '리타겟팅 강화, 케이스스터디 콘텐츠, ABM 캠페인' },
            { step_title: 'Q4: 연말 드라이브', step_desc: '시즌 프로모션, 기존 고객 업셀, 내년 예열 캠페인' },
          ],
        },
        {
          _id: 's5', slide_index: 4, slide_type: 'big_stat',
          title: '예산 계획', summary: '',
          bullets: ['콘텐츠·SEO: 30% (₩9,000만)', '유료 광고: 35% (₩10,500만)', '이벤트·웨비나: 20% (₩6,000만)', '툴·자동화: 15% (₩4,500만)'],
          key_takeaway: '디지털 채널에 65% 집중 투자',
          speaker_notes: '', stat_value: '₩3억', stat_description: '2024 마케팅 연간 예산',
        },
        {
          _id: 's6', slide_index: 5, slide_type: 'quote_slide',
          title: '마케팅은 더 이상 당신이 만드는 것에 관한 게 아니라, 당신이 전하는 이야기에 관한 것입니다.', summary: '— Seth Godin',
          bullets: [], key_takeaway: '', speaker_notes: '',
        },
      ],
    },
  },

  // ─── Product Introduction ───
  {
    id: 'product-intro',
    name: '제품 소개서',
    description: '고객사 미팅에서 사용하는 제품 데모 덱',
    category: '비즈니스',
    emoji: '💡',
    themeId: 'dark',
    accentColor: '#0EA5E9',
    data: {
      title: '제품 소개서',
      theme: 'dark',
      accent_color: '#0EA5E9',
      slides: [
        {
          _id: 's1', slide_index: 0, slide_type: 'title_and_content',
          title: '왜 지금 변화가 필요한가', summary: '업계가 직면한 도전',
          bullets: ['수작업 프로세스로 인한 생산성 손실 40%', '데이터 사일로로 의사결정 지연 평균 3일', '고객 응대 품질 불균일, CS 비용 급증'],
          key_takeaway: '변화하지 않으면 경쟁에서 뒤처진다', speaker_notes: '',
        },
        {
          _id: 's2', slide_index: 1, slide_type: 'section_header',
          title: '더 스마트한 방법이 있습니다', summary: 'AI로 업무를 완전히 재정의하다',
          bullets: [], key_takeaway: '', speaker_notes: '',
        },
        {
          _id: 's3', slide_index: 2, slide_type: 'three_cards',
          title: '3가지 핵심 가치', summary: '',
          bullets: [], key_takeaway: '',
          speaker_notes: '',
          cards: [
            { card_title: '⚡ 10배 빠르게', card_content: '반복 작업을 AI가 자동화하여 팀이 핵심 업무에 집중할 수 있도록 합니다' },
            { card_title: '🔍 완벽한 가시성', card_content: '실시간 대시보드로 모든 프로세스 현황을 한눈에 파악하고 즉시 의사결정' },
            { card_title: '🔒 엔터프라이즈 보안', card_content: 'SOC2 Type II, ISO 27001 인증. 데이터는 항상 귀사 환경에서만 처리' },
          ],
        },
        {
          _id: 's4', slide_index: 3, slide_type: 'image_text',
          title: '직관적인 인터페이스', summary: '설치 없이 브라우저에서 바로',
          bullets: ['드래그&드롭으로 워크플로우 설계', '100+ 사전 구축된 자동화 템플릿', 'API 연동 없이 주요 툴과 1-click 통합', '모바일에서도 동일한 경험 제공'],
          key_takeaway: '교육 없이도 누구나 3분 만에 시작', speaker_notes: '',
        },
        {
          _id: 's5', slide_index: 4, slide_type: 'big_stat',
          title: '고객사 도입 성과', summary: '',
          bullets: ['월 평균 절감 시간: 156시간', 'ROI 달성 기간: 평균 6주', '고객 유지율: 97%'],
          key_takeaway: '98%의 고객이 갱신을 선택합니다',
          speaker_notes: '', stat_value: '340%', stat_description: '평균 투자 수익률 (ROI), 도입 6개월 기준',
        },
        {
          _id: 's6', slide_index: 5, slide_type: 'comparison',
          title: '도입 전 vs 도입 후', summary: '',
          bullets: [], key_takeaway: '6주 만에 달라지는 업무 방식',
          speaker_notes: '',
          cards: [
            { card_title: '도입 전', card_content: '• 수작업 데이터 입력 8시간/일\n• 보고서 작성 2일 소요\n• 실수로 인한 재작업 빈번\n• 팀원 번아웃 증가\n• 의사결정 지연' },
            { card_title: '도입 후', card_content: '• 자동화로 20분/일로 단축\n• 실시간 보고서 자동 생성\n• AI 검증으로 오류 0%\n• 핵심 업무에 집중\n• 데이터 기반 즉시 결정' },
          ],
        },
        {
          _id: 's7', slide_index: 6, slide_type: 'timeline',
          title: '도입 프로세스', summary: '',
          bullets: [], key_takeaway: '8주 안에 완전한 운영 정상화',
          speaker_notes: '',
          timeline_steps: [
            { step_title: '1-2주: 킥오프', step_desc: '현황 진단, 우선순위 워크플로우 선정, 팀 교육' },
            { step_title: '3-4주: 1차 구현', step_desc: '핵심 프로세스 3개 자동화, 파일럿 운영 시작' },
            { step_title: '5-6주: 최적화', step_desc: '피드백 기반 조정, 추가 연동, 성과 측정' },
            { step_title: '7-8주: 전사 확대', step_desc: '전 팀원 온보딩 완료, ROI 측정 및 보고' },
          ],
        },
      ],
    },
  },

  // ─── Team Introduction ───
  {
    id: 'team-intro',
    name: '팀 소개서',
    description: '우리 팀의 역량과 문화를 소개하는 덱',
    category: '팀·조직',
    emoji: '👥',
    themeId: 'creative',
    accentColor: '#059669',
    data: {
      title: '팀 소개서',
      theme: 'creative',
      accent_color: '#059669',
      slides: [
        {
          _id: 's1', slide_index: 0, slide_type: 'section_header',
          title: '우리는 누구인가', summary: '함께 더 큰 문제를 해결하는 팀',
          bullets: [], key_takeaway: '', speaker_notes: '',
        },
        {
          _id: 's2', slide_index: 1, slide_type: 'title_and_content',
          title: '팀 소개', summary: '',
          bullets: ['설립 연도: 2020년 / 팀원: 32명', '주요 배경: 네이버, 카카오, 삼성전자, McKinsey', '특기: 0에서 1을 만드는 실행력', '문화: 빠른 실험, 솔직한 피드백, 임팩트 중심'],
          key_takeaway: '경험 있고 실행력 강한 드림팀', speaker_notes: '',
        },
        {
          _id: 's3', slide_index: 2, slide_type: 'three_cards',
          title: '핵심 리더십', summary: '',
          bullets: [], key_takeaway: '',
          speaker_notes: '',
          cards: [
            { card_title: '김철수 — CEO', card_content: '전 네이버 프로덕트 디렉터\n10년 SaaS 경험\nHarvard MBA' },
            { card_title: '이영희 — CTO', card_content: '전 삼성전자 AI랩 리드\n특허 8개 보유\nKAIST 컴퓨터공학 박사' },
            { card_title: '박민준 — CMO', card_content: '전 McKinsey 파트너\n3개 스타트업 엑싯 경험\n연세대 경영학 석사' },
          ],
        },
        {
          _id: 's4', slide_index: 3, slide_type: 'two_column',
          title: '팀 역량', summary: '',
          bullets: [
            '풀스택 개발 (Frontend/Backend)', 'AI/ML 엔지니어링', '제품 기획 및 UX 디자인',
            'B2B 영업 및 파트너십', '콘텐츠 마케팅', '데이터 분석 및 BI',
          ],
          key_takeaway: '제품부터 판매까지 내재화된 팀', speaker_notes: '',
        },
        {
          _id: 's5', slide_index: 4, slide_type: 'big_stat',
          title: '우리의 성과', summary: '',
          bullets: ['수상: 2023 K-스타트업 최우수상', '미디어: TechCrunch, Forbes Korea 소개', '커뮤니티: 개발자 컨퍼런스 발표 8회'],
          key_takeaway: '인정받는 팀, 검증된 실행력',
          speaker_notes: '', stat_value: '4.8/5', stat_description: '글래스도어 직원 만족도 (업계 최상위 5%)',
        },
        {
          _id: 's6', slide_index: 5, slide_type: 'quote_slide',
          title: '최고의 팀은 서로의 성공을 가장 기뻐하는 사람들로 이루어집니다.', summary: '— 팀의 핵심 가치',
          bullets: [], key_takeaway: '', speaker_notes: '',
        },
      ],
    },
  },

  // ─── Annual Review ───
  {
    id: 'annual-review',
    name: '연간 성과 리뷰',
    description: '한 해의 성과를 돌아보고 내년을 준비하는 보고서',
    category: '연간 보고',
    emoji: '📅',
    themeId: 'minimal',
    accentColor: '#D97706',
    data: {
      title: '2024 연간 성과 리뷰',
      theme: 'minimal',
      accent_color: '#D97706',
      slides: [
        {
          _id: 's1', slide_index: 0, slide_type: 'section_header',
          title: '2024년을 돌아보며', summary: '성장, 도전, 그리고 다음 챕터',
          bullets: [], key_takeaway: '', speaker_notes: '',
        },
        {
          _id: 's2', slide_index: 1, slide_type: 'big_stat',
          title: '올해의 숫자', summary: '',
          bullets: ['사용자: 12만 → 41만 (241% 성장)', '매출: ₩4.8억 → ₩18.2억 (279% 성장)', '팀: 8명 → 27명 (238% 성장)'],
          key_takeaway: '3년 만에 업계 상위 10개사 진입',
          speaker_notes: '', stat_value: '2024', stat_description: '우리가 만들어낸 변화의 해',
        },
        {
          _id: 's3', slide_index: 2, slide_type: 'three_cards',
          title: '2024 3대 하이라이트', summary: '',
          bullets: [], key_takeaway: '',
          speaker_notes: '',
          cards: [
            { card_title: '🏆 엔터프라이즈 진출', card_content: '대기업 50개사 도입 달성\n평균 계약 규모 5배 증가\n엔터프라이즈 매출 비중 60%' },
            { card_title: '🌏 글로벌 첫 발걸음', card_content: '일본·싱가포르 진출\n해외 사용자 8천 명 확보\n현지 파트너 3개사 계약' },
            { card_title: '🤖 AI 기능 출시', card_content: '12개 AI 기능 출시\n사용자 효율 평균 45% 개선\n AI 관련 NPS +32 상승' },
          ],
        },
        {
          _id: 's4', slide_index: 3, slide_type: 'comparison',
          title: '2024 계획 vs 실제 성과', summary: '',
          bullets: [], key_takeaway: '대부분 목표 초과 달성',
          speaker_notes: '',
          cards: [
            { card_title: '연초 목표', card_content: '• 사용자 30만\n• 매출 ₩15억\n• 팀원 20명\n• 기능 출시 20개\n• 해외 1개국' },
            { card_title: '실제 달성', card_content: '• 사용자 41만 ✅ (+37%)\n• 매출 ₩18.2억 ✅ (+21%)\n• 팀원 27명 ✅ (+35%)\n• 기능 출시 31개 ✅ (+55%)\n• 해외 2개국 ✅ (목표 초과)' },
          ],
        },
        {
          _id: 's5', slide_index: 4, slide_type: 'two_column',
          title: '2025년 핵심 이니셔티브', summary: '',
          bullets: [
            '북미 시장 진출 (Q2)',
            'GPT-5 기반 차세대 AI 출시',
            '파트너 에코시스템 구축',
            '연간 반복 매출 $10M ARR',
            'IPO 준비 시작',
            '팀 50명으로 확장',
          ],
          key_takeaway: '2025: 글로벌 도약의 해', speaker_notes: '',
        },
        {
          _id: 's6', slide_index: 5, slide_type: 'quote_slide',
          title: '우리가 2024년에 이룬 것은, 2025년에 할 일의 서막에 불과합니다.', summary: '— 전체 팀원을 대표하여',
          bullets: [], key_takeaway: '', speaker_notes: '',
        },
      ],
    },
  },

  // ─── Education ───
  {
    id: 'education-lecture',
    name: '교육 강의 자료',
    description: '학생과 청중을 사로잡는 구조적인 강의 슬라이드',
    category: '교육',
    emoji: '🎓',
    themeId: 'modern',
    accentColor: '#0EA5E9',
    data: {
      title: '교육 강의 자료',
      theme: 'modern',
      accent_color: '#0EA5E9',
      slides: [
        {
          _id: 's1', slide_index: 0, slide_type: 'title_and_content',
          title: '오늘의 학습 목표', summary: '',
          bullets: ['핵심 개념 1을 설명할 수 있다', '핵심 개념 2를 사례에 적용할 수 있다', '핵심 개념 3을 바탕으로 문제를 해결할 수 있다', '학습한 내용을 타인에게 가르칠 수 있다'],
          key_takeaway: '90분 후 당신은 전문가가 됩니다', speaker_notes: '',
        },
        {
          _id: 's2', slide_index: 1, slide_type: 'section_header',
          title: '챕터 1: 기초 개념', summary: '모든 것은 여기서 시작됩니다',
          bullets: [], key_takeaway: '', speaker_notes: '',
        },
        {
          _id: 's3', slide_index: 2, slide_type: 'three_cards',
          title: '3가지 핵심 원리', summary: '',
          bullets: [], key_takeaway: '이 3가지만 기억하면 됩니다',
          speaker_notes: '',
          cards: [
            { card_title: '원리 1', card_content: '첫 번째 핵심 원리의 설명. 구체적인 예시를 들어 직관적으로 이해할 수 있게 작성합니다.' },
            { card_title: '원리 2', card_content: '두 번째 핵심 원리의 설명. 원리 1과 어떻게 연결되는지 관계를 명확히 보여줍니다.' },
            { card_title: '원리 3', card_content: '세 번째 핵심 원리의 설명. 이 원리가 실제 상황에서 어떻게 적용되는지 보여줍니다.' },
          ],
        },
        {
          _id: 's4', slide_index: 3, slide_type: 'big_stat',
          title: '왜 중요한가', summary: '',
          bullets: ['기업의 87%가 이 역량을 채용 기준으로 사용', '평균 연봉 차이: ₩1,200만/년', '업무 생산성 40% 향상'],
          key_takeaway: '지금 배우면 10년을 앞서갈 수 있습니다',
          speaker_notes: '', stat_value: '87%', stat_description: '이 역량을 가진 사람이 원하는 직장을 얻을 확률',
        },
        {
          _id: 's5', slide_index: 4, slide_type: 'timeline',
          title: '학습 로드맵', summary: '',
          bullets: [], key_takeaway: '',
          speaker_notes: '',
          timeline_steps: [
            { step_title: '1단계: 개념 이해 (1-2주)', step_desc: '핵심 이론 학습, 기본 용어 숙지, 예제 따라하기' },
            { step_title: '2단계: 실습 적용 (3-4주)', step_desc: '작은 프로젝트 시작, 실수하고 배우기, 피드백 받기' },
            { step_title: '3단계: 심화 학습 (5-6주)', step_desc: '고급 개념 탐구, 다른 분야와 연결, 나만의 방식 개발' },
            { step_title: '4단계: 마스터 (7-8주)', step_desc: '실제 프로젝트 완성, 다른 사람에게 가르치기, 커뮤니티 기여' },
          ],
        },
        {
          _id: 's6', slide_index: 5, slide_type: 'quote_slide',
          title: '배움의 목적은 성장이며, 우리의 마음은 음식이 필요하듯 성장이 필요합니다.', summary: '— Morley Safer',
          bullets: [], key_takeaway: '', speaker_notes: '',
        },
      ],
    },
  },
]
