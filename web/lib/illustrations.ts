// Flat-style SVG illustrations (unDraw-inspired, fully original, no license required)
// Color is injected at render time via the `color` parameter

export type IllustrationName = 'analytics' | 'growth' | 'team' | 'idea' | 'data' | 'strategy' | 'rocket' | 'checklist'

export function getIllustrationSvg(name: IllustrationName, color: string): string {
  const c = color.startsWith('#') ? color.slice(1) : color

  const svgs: Record<IllustrationName, string> = {
    analytics: `<svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="195" cy="28" r="45" fill="#${c}08"/>
      <rect x="28" y="102" width="28" height="63" rx="5" fill="#${c}35"/>
      <rect x="72" y="76" width="28" height="89" rx="5" fill="#${c}60"/>
      <rect x="116" y="48" width="28" height="117" rx="5" fill="#${c}"/>
      <rect x="160" y="65" width="28" height="100" rx="5" fill="#${c}75"/>
      <polyline points="42,102 86,76 130,48 174,65" stroke="#${c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="42" cy="102" r="5" fill="white" stroke="#${c}" stroke-width="2.5"/>
      <circle cx="86" cy="76" r="5" fill="white" stroke="#${c}" stroke-width="2.5"/>
      <circle cx="130" cy="48" r="5" fill="white" stroke="#${c}" stroke-width="2.5"/>
      <circle cx="174" cy="65" r="6" fill="#${c}"/>
      <line x1="20" y1="165" x2="220" y2="165" stroke="#${c}25" stroke-width="1.5"/>
    </svg>`,

    growth: `<svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="90" r="72" fill="#${c}07"/>
      <polyline points="35,150 75,118 110,90 148,58 185,30" stroke="#${c}30" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="35,150 75,118 110,90 148,58 185,30" stroke="#${c}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="35" cy="150" r="5" fill="#${c}70"/>
      <circle cx="75" cy="118" r="5" fill="#${c}70"/>
      <circle cx="110" cy="90" r="5" fill="#${c}"/>
      <circle cx="148" cy="58" r="5" fill="#${c}"/>
      <circle cx="185" cy="30" r="7" fill="#${c}"/>
      <path d="M173,18 L197,18 L197,42" stroke="#${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <rect x="35" y="152" width="6" height="18" rx="2" fill="#${c}40"/>
      <rect x="73" y="120" width="6" height="18" rx="2" fill="#${c}50"/>
      <rect x="108" y="92" width="6" height="18" rx="2" fill="#${c}65"/>
      <rect x="146" y="60" width="6" height="18" rx="2" fill="#${c}80"/>
    </svg>`,

    team: `<svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="90" r="72" fill="#${c}07"/>
      <circle cx="68" cy="62" r="20" fill="#${c}25"/>
      <circle cx="68" cy="54" r="13" fill="#${c}55"/>
      <path d="M34,128 Q34,92 68,92 Q102,92 102,128" fill="#${c}55"/>
      <circle cx="120" cy="50" r="23" fill="#${c}15"/>
      <circle cx="120" cy="42" r="15" fill="#${c}"/>
      <path d="M84,128 Q84,84 120,84 Q156,84 156,128" fill="#${c}"/>
      <circle cx="172" cy="62" r="20" fill="#${c}25"/>
      <circle cx="172" cy="54" r="13" fill="#${c}55"/>
      <path d="M138,128 Q138,92 172,92 Q206,92 206,128" fill="#${c}55"/>
      <line x1="86" y1="66" x2="105" y2="60" stroke="#${c}45" stroke-width="1.5" stroke-dasharray="4,3"/>
      <line x1="135" y1="60" x2="154" y2="66" stroke="#${c}45" stroke-width="1.5" stroke-dasharray="4,3"/>
    </svg>`,

    idea: `<svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="80" r="70" fill="#${c}07"/>
      <path d="M120,22 C93,22 72,43 72,70 C72,90 83,106 93,116 L93,135 L147,135 L147,116 C157,106 168,90 168,70 C168,43 147,22 120,22 Z" fill="#${c}20" stroke="#${c}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M120,34 C101,34 86,49 86,70 C86,85 94,97 102,106 L102,123 L138,123 L138,106 C146,97 154,85 154,70 C154,49 139,34 120,34 Z" fill="#${c}35"/>
      <line x1="98" y1="142" x2="142" y2="142" stroke="#${c}" stroke-width="3" stroke-linecap="round"/>
      <line x1="103" y1="152" x2="137" y2="152" stroke="#${c}70" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="120" y1="5" x2="120" y2="16" stroke="#${c}" stroke-width="3" stroke-linecap="round"/>
      <line x1="150" y1="13" x2="142" y2="21" stroke="#${c}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="90" y1="13" x2="98" y2="21" stroke="#${c}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="165" y1="38" x2="157" y2="44" stroke="#${c}80" stroke-width="2" stroke-linecap="round"/>
      <line x1="75" y1="38" x2="83" y2="44" stroke="#${c}80" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    data: `<svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="90" r="72" fill="#${c}07"/>
      <circle cx="90" cy="88" r="52" fill="#${c}18" stroke="#${c}30" stroke-width="1.5"/>
      <path d="M90,88 L90,36 A52,52 0 0,1 135,112 Z" fill="#${c}"/>
      <path d="M90,88 L135,112 A52,52 0 0,1 52,118 Z" fill="#${c}65"/>
      <path d="M90,88 L52,118 A52,52 0 0,1 90,36 Z" fill="#${c}35"/>
      <circle cx="90" cy="88" r="18" fill="white"/>
      <circle cx="90" cy="88" r="12" fill="#${c}20"/>
      <rect x="158" y="50" width="14" height="14" rx="3" fill="#${c}"/>
      <rect x="158" y="72" width="14" height="14" rx="3" fill="#${c}65"/>
      <rect x="158" y="94" width="14" height="14" rx="3" fill="#${c}35"/>
      <line x1="178" y1="57" x2="210" y2="57" stroke="#${c}50" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="178" y1="79" x2="206" y2="79" stroke="#${c}50" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="178" y1="101" x2="208" y2="101" stroke="#${c}50" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,

    strategy: `<svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="95" r="72" fill="#${c}06"/>
      <circle cx="100" cy="95" r="68" stroke="#${c}12" stroke-width="2" fill="none"/>
      <circle cx="100" cy="95" r="50" stroke="#${c}20" stroke-width="2" fill="none"/>
      <circle cx="100" cy="95" r="32" stroke="#${c}35" stroke-width="2" fill="none"/>
      <circle cx="100" cy="95" r="16" fill="#${c}60"/>
      <circle cx="100" cy="95" r="7" fill="#${c}"/>
      <line x1="170" y1="30" x2="110" y2="84" stroke="#${c}" stroke-width="3.5" stroke-linecap="round"/>
      <polygon points="170,30 154,43 167,46" fill="#${c}"/>
      <circle cx="148" cy="55" r="5" fill="#${c}60"/>
    </svg>`,

    rocket: `<svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="130" cy="80" r="70" fill="#${c}07"/>
      <path d="M130,15 C130,15 95,40 90,90 L130,115 L170,90 C165,40 130,15 130,15 Z" fill="#${c}25" stroke="#${c}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M110,95 C110,95 108,120 115,130 L130,115 L145,130 C152,120 150,95 150,95 Z" fill="#${c}50"/>
      <path d="M90,90 C75,90 68,100 70,115 L90,105 Z" fill="#${c}40"/>
      <path d="M170,90 C185,90 192,100 190,115 L170,105 Z" fill="#${c}40"/>
      <circle cx="130" cy="72" r="14" fill="white" stroke="#${c}" stroke-width="2"/>
      <circle cx="130" cy="72" r="7" fill="#${c}60"/>
      <path d="M118,130 L110,160 L125,150 L130,165 L135,150 L150,160 L142,130" fill="#${c}35"/>
    </svg>`,

    checklist: `<svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="130" cy="90" r="70" fill="#${c}07"/>
      <rect x="40" y="25" width="148" height="135" rx="10" fill="white" stroke="#${c}20" stroke-width="1.5"/>
      <rect x="40" y="25" width="148" height="30" rx="10" fill="#${c}"/>
      <rect x="40" y="45" width="148" height="10" rx="0" fill="#${c}"/>
      <line x1="60" y1="38" x2="145" y2="38" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="55" y="70" width="14" height="14" rx="3" fill="#${c}20" stroke="#${c}50" stroke-width="1.5"/>
      <polyline points="57,77 62,82 69,70" stroke="#${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="78" y1="77" x2="168" y2="77" stroke="#${c}60" stroke-width="2" stroke-linecap="round"/>
      <rect x="55" y="95" width="14" height="14" rx="3" fill="#${c}20" stroke="#${c}50" stroke-width="1.5"/>
      <polyline points="57,102 62,107 69,95" stroke="#${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="78" y1="102" x2="155" y2="102" stroke="#${c}60" stroke-width="2" stroke-linecap="round"/>
      <rect x="55" y="120" width="14" height="14" rx="3" fill="#${c}15" stroke="#${c}30" stroke-width="1.5"/>
      <line x1="78" y1="127" x2="160" y2="127" stroke="#${c}35" stroke-width="2" stroke-linecap="round"/>
      <rect x="55" y="143" width="14" height="14" rx="3" fill="#${c}10" stroke="#${c}20" stroke-width="1.5"/>
      <line x1="78" y1="150" x2="148" y2="150" stroke="#${c}25" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  }

  return svgs[name] || svgs.analytics
}

// Auto-pick illustration based on slide title keywords
export function pickIllustration(title: string): IllustrationName {
  const t = title.toLowerCase()
  if (t.match(/팀|인력|직원|조직|사람|구성원|team|people|staff/)) return 'team'
  if (t.match(/성장|증가|향상|개선|상승|growth|increase|improve/)) return 'growth'
  if (t.match(/전략|목표|방향|계획|strategy|goal|target|plan/)) return 'strategy'
  if (t.match(/데이터|분석|통계|수치|data|analytics|statistics/)) return 'analytics'
  if (t.match(/아이디어|혁신|창의|idea|innovation|creative/)) return 'idea'
  if (t.match(/시작|출시|런치|도입|launch|start|rocket/)) return 'rocket'
  if (t.match(/차트|그래프|실적|성과|chart|graph|result/)) return 'analytics'
  if (t.match(/체크|완료|현황|todo|check|status|list/)) return 'checklist'
  if (t.match(/파이|비중|비율|구성|pie|ratio|portion/)) return 'data'
  // Default cycle: analytics → growth → team → idea → data → strategy
  const idx = Math.abs(title.charCodeAt(0) + title.charCodeAt(title.length - 1)) % 6
  return (['analytics', 'growth', 'team', 'idea', 'data', 'strategy'] as IllustrationName[])[idx]
}
