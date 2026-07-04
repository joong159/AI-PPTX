// HTML Slot-based Template System
// Each template is self-contained HTML at 1280x720 with {{SLOT}} placeholders
// Slots: {{TITLE}} {{SUMMARY}} {{BULLET_0..4}} {{STAT}} {{STAT_DESC}} {{ACCENT}} {{BG}}

export interface SlotZone {
  id: string       // matches {{SLOT_ID}}
  x: number        // position in 1280x720 canvas
  y: number
  w: number
  h: number
  fontSize: number
  color: string
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
  fontFamily?: string
  rx?: number      // corner rounding, image zones only
  role: 'title' | 'summary' | 'bullet' | 'stat' | 'stat_desc' | 'quote' | 'label' | 'image'
}

export interface HtmlTemplate {
  id: string
  name: string
  category: string
  tags: string[]
  thumbnailHtml: string   // Full HTML at 1280×720 with filled demo content
  backgroundHtml: string  // HTML background (no text) for editor overlay
  zones: SlotZone[]       // Where Fabric.js places editable text
}

// ─── Helper: fill slots with demo data ───────────────────────────────────────
export function fillSlots(html: string, values: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? '')
}

// ─── Render: combine backgroundHtml + zone text overlays → full slide HTML ──
import type { Slide } from './types'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function getZoneText(zoneId: string, slide: Slide): string {
  if (zoneId === 'TITLE') return slide.title
  if (zoneId === 'SUMMARY') return slide.summary
  if (zoneId === 'LABEL') return slide.key_takeaway || ''
  if (zoneId === 'STAT') return slide.stat_value || ''
  if (zoneId === 'STAT_DESC') return slide.stat_description || ''
  if (zoneId === 'QUOTE') return `"${slide.summary}"`
  if (zoneId.startsWith('BULLET_')) {
    const idx = parseInt(zoneId.split('_')[1])
    const text = slide.bullets[idx] || ''
    return text ? `• ${text}` : ''
  }
  return ''
}

export function buildBackgroundOnlyHtml(template: HtmlTemplate): string {
  return `<div style="width:1280px;height:720px;position:relative;overflow:hidden;">${template.backgroundHtml}</div>`
}

export function buildRenderedHtml(template: HtmlTemplate, slide: Slide): string {
  const textLayers = template.zones
    .map(zone => {
      if (zone.role === 'image') {
        if (!slide.imageUrl) return ''
        const rounding = zone.rx ?? 8
        return `<img src="${escapeHtml(slide.imageUrl)}" style="position:absolute;left:${zone.x}px;top:${zone.y}px;width:${zone.w}px;height:${zone.h}px;object-fit:cover;border-radius:${rounding}px;" />`
      }
      const text = getZoneText(zone.id, slide)
      if (!text) return ''
      const style = [
        'position:absolute',
        `left:${zone.x}px`,
        `top:${zone.y}px`,
        `width:${zone.w}px`,
        `height:${zone.h}px`,
        `font-size:${zone.fontSize}px`,
        `color:${zone.color}`,
        `font-weight:${zone.fontWeight || 'normal'}`,
        `text-align:${zone.textAlign || 'left'}`,
        `font-family:${zone.fontFamily || 'Arial, sans-serif'}`,
        'line-height:1.25',
        'overflow:hidden',
        'word-break:break-word',
        'white-space:pre-wrap',
      ].join(';')
      return `<div style="${style}">${escapeHtml(text)}</div>`
    })
    .join('')

  return `<div style="width:1280px;height:720px;position:relative;overflow:hidden;">${template.backgroundHtml}${textLayers}</div>`
}

// ─── Slide type → template mapping for auto-assignment ───────────────────────
const SLIDE_TYPE_TEMPLATES: Record<string, string[]> = {
  title_and_content: ['dark-hero', 'minimal-white', 'editorial', 'split-bold', 'warm-earth', 'corporate-navy', 'wellness-sage', 'travel-postcard', 'pastel-memphis'],
  section_header:    ['neon-tech', 'pitch-dark', 'gradient-sunset', 'retro-wave', 'creative-burst', 'dark-hero', 'gaming-arcade', 'fashion-editorial-bw'],
  big_stat:          ['startup-bold', 'data-report', 'neon-tech', 'glass-morph', 'pitch-dark', 'finance-growth', 'nonprofit-impact', 'real-estate-luxury'],
  three_cards:       ['gradient-sunset', 'glass-morph', 'corporate-navy', 'creative-burst', 'minimal-white', 'kanban-process', 'pastel-memphis'],
  timeline:          ['academic', 'split-bold', 'corporate-navy', 'minimal-white', 'editorial', 'timeline-horizontal'],
  two_column:        ['editorial', 'split-bold', 'academic', 'corporate-navy'],
  quote_slide:       ['retro-wave', 'warm-earth', 'creative-burst', 'pitch-dark', 'dark-hero', 'quote-spotlight'],
  image_text:        ['editorial', 'warm-earth', 'split-bold', 'dark-hero', 'portfolio-photo', 'wedding-elegant'],
  comparison:        ['split-bold', 'data-report', 'corporate-navy', 'academic', 'comparison-vs'],
  team_grid:         ['corporate-navy', 'gradient-sunset', 'glass-morph', 'minimal-white', 'team-grid-cards'],
}

export interface TemplateSelectionContent {
  bullets?: string[]
  stat_value?: string
  imageUrl?: string
}

export function autoAssignTemplate(
  slideType: string,
  slideIndex: number,
  content?: TemplateSelectionContent,
  usedIds?: Set<string>,
): string {
  const list = SLIDE_TYPE_TEMPLATES[slideType] ?? SLIDE_TYPE_TEMPLATES.title_and_content
  if (!content) {
    // rotate through list so consecutive same-type slides get different designs
    return list[slideIndex % list.length]
  }

  // Content-aware fit score: prefer templates whose zones actually match this
  // slide's shape (bullet count, stat presence, image presence) over a blind
  // round-robin, while still favoring variety across the deck.
  const bulletCount = content.bullets?.length ?? 0
  const hasStat = !!content.stat_value
  const hasImage = !!content.imageUrl

  const scored = list
    .map(id => {
      const t = HTML_TEMPLATES.find(tpl => tpl.id === id)
      if (!t) return null
      const bulletZones = t.zones.filter(z => z.role === 'bullet').length
      const hasStatZone = t.zones.some(z => z.role === 'stat')
      const hasImageZone = t.zones.some(z => z.role === 'image')

      let score = 0
      if (bulletCount > 0) {
        // Reward a close/exact fit; heavily penalize templates that can't hold
        // all the bullets (content would be visually dropped).
        score += bulletZones >= bulletCount ? 10 - Math.min(10, bulletZones - bulletCount) : -(bulletCount - bulletZones) * 5
      }
      if (hasStat === hasStatZone) score += 5
      if (hasImage === hasImageZone) score += 5
      if (usedIds?.has(id)) score -= 3
      return { id, score }
    })
    .filter((s): s is { id: string; score: number } => s !== null)

  if (!scored.length) return list[slideIndex % list.length]

  // Pick randomly among every candidate close to the top score, rather than
  // always the single highest scorer. AI-generated slides of the same type
  // tend to land on similar bullet/stat/image shapes across totally different
  // topics, so a strict argmax would deterministically produce the exact same
  // template every time — this keeps the fit constraint while restoring variety.
  const bestScore = Math.max(...scored.map(s => s.score))
  const MARGIN = 4
  const topCandidates = scored.filter(s => s.score >= bestScore - MARGIN)
  return topCandidates[Math.floor(Math.random() * topCandidates.length)].id
}

// ─── 20 HTML Templates ───────────────────────────────────────────────────────

export const HTML_TEMPLATES: HtmlTemplate[] = [

  // 1. DARK HERO ──────────────────────────────────────────────────────────────
  {
    id: 'dark-hero',
    name: '다크 히어로',
    category: '비즈니스',
    tags: ['dark', '발표', '임팩트'],
    zones: [
      { id: 'TITLE', x: 80, y: 200, w: 900, h: 180, fontSize: 56, color: '#ffffff', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 80, y: 400, w: 800, h: 60, fontSize: 24, color: 'rgba(255,255,255,0.65)', role: 'summary' },
      { id: 'BULLET_0', x: 80, y: 490, w: 740, h: 40, fontSize: 20, color: 'rgba(255,255,255,0.8)', role: 'bullet' },
      { id: 'BULLET_1', x: 80, y: 540, w: 740, h: 40, fontSize: 20, color: 'rgba(255,255,255,0.8)', role: 'bullet' },
      { id: 'BULLET_2', x: 80, y: 590, w: 740, h: 40, fontSize: 20, color: 'rgba(255,255,255,0.8)', role: 'bullet' },
      { id: 'IMAGE', x: 840, y: 180, w: 340, h: 360, fontSize: 0, color: 'transparent', rx: 16, role: 'image' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%);position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;right:-120px;top:-120px;width:560px;height:560px;background:radial-gradient(circle,rgba(79,70,229,0.22),transparent 70%);border-radius:50%;"></div>
  <div style="position:absolute;left:-80px;bottom:-100px;width:400px;height:400px;background:radial-gradient(circle,rgba(124,58,237,0.15),transparent 70%);border-radius:50%;"></div>
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,#4f46e5,#7c3aed,#4f46e5);"></div>
  <div style="position:absolute;left:80px;top:148px;width:64px;height:5px;background:#4f46e5;border-radius:2px;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%);position:relative;overflow:hidden;font-family:Arial,sans-serif;box-sizing:border-box;">
  <div style="position:absolute;right:-120px;top:-120px;width:560px;height:560px;background:radial-gradient(circle,rgba(79,70,229,0.22),transparent 70%);border-radius:50%;"></div>
  <div style="position:absolute;left:-80px;bottom:-100px;width:400px;height:400px;background:radial-gradient(circle,rgba(124,58,237,0.15),transparent 70%);border-radius:50%;"></div>
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,#4f46e5,#7c3aed,#4f46e5);"></div>
  <div style="position:absolute;left:80px;top:148px;width:64px;height:5px;background:#4f46e5;border-radius:2px;"></div>
  <div style="position:absolute;left:80px;top:175px;font-size:58px;font-weight:900;color:#fff;line-height:1.1;max-width:900px;">비즈니스<br>전략 발표</div>
  <div style="position:absolute;left:80px;top:400px;font-size:24px;color:rgba(255,255,255,0.6);">핵심 인사이트와 실행 로드맵</div>
  <div style="position:absolute;left:80px;top:470px;display:flex;flex-direction:column;gap:18px;">
    <div style="display:flex;align-items:center;gap:14px;"><div style="width:8px;height:8px;background:#4f46e5;border-radius:50%;"></div><span style="color:rgba(255,255,255,0.8);font-size:20px;">2024년 시장 현황 분석</span></div>
    <div style="display:flex;align-items:center;gap:14px;"><div style="width:8px;height:8px;background:#4f46e5;border-radius:50%;"></div><span style="color:rgba(255,255,255,0.8);font-size:20px;">성장 전략 3가지 핵심 축</span></div>
    <div style="display:flex;align-items:center;gap:14px;"><div style="width:8px;height:8px;background:#4f46e5;border-radius:50%;"></div><span style="color:rgba(255,255,255,0.8);font-size:20px;">실행 계획 및 KPI 설정</span></div>
  </div>
</div>`,
  },

  // 2. GRADIENT SUNSET ────────────────────────────────────────────────────────
  {
    id: 'gradient-sunset',
    name: '선셋 그라디언트',
    category: '마케팅',
    tags: ['gradient', '컬러', '생동감'],
    zones: [
      { id: 'TITLE', x: 100, y: 220, w: 1080, h: 160, fontSize: 60, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', role: 'title' },
      { id: 'SUMMARY', x: 200, y: 400, w: 880, h: 60, fontSize: 26, color: 'rgba(255,255,255,0.85)', textAlign: 'center', role: 'summary' },
      { id: 'BULLET_0', x: 160, y: 510, w: 280, h: 120, fontSize: 17, color: '#fff', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_1', x: 500, y: 510, w: 280, h: 120, fontSize: 17, color: '#fff', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_2', x: 840, y: 510, w: 280, h: 120, fontSize: 17, color: '#fff', textAlign: 'center', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:linear-gradient(135deg,#f97316,#ec4899,#8b5cf6);position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:800px;height:600px;background:rgba(255,255,255,0.06);border-radius:50%;"></div>
  <div style="position:absolute;bottom:80px;left:160px;width:280px;height:130px;background:rgba(255,255,255,0.12);border-radius:16px;backdrop-filter:blur(10px);"></div>
  <div style="position:absolute;bottom:80px;left:500px;width:280px;height:130px;background:rgba(255,255,255,0.12);border-radius:16px;backdrop-filter:blur(10px);"></div>
  <div style="position:absolute;bottom:80px;left:840px;width:280px;height:130px;background:rgba(255,255,255,0.12);border-radius:16px;backdrop-filter:blur(10px);"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:linear-gradient(135deg,#f97316,#ec4899,#8b5cf6);position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:800px;height:600px;background:rgba(255,255,255,0.06);border-radius:50%;"></div>
  <div style="position:absolute;top:220px;left:0;right:0;text-align:center;font-size:62px;font-weight:900;color:#fff;line-height:1.1;">마케팅 전략 2024</div>
  <div style="position:absolute;top:400px;left:0;right:0;text-align:center;font-size:26px;color:rgba(255,255,255,0.85);">브랜드를 성장시키는 3가지 핵심 전략</div>
  <div style="position:absolute;bottom:80px;left:160px;width:280px;height:130px;background:rgba(255,255,255,0.12);border-radius:16px;display:flex;align-items:center;justify-content:center;text-align:center;padding:16px;box-sizing:border-box;">
    <div style="color:#fff;font-size:18px;font-weight:600;">🎯<br>타겟 마케팅</div>
  </div>
  <div style="position:absolute;bottom:80px;left:500px;width:280px;height:130px;background:rgba(255,255,255,0.12);border-radius:16px;display:flex;align-items:center;justify-content:center;text-align:center;padding:16px;box-sizing:border-box;">
    <div style="color:#fff;font-size:18px;font-weight:600;">📱<br>소셜 미디어</div>
  </div>
  <div style="position:absolute;bottom:80px;left:840px;width:280px;height:130px;background:rgba(255,255,255,0.12);border-radius:16px;display:flex;align-items:center;justify-content:center;text-align:center;padding:16px;box-sizing:border-box;">
    <div style="color:#fff;font-size:18px;font-weight:600;">📈<br>데이터 분석</div>
  </div>
</div>`,
  },

  // 3. SPLIT BOLD ─────────────────────────────────────────────────────────────
  {
    id: 'split-bold',
    name: '볼드 스플릿',
    category: '비즈니스',
    tags: ['split', 'bold', '강렬'],
    zones: [
      { id: 'TITLE', x: 60, y: 180, w: 520, h: 260, fontSize: 52, color: '#ffffff', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 60, y: 470, w: 520, h: 60, fontSize: 20, color: 'rgba(255,255,255,0.7)', role: 'summary' },
      { id: 'BULLET_0', x: 680, y: 180, w: 560, h: 50, fontSize: 20, color: '#1e293b', role: 'bullet' },
      { id: 'BULLET_1', x: 680, y: 260, w: 560, h: 50, fontSize: 20, color: '#1e293b', role: 'bullet' },
      { id: 'BULLET_2', x: 680, y: 340, w: 560, h: 50, fontSize: 20, color: '#1e293b', role: 'bullet' },
      { id: 'BULLET_3', x: 680, y: 420, w: 560, h: 50, fontSize: 20, color: '#1e293b', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#f8fafc;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;width:620px;height:720px;background:linear-gradient(160deg,#1e1b4b,#312e81);"></div>
  <div style="position:absolute;top:0;left:580px;width:6px;height:720px;background:linear-gradient(180deg,#4f46e5,#7c3aed);"></div>
  <div style="position:absolute;bottom:0;left:0;width:620px;height:4px;background:#4f46e5;"></div>
  <div style="position:absolute;right:60px;bottom:60px;width:80px;height:80px;border:3px solid #e2e8f0;border-radius:50%;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#f8fafc;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;width:620px;height:720px;background:linear-gradient(160deg,#1e1b4b,#312e81);"></div>
  <div style="position:absolute;top:0;left:580px;width:6px;height:720px;background:linear-gradient(180deg,#4f46e5,#7c3aed);"></div>
  <div style="position:absolute;top:90px;left:60px;width:40px;height:4px;background:#4f46e5;"></div>
  <div style="position:absolute;top:120px;left:60px;font-size:52px;font-weight:900;color:#fff;line-height:1.1;max-width:490px;">분기별<br>실적 보고</div>
  <div style="position:absolute;top:460px;left:60px;font-size:20px;color:rgba(255,255,255,0.65);">Q3 2024 성과 리뷰</div>
  <div style="position:absolute;top:160px;left:680px;display:flex;flex-direction:column;gap:40px;">
    ${['매출 전년 대비 34% 성장', '신규 고객 1,280명 유치', '고객 만족도 NPS +72 달성', '운영 비용 15% 절감'].map(t => `<div style="display:flex;align-items:center;gap:16px;"><div style="width:8px;height:8px;background:#4f46e5;border-radius:50%;flex-shrink:0;"></div><span style="color:#1e293b;font-size:20px;">${t}</span></div>`).join('')}
  </div>
</div>`,
  },

  // 4. MINIMAL WHITE ──────────────────────────────────────────────────────────
  {
    id: 'minimal-white',
    name: '미니멀 화이트',
    category: '교육',
    tags: ['minimal', 'clean', '여백'],
    zones: [
      { id: 'LABEL', x: 80, y: 120, w: 300, h: 40, fontSize: 14, color: '#6366f1', fontWeight: 'bold', role: 'label' },
      { id: 'TITLE', x: 80, y: 170, w: 1100, h: 200, fontSize: 64, color: '#0f172a', fontWeight: 'bold', role: 'title' },
      { id: 'BULLET_0', x: 80, y: 420, w: 360, h: 180, fontSize: 18, color: '#475569', role: 'bullet' },
      { id: 'BULLET_1', x: 480, y: 420, w: 360, h: 180, fontSize: 18, color: '#475569', role: 'bullet' },
      { id: 'BULLET_2', x: 880, y: 420, w: 360, h: 180, fontSize: 18, color: '#475569', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#ffffff;position:relative;overflow:hidden;font-family:'Arial',sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:#6366f1;"></div>
  <div style="position:absolute;top:395px;left:80px;right:80px;height:1px;background:#e2e8f0;"></div>
  <div style="position:absolute;bottom:40px;right:80px;width:120px;height:4px;background:#6366f1;border-radius:2px;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#ffffff;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:#6366f1;"></div>
  <div style="position:absolute;top:120px;left:80px;font-size:13px;font-weight:700;color:#6366f1;letter-spacing:3px;text-transform:uppercase;">EDUCATION</div>
  <div style="position:absolute;top:155px;left:80px;font-size:64px;font-weight:900;color:#0f172a;line-height:1.05;max-width:1100px;">학습의 미래를<br>설계하다</div>
  <div style="position:absolute;top:395px;left:80px;right:80px;height:1px;background:#e2e8f0;"></div>
  <div style="position:absolute;top:415px;left:80px;display:flex;gap:0;">
    ${['커리큘럼 혁신', '개인 맞춤 학습', '성과 측정 시스템'].map((t, i) => `<div style="width:360px;padding:20px 0;"><div style="font-size:32px;font-weight:900;color:#6366f1;margin-bottom:8px;">0${i+1}</div><div style="font-size:18px;color:#475569;">${t}</div></div>`).join('')}
  </div>
  <div style="position:absolute;bottom:40px;right:80px;width:120px;height:4px;background:#6366f1;border-radius:2px;"></div>
</div>`,
  },

  // 5. NEON TECH ──────────────────────────────────────────────────────────────
  {
    id: 'neon-tech',
    name: '네온 테크',
    category: '기술',
    tags: ['neon', 'dark', 'tech', 'startup'],
    zones: [
      { id: 'TITLE', x: 80, y: 200, w: 1100, h: 160, fontSize: 60, color: '#ffffff', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 80, y: 380, w: 860, h: 60, fontSize: 22, color: '#94a3b8', role: 'summary' },
      { id: 'STAT', x: 80, y: 480, w: 300, h: 120, fontSize: 72, color: '#22d3ee', fontWeight: 'bold', role: 'stat' },
      { id: 'BULLET_0', x: 440, y: 480, w: 360, h: 50, fontSize: 19, color: '#cbd5e1', role: 'bullet' },
      { id: 'BULLET_1', x: 440, y: 540, w: 360, h: 50, fontSize: 19, color: '#cbd5e1', role: 'bullet' },
      { id: 'BULLET_2', x: 840, y: 480, w: 360, h: 50, fontSize: 19, color: '#cbd5e1', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#020617;position:relative;overflow:hidden;font-family:'Courier New',monospace;">
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(34,211,238,0.03) 40px,rgba(34,211,238,0.03) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(34,211,238,0.03) 40px,rgba(34,211,238,0.03) 41px);"></div>
  <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#22d3ee,transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#22d3ee,transparent);"></div>
  <div style="position:absolute;left:80px;top:140px;width:40px;height:2px;background:#22d3ee;box-shadow:0 0 12px #22d3ee;"></div>
  <div style="position:absolute;right:100px;top:200px;width:200px;height:200px;border:1px solid rgba(34,211,238,0.15);border-radius:50%;"></div>
  <div style="position:absolute;right:140px;top:240px;width:120px;height:120px;border:1px solid rgba(34,211,238,0.25);border-radius:50%;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#020617;position:relative;overflow:hidden;font-family:'Courier New',monospace;">
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(34,211,238,0.03) 40px,rgba(34,211,238,0.03) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(34,211,238,0.03) 40px,rgba(34,211,238,0.03) 41px);"></div>
  <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#22d3ee,transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#22d3ee,transparent);"></div>
  <div style="position:absolute;left:80px;top:140px;width:40px;height:2px;background:#22d3ee;box-shadow:0 0 12px #22d3ee;"></div>
  <div style="position:absolute;right:100px;top:200px;width:200px;height:200px;border:1px solid rgba(34,211,238,0.15);border-radius:50%;"></div>
  <div style="position:absolute;left:80px;top:170px;font-size:60px;font-weight:900;color:#fff;line-height:1.1;">AI 기술 로드맵<br><span style="color:#22d3ee;">2025</span></div>
  <div style="position:absolute;left:80px;top:390px;font-size:22px;color:#94a3b8;">차세대 AI 플랫폼 개발 현황 및 계획</div>
  <div style="position:absolute;left:80px;top:470px;font-size:72px;font-weight:900;color:#22d3ee;text-shadow:0 0 30px rgba(34,211,238,0.5);">340%</div>
  <div style="position:absolute;left:440px;top:480px;display:flex;flex-direction:column;gap:18px;">
    <div style="color:#cbd5e1;font-size:19px;">▸ 모델 성능 향상률</div>
    <div style="color:#cbd5e1;font-size:19px;">▸ 처리 속도 개선</div>
  </div>
</div>`,
  },

  // 6. WARM EARTH ─────────────────────────────────────────────────────────────
  {
    id: 'warm-earth',
    name: '웜 어스',
    category: '교육',
    tags: ['warm', 'earth', '자연', '따뜻한'],
    zones: [
      { id: 'TITLE', x: 80, y: 160, w: 700, h: 200, fontSize: 54, color: '#1c1917', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 80, y: 390, w: 680, h: 60, fontSize: 21, color: '#57534e', role: 'summary' },
      { id: 'BULLET_0', x: 80, y: 480, w: 650, h: 44, fontSize: 19, color: '#44403c', role: 'bullet' },
      { id: 'BULLET_1', x: 80, y: 530, w: 650, h: 44, fontSize: 19, color: '#44403c', role: 'bullet' },
      { id: 'BULLET_2', x: 80, y: 580, w: 650, h: 44, fontSize: 19, color: '#44403c', role: 'bullet' },
      { id: 'IMAGE', x: 860, y: 190, w: 340, h: 340, fontSize: 0, color: 'transparent', rx: 170, role: 'image' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:linear-gradient(160deg,#fef3c7,#fde68a 40%,#fef3c7);position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;right:0;top:0;width:520px;height:720px;background:linear-gradient(160deg,#d97706,#92400e);clip-path:polygon(20% 0, 100% 0, 100% 100%, 0 100%);"></div>
  <div style="position:absolute;right:80px;top:50%;transform:translateY(-50%);width:340px;height:340px;border:3px solid rgba(255,255,255,0.3);border-radius:50%;"></div>
  <div style="position:absolute;right:130px;top:50%;transform:translateY(-50%);width:240px;height:240px;border:2px solid rgba(255,255,255,0.2);border-radius:50%;"></div>
  <div style="position:absolute;left:80px;top:130px;width:6px;height:220px;background:#d97706;border-radius:3px;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:linear-gradient(160deg,#fef3c7,#fde68a 40%,#fef3c7);position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;right:0;top:0;width:520px;height:720px;background:linear-gradient(160deg,#d97706,#92400e);clip-path:polygon(20% 0, 100% 0, 100% 100%, 0 100%);"></div>
  <div style="position:absolute;right:80px;top:50%;transform:translateY(-50%);width:340px;height:340px;border:3px solid rgba(255,255,255,0.3);border-radius:50%;"></div>
  <div style="position:absolute;left:80px;top:130px;width:6px;height:220px;background:#d97706;border-radius:3px;"></div>
  <div style="position:absolute;left:110px;top:160px;font-size:54px;font-weight:700;color:#1c1917;line-height:1.15;max-width:680px;">지속가능한<br>미래 교육</div>
  <div style="position:absolute;left:110px;top:390px;font-size:21px;color:#57534e;">환경과 공존하는 새로운 학습 패러다임</div>
  <div style="position:absolute;left:110px;top:475px;display:flex;flex-direction:column;gap:18px;">
    ${['🌱 생태 감수성 교육 통합', '♻️ 지속가능한 교과과정 설계', '🌍 글로벌 환경 리터러시 함양'].map(t => `<div style="color:#44403c;font-size:19px;">${t}</div>`).join('')}
  </div>
</div>`,
  },

  // 7. CORPORATE NAVY ─────────────────────────────────────────────────────────
  {
    id: 'corporate-navy',
    name: '코퍼레이트 네이비',
    category: '비즈니스',
    tags: ['corporate', '전문', '임원'],
    zones: [
      { id: 'TITLE', x: 60, y: 200, w: 1160, h: 150, fontSize: 52, color: '#1e3a5f', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 60, y: 380, w: 760, h: 50, fontSize: 20, color: '#475569', role: 'summary' },
      { id: 'BULLET_0', x: 60, y: 470, w: 280, h: 150, fontSize: 17, color: '#334155', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_1', x: 380, y: 470, w: 280, h: 150, fontSize: 17, color: '#334155', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_2', x: 700, y: 470, w: 280, h: 150, fontSize: 17, color: '#334155', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_3', x: 1020, y: 470, w: 220, h: 150, fontSize: 17, color: '#334155', textAlign: 'center', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#f0f4f8;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:8px;background:linear-gradient(90deg,#1e3a5f,#2563eb);"></div>
  <div style="position:absolute;top:8px;left:0;right:0;height:120px;background:#1e3a5f;"></div>
  <div style="position:absolute;top:140px;left:60px;right:60px;height:1px;background:#cbd5e1;"></div>
  <div style="position:absolute;bottom:60px;left:60px;width:60px;height:60px;border:3px solid #1e3a5f;border-radius:50%;display:flex;align-items:center;justify-content:center;"></div>
  ${[60,380,700,1020].map(x => `<div style="position:absolute;top:440px;left:${x}px;width:${x===1020?220:280}px;height:200px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);border-top:4px solid #2563eb;"></div>`).join('')}
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#f0f4f8;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:8px;background:linear-gradient(90deg,#1e3a5f,#2563eb);"></div>
  <div style="position:absolute;top:8px;left:0;right:0;height:120px;background:#1e3a5f;"></div>
  <div style="position:absolute;top:28px;left:60px;font-size:18px;color:rgba(255,255,255,0.7);letter-spacing:2px;">CORPORATE STRATEGY</div>
  <div style="position:absolute;top:140px;left:60px;right:60px;height:1px;background:#cbd5e1;"></div>
  <div style="position:absolute;top:190px;left:60px;font-size:52px;font-weight:800;color:#1e3a5f;line-height:1.1;max-width:1100px;">2024 사업 전략 계획</div>
  <div style="position:absolute;top:370px;left:60px;font-size:20px;color:#475569;">4개 핵심 영역의 전략적 목표와 실행 방안</div>
  ${[{x:60,t:'시장 확대',i:'🌏'},{x:380,t:'제품 혁신',i:'⚡'},{x:700,t:'고객 성공',i:'🎯'},{x:1020,t:'조직 역량',i:'👥'}].map(({x,t,i}) => `<div style="position:absolute;top:440px;left:${x}px;width:${x===1020?220:280}px;height:200px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);border-top:4px solid #2563eb;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;"><div style="font-size:36px;">${i}</div><div style="font-size:18px;font-weight:700;color:#1e3a5f;">${t}</div></div>`).join('')}
</div>`,
  },

  // 8. STARTUP BOLD ───────────────────────────────────────────────────────────
  {
    id: 'startup-bold',
    name: '스타트업 볼드',
    category: '스타트업',
    tags: ['startup', 'bold', '강렬', '피치덱'],
    zones: [
      { id: 'TITLE', x: 80, y: 220, w: 1100, h: 220, fontSize: 76, color: '#09090b', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 80, y: 480, w: 900, h: 60, fontSize: 26, color: '#71717a', role: 'summary' },
      { id: 'STAT', x: 1000, y: 200, w: 220, h: 120, fontSize: 80, color: '#4f46e5', fontWeight: 'bold', textAlign: 'center', role: 'stat' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#fafafa;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:140px;background:#09090b;"></div>
  <div style="position:absolute;top:140px;left:0;right:0;height:6px;background:linear-gradient(90deg,#4f46e5,#7c3aed,#ec4899);"></div>
  <div style="position:absolute;bottom:60px;right:80px;font-size:120px;font-weight:900;color:rgba(79,70,229,0.06);line-height:1;">AI</div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#fafafa;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:140px;background:#09090b;display:flex;align-items:center;padding:0 80px;"><span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">SlideAI</span><span style="margin-left:auto;color:rgba(255,255,255,0.5);font-size:16px;">Seed Round 2024</span></div>
  <div style="position:absolute;top:140px;left:0;right:0;height:6px;background:linear-gradient(90deg,#4f46e5,#7c3aed,#ec4899);"></div>
  <div style="position:absolute;bottom:60px;right:80px;font-size:120px;font-weight:900;color:rgba(79,70,229,0.06);line-height:1;">AI</div>
  <div style="position:absolute;top:210px;left:80px;font-size:76px;font-weight:900;color:#09090b;line-height:1.05;max-width:850px;">AI로 만드는<br>프레젠테이션</div>
  <div style="position:absolute;top:470px;left:80px;font-size:26px;color:#71717a;">10초 만에 전문가 수준의 슬라이드를 완성하세요</div>
  <div style="position:absolute;top:200px;right:80px;text-align:center;"><div style="font-size:80px;font-weight:900;color:#4f46e5;line-height:1;">$2M</div><div style="font-size:18px;color:#71717a;margin-top:4px;">투자 유치 목표</div></div>
</div>`,
  },

  // 9. EDITORIAL ──────────────────────────────────────────────────────────────
  {
    id: 'editorial',
    name: '에디토리얼',
    category: '마케팅',
    tags: ['editorial', 'magazine', '잡지', '고급'],
    zones: [
      { id: 'LABEL', x: 540, y: 100, w: 700, h: 40, fontSize: 13, color: '#64748b', role: 'label' },
      { id: 'TITLE', x: 540, y: 155, w: 700, h: 280, fontSize: 58, color: '#0f172a', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 540, y: 455, w: 680, h: 80, fontSize: 20, color: '#64748b', role: 'summary' },
      { id: 'BULLET_0', x: 540, y: 570, w: 200, h: 80, fontSize: 17, color: '#475569', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_1', x: 760, y: 570, w: 200, h: 80, fontSize: 17, color: '#475569', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_2', x: 980, y: 570, w: 200, h: 80, fontSize: 17, color: '#475569', textAlign: 'center', role: 'bullet' },
      { id: 'IMAGE', x: 0, y: 0, w: 500, h: 720, fontSize: 0, color: 'transparent', rx: 0, role: 'image' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#fff;position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;top:0;left:0;width:500px;height:720px;background:linear-gradient(160deg,#0f172a,#1e293b);"></div>
  <div style="position:absolute;top:0;left:480px;width:4px;height:720px;background:#f59e0b;"></div>
  <div style="position:absolute;top:90px;left:540px;right:40px;height:1px;background:#e2e8f0;"></div>
  <div style="position:absolute;top:540px;left:540px;right:40px;height:1px;background:#e2e8f0;"></div>
  ${[540,760,980].map((x,i) => `<div style="position:absolute;top:545px;left:${x}px;width:200px;height:80px;background:#f8fafc;border-radius:8px;display:flex;align-items:center;justify-content:center;"></div>`).join('')}
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#fff;position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;top:0;left:0;width:500px;height:720px;background:linear-gradient(160deg,#0f172a,#1e293b);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:16px;">
    <div style="font-size:90px;font-weight:900;color:rgba(255,255,255,0.1);line-height:1;">M</div>
    <div style="font-size:16px;color:rgba(255,255,255,0.4);letter-spacing:4px;text-transform:uppercase;">MARKETING</div>
  </div>
  <div style="position:absolute;top:0;left:480px;width:4px;height:720px;background:#f59e0b;"></div>
  <div style="position:absolute;top:90px;left:540px;right:40px;height:1px;background:#e2e8f0;"></div>
  <div style="position:absolute;top:100px;left:540px;font-size:13px;color:#64748b;letter-spacing:2px;text-transform:uppercase;">BRAND STRATEGY 2024</div>
  <div style="position:absolute;top:140px;left:540px;font-size:56px;font-weight:700;color:#0f172a;line-height:1.1;max-width:700px;">브랜드 전략의<br>새로운 패러다임</div>
  <div style="position:absolute;top:430px;left:540px;font-size:19px;color:#64748b;max-width:680px;">고객과 깊게 연결되는 브랜드를 구축하는 방법</div>
  <div style="position:absolute;top:540px;left:540px;right:40px;height:1px;background:#e2e8f0;"></div>
  ${[{x:540,t:'인지도 확대'},{x:760,t:'신뢰 구축'},{x:980,t:'충성도 향상'}].map(({x,t}) => `<div style="position:absolute;top:558px;left:${x}px;width:200px;height:80px;background:#f8fafc;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;color:#475569;font-weight:600;">${t}</div>`).join('')}
</div>`,
  },

  // 10. GLASS MORPHISM ────────────────────────────────────────────────────────
  {
    id: 'glass-morph',
    name: '글래스 모피즘',
    category: '스타트업',
    tags: ['glass', 'modern', '트렌드', '투명'],
    zones: [
      { id: 'TITLE', x: 100, y: 200, w: 1080, h: 160, fontSize: 60, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', role: 'title' },
      { id: 'SUMMARY', x: 200, y: 390, w: 880, h: 60, fontSize: 22, color: 'rgba(255,255,255,0.75)', textAlign: 'center', role: 'summary' },
      { id: 'BULLET_0', x: 100, y: 490, w: 320, h: 150, fontSize: 17, color: '#fff', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_1', x: 480, y: 490, w: 320, h: 150, fontSize: 17, color: '#fff', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_2', x: 860, y: 490, w: 320, h: 150, fontSize: 17, color: '#fff', textAlign: 'center', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:linear-gradient(135deg,#667eea,#764ba2);position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:-200px;right:-200px;width:600px;height:600px;background:rgba(255,255,255,0.1);border-radius:50%;"></div>
  <div style="position:absolute;bottom:-100px;left:-100px;width:400px;height:400px;background:rgba(255,255,255,0.08);border-radius:50%;"></div>
  ${[100,480,860].map(x => `<div style="position:absolute;top:470px;left:${x}px;width:320px;height:180px;background:rgba(255,255,255,0.12);border-radius:20px;border:1px solid rgba(255,255,255,0.25);backdrop-filter:blur(10px);"></div>`).join('')}
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:linear-gradient(135deg,#667eea,#764ba2);position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:-200px;right:-200px;width:600px;height:600px;background:rgba(255,255,255,0.1);border-radius:50%;"></div>
  <div style="position:absolute;bottom:-100px;left:-100px;width:400px;height:400px;background:rgba(255,255,255,0.08);border-radius:50%;"></div>
  <div style="position:absolute;top:190px;left:0;right:0;text-align:center;font-size:60px;font-weight:900;color:#fff;">차세대 SaaS 플랫폼</div>
  <div style="position:absolute;top:380px;left:0;right:0;text-align:center;font-size:22px;color:rgba(255,255,255,0.75);">투명하고 유연한 클라우드 솔루션</div>
  ${[{x:100,i:'☁️',t:'클라우드 네이티브'},{x:480,i:'🔒',t:'엔터프라이즈 보안'},{x:860,i:'⚡',t:'실시간 처리'}].map(({x,i,t}) => `<div style="position:absolute;top:470px;left:${x}px;width:320px;height:180px;background:rgba(255,255,255,0.12);border-radius:20px;border:1px solid rgba(255,255,255,0.25);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;"><div style="font-size:40px;">${i}</div><div style="color:#fff;font-size:18px;font-weight:600;">${t}</div></div>`).join('')}
</div>`,
  },

  // 11. RETRO WAVE ────────────────────────────────────────────────────────────
  {
    id: 'retro-wave',
    name: '레트로 웨이브',
    category: '마케팅',
    tags: ['retro', 'vintage', '감성', '레트로'],
    zones: [
      { id: 'TITLE', x: 80, y: 200, w: 1100, h: 200, fontSize: 68, color: '#fff', fontWeight: 'bold', textAlign: 'center', role: 'title' },
      { id: 'SUMMARY', x: 200, y: 430, w: 880, h: 60, fontSize: 24, color: '#fbbf24', textAlign: 'center', role: 'summary' },
      { id: 'BULLET_0', x: 140, y: 530, w: 300, h: 100, fontSize: 18, color: '#fff', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_1', x: 490, y: 530, w: 300, h: 100, fontSize: 18, color: '#fff', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_2', x: 840, y: 530, w: 300, h: 100, fontSize: 18, color: '#fff', textAlign: 'center', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:linear-gradient(180deg,#0f0c29,#302b63,#24243e);position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;bottom:0;left:0;right:0;height:280px;background:linear-gradient(180deg,transparent,#ff6b6b20);"></div>
  <div style="position:absolute;bottom:50px;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#ff6b6b,#fbbf24,#ff6b6b,transparent);"></div>
  <div style="position:absolute;bottom:80px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,107,107,0.3),transparent);"></div>
  <div style="position:absolute;top:50px;left:50%;transform:translateX(-50%);width:4px;height:100px;background:linear-gradient(180deg,#fbbf24,transparent);"></div>
  ${[140,490,840].map(x => `<div style="position:absolute;top:505px;left:${x}px;width:300px;height:120px;border:1px solid rgba(251,191,36,0.3);border-radius:12px;"></div>`).join('')}
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:linear-gradient(180deg,#0f0c29,#302b63,#24243e);position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;bottom:0;left:0;right:0;height:280px;background:linear-gradient(180deg,transparent,rgba(255,107,107,0.1));"></div>
  <div style="position:absolute;bottom:50px;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#ff6b6b,#fbbf24,#ff6b6b,transparent);"></div>
  <div style="position:absolute;top:50px;left:50%;transform:translateX(-50%);width:4px;height:100px;background:linear-gradient(180deg,#fbbf24,transparent);"></div>
  <div style="position:absolute;top:180px;left:0;right:0;text-align:center;font-size:68px;font-weight:900;color:#fff;text-shadow:0 0 40px rgba(251,191,36,0.4);line-height:1.1;">80s 인스피레이션<br>마케팅 전략</div>
  <div style="position:absolute;top:420px;left:0;right:0;text-align:center;font-size:24px;color:#fbbf24;">복고풍 감성으로 MZ세대 공략하기</div>
  ${[{x:140,t:'바이럴 캠페인'},{x:490,t:'인플루언서 협업'},{x:840,t:'레트로 브랜딩'}].map(({x,t}) => `<div style="position:absolute;top:505px;left:${x}px;width:300px;height:120px;border:1px solid rgba(251,191,36,0.3);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;font-weight:600;">${t}</div>`).join('')}
</div>`,
  },

  // 12. DATA REPORT ───────────────────────────────────────────────────────────
  {
    id: 'data-report',
    name: '데이터 리포트',
    category: '비즈니스',
    tags: ['data', 'report', '분석', '통계'],
    zones: [
      { id: 'TITLE', x: 60, y: 100, w: 860, h: 100, fontSize: 42, color: '#0f172a', fontWeight: 'bold', role: 'title' },
      { id: 'STAT', x: 60, y: 240, w: 340, h: 160, fontSize: 80, color: '#2563eb', fontWeight: 'bold', role: 'stat' },
      { id: 'STAT_DESC', x: 60, y: 420, w: 340, h: 50, fontSize: 18, color: '#64748b', role: 'stat_desc' },
      { id: 'BULLET_0', x: 460, y: 240, w: 360, h: 60, fontSize: 19, color: '#334155', role: 'bullet' },
      { id: 'BULLET_1', x: 460, y: 320, w: 360, h: 60, fontSize: 19, color: '#334155', role: 'bullet' },
      { id: 'BULLET_2', x: 460, y: 400, w: 360, h: 60, fontSize: 19, color: '#334155', role: 'bullet' },
      { id: 'BULLET_3', x: 460, y: 480, w: 360, h: 60, fontSize: 19, color: '#334155', role: 'bullet' },
      { id: 'SUMMARY', x: 860, y: 240, w: 360, h: 300, fontSize: 17, color: '#64748b', role: 'summary' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#f8fafc;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:80px;background:#0f172a;"></div>
  <div style="position:absolute;top:80px;left:0;width:400px;height:4px;background:#2563eb;"></div>
  <div style="position:absolute;top:80px;left:0;bottom:0;width:400px;background:rgba(37,99,235,0.04);border-right:1px solid #e2e8f0;"></div>
  <div style="position:absolute;top:80px;left:400px;bottom:0;width:360px;background:#fff;border-right:1px solid #e2e8f0;"></div>
  <div style="position:absolute;top:80px;left:760px;width:4px;height:640px;background:#e2e8f0;"></div>
  ${[[0,'#2563eb'],[1,'#10b981'],[2,'#f59e0b']].map(([i,c]) => `<div style="position:absolute;top:${500+Number(i)*60}px;left:860px;height:40px;background:${c}20;border-left:4px solid ${c};border-radius:0 8px 8px 0;"></div>`).join('')}
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#f8fafc;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:80px;background:#0f172a;display:flex;align-items:center;padding:0 60px;"><span style="color:#fff;font-size:20px;font-weight:700;">DATA INSIGHTS</span><span style="margin-left:auto;color:rgba(255,255,255,0.5);font-size:14px;">Q4 2024</span></div>
  <div style="position:absolute;top:80px;left:0;width:400px;height:4px;background:#2563eb;"></div>
  <div style="position:absolute;top:84px;left:0;bottom:0;width:400px;background:rgba(37,99,235,0.04);border-right:1px solid #e2e8f0;"></div>
  <div style="position:absolute;top:84px;left:400px;bottom:0;width:360px;background:#fff;border-right:1px solid #e2e8f0;"></div>
  <div style="position:absolute;top:100px;left:60px;font-size:40px;font-weight:800;color:#0f172a;max-width:780px;">연간 성장 지표 분석 리포트</div>
  <div style="position:absolute;top:240px;left:60px;font-size:80px;font-weight:900;color:#2563eb;line-height:1;">+147%</div>
  <div style="position:absolute;top:340px;left:60px;font-size:18px;color:#64748b;">전년 대비 매출 성장률</div>
  ${['신규 고객 4,200명','월 반복 수익 $2.4M','고객 유지율 94%','순추천지수 NPS +78'].map((t,i) => `<div style="position:absolute;top:${240+i*70}px;left:460px;display:flex;align-items:center;gap:12px;"><div style="width:6px;height:6px;background:#2563eb;border-radius:50%;"></div><span style="font-size:19px;color:#334155;">${t}</span></div>`).join('')}
  <div style="position:absolute;top:240px;left:860px;right:40px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:16px;padding:30px;height:300px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;"><div style="font-size:15px;color:#3b82f6;font-weight:700;margin-bottom:16px;">KEY INSIGHT</div><div style="font-size:18px;color:#1e3a8a;line-height:1.6;">AI 기반 제품 혁신으로<br>시장 점유율이 급격히<br>확대되는 추세입니다</div></div>
</div>`,
  },

  // 13. CREATIVE BURST ────────────────────────────────────────────────────────
  {
    id: 'creative-burst',
    name: '크리에이티브 버스트',
    category: '마케팅',
    tags: ['creative', 'colorful', '활기', '에너지'],
    zones: [
      { id: 'TITLE', x: 100, y: 240, w: 700, h: 200, fontSize: 60, color: '#fff', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 100, y: 465, w: 680, h: 60, fontSize: 22, color: 'rgba(255,255,255,0.8)', role: 'summary' },
      { id: 'BULLET_0', x: 100, y: 560, w: 200, h: 80, fontSize: 17, color: '#fff', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_1', x: 320, y: 560, w: 200, h: 80, fontSize: 17, color: '#fff', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_2', x: 540, y: 560, w: 200, h: 80, fontSize: 17, color: '#fff', textAlign: 'center', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#09090b;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;right:-100px;top:-100px;width:700px;height:700px;background:conic-gradient(from 0deg,#f97316,#ec4899,#8b5cf6,#06b6d4,#f97316);border-radius:50%;opacity:0.7;filter:blur(60px);"></div>
  <div style="position:absolute;left:0;top:0;right:0;bottom:0;background:linear-gradient(135deg,#09090b 40%,transparent);"></div>
  ${[0,1,2].map(i => `<div style="position:absolute;top:535px;left:${100+i*220}px;width:200px;height:100px;background:rgba(255,255,255,0.08);border-radius:16px;border:1px solid rgba(255,255,255,0.15);"></div>`).join('')}
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#09090b;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;right:-100px;top:-100px;width:700px;height:700px;background:conic-gradient(from 0deg,#f97316,#ec4899,#8b5cf6,#06b6d4,#f97316);border-radius:50%;opacity:0.7;filter:blur(60px);"></div>
  <div style="position:absolute;left:0;top:0;right:0;bottom:0;background:linear-gradient(135deg,#09090b 40%,transparent);"></div>
  <div style="position:absolute;top:230px;left:100px;font-size:62px;font-weight:900;color:#fff;line-height:1.1;max-width:700px;">크리에이티브<br>마케팅 전략</div>
  <div style="position:absolute;top:455px;left:100px;font-size:22px;color:rgba(255,255,255,0.8);">경계를 넘는 혁신적인 아이디어</div>
  ${[{t:'콘텐츠'},{t:'커뮤니티'},{t:'컨버전'}].map(({t},i) => `<div style="position:absolute;top:535px;left:${100+i*220}px;width:200px;height:100px;background:rgba(255,255,255,0.08);border-radius:16px;border:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;font-weight:600;">${t}</div>`).join('')}
</div>`,
  },

  // 14. ACADEMIC ──────────────────────────────────────────────────────────────
  {
    id: 'academic',
    name: '학술 발표',
    category: '교육',
    tags: ['academic', '학술', '논문', '연구'],
    zones: [
      { id: 'LABEL', x: 60, y: 100, w: 400, h: 36, fontSize: 14, color: '#1d4ed8', role: 'label' },
      { id: 'TITLE', x: 60, y: 148, w: 1160, h: 180, fontSize: 50, color: '#0f172a', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 60, y: 346, w: 760, h: 50, fontSize: 19, color: '#475569', role: 'summary' },
      { id: 'BULLET_0', x: 60, y: 436, w: 580, h: 48, fontSize: 18, color: '#334155', role: 'bullet' },
      { id: 'BULLET_1', x: 60, y: 494, w: 580, h: 48, fontSize: 18, color: '#334155', role: 'bullet' },
      { id: 'BULLET_2', x: 60, y: 552, w: 580, h: 48, fontSize: 18, color: '#334155', role: 'bullet' },
      { id: 'STAT', x: 780, y: 400, w: 460, h: 180, fontSize: 72, color: '#1d4ed8', fontWeight: 'bold', textAlign: 'center', role: 'stat' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#fff;position:relative;overflow:hidden;font-family:'Times New Roman',Georgia,serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:84px;background:#fff;border-bottom:3px double #1d4ed8;"></div>
  <div style="position:absolute;top:330px;left:60px;right:60px;height:1px;background:#cbd5e1;"></div>
  <div style="position:absolute;top:330px;left:720px;width:1px;height:360px;background:#cbd5e1;"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:50px;background:#1e3a8a;"></div>
  <div style="position:absolute;bottom:50px;left:0;right:0;height:3px;background:#3b82f6;"></div>
  <div style="position:absolute;top:380px;right:60px;width:420px;height:180px;border:1px solid #e2e8f0;border-radius:8px;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#fff;position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:84px;background:#fff;border-bottom:3px double #1d4ed8;display:flex;align-items:center;padding:0 60px;"><span style="font-size:15px;color:#475569;font-style:italic;">Journal of AI Research | Vol. 12, 2024</span><span style="margin-left:auto;font-size:14px;color:#1d4ed8;">DOI: 10.1234/jar.2024</span></div>
  <div style="position:absolute;top:100px;left:60px;font-size:14px;color:#1d4ed8;letter-spacing:1px;font-weight:700;text-transform:uppercase;">Research Presentation</div>
  <div style="position:absolute;top:145px;left:60px;font-size:50px;font-weight:700;color:#0f172a;line-height:1.15;max-width:1100px;">대규모 언어 모델의 교육적 활용 가능성에 관한 연구</div>
  <div style="position:absolute;top:335px;left:60px;right:60px;height:1px;background:#cbd5e1;"></div>
  <div style="position:absolute;top:345px;left:60px;font-size:19px;color:#475569;">연구팀: 김연구, 박박사, 이교수 | 기관명 대학교</div>
  ${['연구 목적 및 배경 설명','방법론 및 데이터셋 구성','주요 발견 사항 및 결과'].map((t,i) => `<div style="position:absolute;top:${435+i*60}px;left:60px;display:flex;gap:12px;align-items:center;"><span style="font-size:14px;color:#1d4ed8;font-weight:700;">[${i+1}]</span><span style="font-size:18px;color:#334155;">${t}</span></div>`).join('')}
  <div style="position:absolute;top:335px;left:720px;width:1px;height:340px;background:#cbd5e1;"></div>
  <div style="position:absolute;top:380px;right:60px;width:420px;height:230px;border:1px solid #e2e8f0;border-radius:8px;padding:24px;box-sizing:border-box;"><div style="font-size:12px;color:#1d4ed8;font-weight:700;margin-bottom:10px;">KEY FINDING</div><div style="font-size:72px;font-weight:900;color:#1d4ed8;line-height:1;">94.7%</div><div style="font-size:16px;color:#64748b;margin-top:8px;">학습 효율성 향상</div></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:50px;background:#1e3a8a;display:flex;align-items:center;padding:0 60px;"><span style="color:rgba(255,255,255,0.7);font-size:14px;">© 2024 AI Research Institute</span></div>
</div>`,
  },

  // 15. PITCH DARK ────────────────────────────────────────────────────────────
  {
    id: 'pitch-dark',
    name: '피치 다크',
    category: '스타트업',
    tags: ['pitch', 'dark', '투자', '스타트업'],
    zones: [
      { id: 'TITLE', x: 80, y: 140, w: 700, h: 200, fontSize: 56, color: '#ffffff', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 80, y: 365, w: 700, h: 60, fontSize: 22, color: '#94a3b8', role: 'summary' },
      { id: 'STAT', x: 80, y: 470, w: 200, h: 120, fontSize: 64, color: '#a78bfa', fontWeight: 'bold', role: 'stat' },
      { id: 'STAT_DESC', x: 300, y: 490, w: 400, h: 50, fontSize: 18, color: '#64748b', role: 'stat_desc' },
      { id: 'BULLET_0', x: 80, y: 620, w: 650, h: 44, fontSize: 18, color: '#94a3b8', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#020617;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:700px;bottom:0;right:0;background:linear-gradient(135deg,#1e1b4b,#0f0a2e);"></div>
  <div style="position:absolute;top:0;left:700px;width:2px;height:720px;background:linear-gradient(180deg,transparent,#7c3aed,transparent);"></div>
  <div style="position:absolute;top:100px;left:780px;right:40px;bottom:100px;border:1px solid rgba(124,58,237,0.2);border-radius:20px;"></div>
  <div style="position:absolute;top:450px;left:80px;width:540px;height:1px;background:rgba(148,163,184,0.15);"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#020617;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:700px;bottom:0;right:0;background:linear-gradient(135deg,#1e1b4b,#0f0a2e);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:40px;"><div style="font-size:14px;color:#7c3aed;letter-spacing:3px;text-transform:uppercase;">SERIES A</div><div style="font-size:36px;font-weight:900;color:#fff;text-align:center;">₩20억<br><span style="font-size:18px;color:#94a3b8;font-weight:400;">목표 투자 유치</span></div><div style="width:80px;height:2px;background:linear-gradient(90deg,#7c3aed,#a78bfa);"></div><div style="font-size:16px;color:#64748b;text-align:center;">2024년 Q2 클로징 예정</div></div>
  <div style="position:absolute;top:0;left:700px;width:2px;height:720px;background:linear-gradient(180deg,transparent,#7c3aed,transparent);"></div>
  <div style="position:absolute;top:130px;left:80px;font-size:56px;font-weight:900;color:#fff;line-height:1.1;max-width:580px;">B2B SaaS<br>플랫폼 구축</div>
  <div style="position:absolute;top:360px;left:80px;font-size:22px;color:#94a3b8;max-width:600px;">엔터프라이즈 고객의 업무 생산성을 10배 향상</div>
  <div style="position:absolute;top:450px;left:80px;width:540px;height:1px;background:rgba(148,163,184,0.15);"></div>
  <div style="position:absolute;top:470px;left:80px;font-size:64px;font-weight:900;color:#a78bfa;line-height:1;">3.2x</div>
  <div style="position:absolute;top:500px;left:300px;font-size:18px;color:#64748b;">MoM 성장률</div>
  <div style="position:absolute;top:620px;left:80px;font-size:18px;color:#94a3b8;">현재 ARR: ₩4.8억 · 고객사 47개 · 팀 22명</div>
</div>`,
  },

  // 16. WELLNESS SAGE ─────────────────────────────────────────────────────────
  {
    id: 'wellness-sage',
    name: '웰니스 세이지',
    category: '헬스케어',
    tags: ['wellness', 'health', 'organic', '웰빙'],
    zones: [
      { id: 'LABEL', x: 80, y: 110, w: 300, h: 34, fontSize: 14, color: '#4d7c63', fontWeight: 'bold', role: 'label' },
      { id: 'TITLE', x: 80, y: 155, w: 760, h: 180, fontSize: 50, color: '#1f2e28', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 80, y: 355, w: 680, h: 60, fontSize: 20, color: '#526b5e', role: 'summary' },
      { id: 'BULLET_0', x: 80, y: 450, w: 620, h: 40, fontSize: 18, color: '#3f5347', role: 'bullet' },
      { id: 'BULLET_1', x: 80, y: 500, w: 620, h: 40, fontSize: 18, color: '#3f5347', role: 'bullet' },
      { id: 'BULLET_2', x: 80, y: 550, w: 620, h: 40, fontSize: 18, color: '#3f5347', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:linear-gradient(160deg,#eef5f0,#dcebe1);position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;right:-140px;top:-140px;width:520px;height:480px;background:#c7ddc9;border-radius:42% 58% 65% 35%/45% 40% 60% 55%;opacity:0.7;"></div>
  <div style="position:absolute;left:-100px;bottom:-160px;width:420px;height:420px;background:#b7d4bb;border-radius:60% 40% 30% 70%/50% 60% 40% 50%;opacity:0.5;"></div>
  <div style="position:absolute;left:80px;top:140px;width:48px;height:4px;background:#4d7c63;border-radius:2px;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:linear-gradient(160deg,#eef5f0,#dcebe1);position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;right:-140px;top:-140px;width:520px;height:480px;background:#c7ddc9;border-radius:42% 58% 65% 35%/45% 40% 60% 55%;opacity:0.7;"></div>
  <div style="position:absolute;left:-100px;bottom:-160px;width:420px;height:420px;background:#b7d4bb;border-radius:60% 40% 30% 70%/50% 60% 40% 50%;opacity:0.5;"></div>
  <div style="position:absolute;left:80px;top:140px;width:48px;height:4px;background:#4d7c63;border-radius:2px;"></div>
  <div style="position:absolute;left:80px;top:110px;font-size:14px;font-weight:700;color:#4d7c63;letter-spacing:2px;text-transform:uppercase;">WELLNESS</div>
  <div style="position:absolute;left:80px;top:160px;font-size:50px;font-weight:800;color:#1f2e28;line-height:1.15;max-width:700px;">마음과 몸의<br>균형 찾기</div>
  <div style="position:absolute;left:80px;top:360px;font-size:20px;color:#526b5e;">일상 속 웰빙을 위한 작은 습관들</div>
  <div style="position:absolute;left:80px;top:450px;display:flex;flex-direction:column;gap:16px;">
    ${['🧘 매일 10분 명상하기', '🥗 균형 잡힌 식단 관리', '🚶 가벼운 야외 활동 즐기기'].map(t => `<div style="color:#3f5347;font-size:18px;">${t}</div>`).join('')}
  </div>
</div>`,
  },

  // 17. TRAVEL POSTCARD ───────────────────────────────────────────────────────
  {
    id: 'travel-postcard',
    name: '트래블 포스트카드',
    category: '여행',
    tags: ['travel', 'postcard', '여행', '감성'],
    zones: [
      { id: 'LABEL', x: 120, y: 130, w: 400, h: 30, fontSize: 14, color: '#c2410c', fontWeight: 'bold', role: 'label' },
      { id: 'TITLE', x: 120, y: 170, w: 900, h: 160, fontSize: 62, color: '#1c1917', fontWeight: 'bold', fontFamily: 'Georgia, serif', role: 'title' },
      { id: 'SUMMARY', x: 120, y: 350, w: 800, h: 50, fontSize: 21, color: '#78716c', fontFamily: 'Georgia, serif', role: 'summary' },
      { id: 'BULLET_0', x: 120, y: 460, w: 280, h: 100, fontSize: 17, color: '#44403c', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_1', x: 440, y: 460, w: 280, h: 100, fontSize: 17, color: '#44403c', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_2', x: 760, y: 460, w: 280, h: 100, fontSize: 17, color: '#44403c', textAlign: 'center', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#fdf8f0;position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;top:40px;left:40px;right:40px;bottom:40px;border:2px dashed #d6c8ae;border-radius:4px;"></div>
  <div style="position:absolute;top:64px;right:64px;width:90px;height:110px;border:2px solid #c2410c;transform:rotate(6deg);display:flex;align-items:center;justify-content:center;"></div>
  ${[120,440,760].map(x => `<div style="position:absolute;top:450px;left:${x}px;width:280px;height:120px;background:#fff;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,0.06);"></div>`).join('')}
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#fdf8f0;position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;top:40px;left:40px;right:40px;bottom:40px;border:2px dashed #d6c8ae;border-radius:4px;"></div>
  <div style="position:absolute;top:64px;right:64px;width:90px;height:110px;border:2px solid #c2410c;transform:rotate(6deg);display:flex;align-items:center;justify-content:center;font-size:28px;">✈️</div>
  <div style="position:absolute;left:120px;top:135px;font-size:14px;font-weight:700;color:#c2410c;letter-spacing:3px;text-transform:uppercase;">TRAVEL DIARY</div>
  <div style="position:absolute;left:120px;top:175px;font-size:62px;font-weight:700;color:#1c1917;line-height:1.1;">산토리니로<br>떠나는 여행</div>
  <div style="position:absolute;left:120px;top:355px;font-size:21px;color:#78716c;font-style:italic;">파란 지붕과 하얀 벽이 만드는 에게해의 낭만</div>
  ${[{x:120,i:'🏖️',t:'해변 산책'},{x:440,i:'🍷',t:'로컬 와이너리'},{x:760,i:'🌅',t:'선셋 뷰포인트'}].map(({x,i,t}) => `<div style="position:absolute;top:450px;left:${x}px;width:280px;height:120px;background:#fff;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;"><div style="font-size:30px;">${i}</div><div style="font-size:17px;color:#44403c;font-weight:600;">${t}</div></div>`).join('')}
</div>`,
  },

  // 18. FOOD MENU ─────────────────────────────────────────────────────────────
  {
    id: 'food-menu',
    name: '푸드 메뉴',
    category: '푸드',
    tags: ['food', 'restaurant', '메뉴', '다이닝'],
    zones: [
      { id: 'LABEL', x: 0, y: 110, w: 1280, h: 30, fontSize: 14, color: '#c9a227', textAlign: 'center', role: 'label' },
      { id: 'TITLE', x: 140, y: 150, w: 1000, h: 120, fontSize: 54, color: '#f5ede0', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Georgia, serif', role: 'title' },
      { id: 'SUMMARY', x: 240, y: 280, w: 800, h: 50, fontSize: 19, color: '#c9a227', textAlign: 'center', fontFamily: 'Georgia, serif', role: 'summary' },
      { id: 'BULLET_0', x: 300, y: 380, w: 680, h: 44, fontSize: 19, color: '#f5ede0', role: 'bullet' },
      { id: 'BULLET_1', x: 300, y: 434, w: 680, h: 44, fontSize: 19, color: '#f5ede0', role: 'bullet' },
      { id: 'BULLET_2', x: 300, y: 488, w: 680, h: 44, fontSize: 19, color: '#f5ede0', role: 'bullet' },
      { id: 'BULLET_3', x: 300, y: 542, w: 680, h: 44, fontSize: 19, color: '#f5ede0', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#1c1512;position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;top:80px;left:140px;right:140px;height:1px;background:#c9a227;"></div>
  <div style="position:absolute;top:640px;left:140px;right:140px;height:1px;background:#c9a227;"></div>
  <div style="position:absolute;top:60px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:#c9a227;border-radius:50%;"></div>
  <div style="position:absolute;bottom:40px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:#c9a227;border-radius:50%;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#1c1512;position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;top:80px;left:140px;right:140px;height:1px;background:#c9a227;"></div>
  <div style="position:absolute;top:640px;left:140px;right:140px;height:1px;background:#c9a227;"></div>
  <div style="position:absolute;top:115px;left:0;right:0;text-align:center;font-size:14px;color:#c9a227;letter-spacing:4px;text-transform:uppercase;">FINE DINING</div>
  <div style="position:absolute;top:155px;left:0;right:0;text-align:center;font-size:54px;font-weight:700;color:#f5ede0;">이달의 셰프 특선</div>
  <div style="position:absolute;top:285px;left:0;right:0;text-align:center;font-size:19px;color:#c9a227;font-style:italic;">제철 재료로 완성한 코스 요리</div>
  <div style="position:absolute;top:380px;left:300px;width:680px;display:flex;flex-direction:column;gap:10px;">
    ${['트러플 리조또 · ₩32,000', '안심 스테이크 · ₩58,000', '제철 해산물 파스타 · ₩38,000', '초콜릿 퐁당 · ₩16,000'].map(t => `<div style="display:flex;justify-content:space-between;color:#f5ede0;font-size:19px;border-bottom:1px dotted rgba(201,162,39,0.3);padding-bottom:8px;"><span>${t.split(' · ')[0]}</span><span style="color:#c9a227;">${t.split(' · ')[1]}</span></div>`).join('')}
  </div>
</div>`,
  },

  // 19. WEDDING ELEGANT ───────────────────────────────────────────────────────
  {
    id: 'wedding-elegant',
    name: '웨딩 엘레강스',
    category: '웨딩',
    tags: ['wedding', 'event', '웨딩', '초대장'],
    zones: [
      { id: 'LABEL', x: 0, y: 200, w: 1280, h: 30, fontSize: 15, color: '#a8829a', textAlign: 'center', role: 'label' },
      { id: 'TITLE', x: 190, y: 250, w: 900, h: 140, fontSize: 56, color: '#4a3b45', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Georgia, serif', role: 'title' },
      { id: 'SUMMARY', x: 240, y: 400, w: 800, h: 50, fontSize: 20, color: '#8a7480', textAlign: 'center', fontFamily: 'Georgia, serif', role: 'summary' },
      { id: 'BULLET_0', x: 340, y: 490, w: 600, h: 36, fontSize: 17, color: '#6b5862', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_1', x: 340, y: 526, w: 600, h: 36, fontSize: 17, color: '#6b5862', textAlign: 'center', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:linear-gradient(180deg,#fdf2f6,#faf7f2);position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;top:60px;left:60px;right:60px;bottom:60px;border:1px solid #e3b8cd;"></div>
  <div style="position:absolute;top:74px;left:74px;right:74px;bottom:74px;border:1px solid #e3b8cd;"></div>
  <div style="position:absolute;top:190px;left:50%;transform:translateX(-50%);width:60px;height:1px;background:#c98fac;"></div>
  <div style="position:absolute;top:186px;left:50%;transform:translateX(-50%) rotate(45deg);width:8px;height:8px;background:#c98fac;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:linear-gradient(180deg,#fdf2f6,#faf7f2);position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;top:60px;left:60px;right:60px;bottom:60px;border:1px solid #e3b8cd;"></div>
  <div style="position:absolute;top:74px;left:74px;right:74px;bottom:74px;border:1px solid #e3b8cd;"></div>
  <div style="position:absolute;top:190px;left:50%;transform:translateX(-50%);width:60px;height:1px;background:#c98fac;"></div>
  <div style="position:absolute;top:210px;left:0;right:0;text-align:center;font-size:15px;color:#a8829a;letter-spacing:5px;text-transform:uppercase;">SAVE THE DATE</div>
  <div style="position:absolute;top:255px;left:0;right:0;text-align:center;font-size:56px;font-weight:700;color:#4a3b45;">지훈 & 서연</div>
  <div style="position:absolute;top:405px;left:0;right:0;text-align:center;font-size:20px;color:#8a7480;font-style:italic;">2024년 10월 12일, 그랜드볼룸에서</div>
  <div style="position:absolute;top:490px;left:0;right:0;text-align:center;font-size:17px;color:#6b5862;">오후 2시 예식 · 오후 3시 피로연</div>
  <div style="position:absolute;top:526px;left:0;right:0;text-align:center;font-size:17px;color:#6b5862;">참석 여부는 10월 1일까지 알려주세요</div>
</div>`,
  },

  // 20. REAL ESTATE LUXURY ────────────────────────────────────────────────────
  {
    id: 'real-estate-luxury',
    name: '리얼에스테이트 럭셔리',
    category: '부동산',
    tags: ['realestate', 'luxury', '부동산', '매물'],
    zones: [
      { id: 'LABEL', x: 70, y: 110, w: 300, h: 30, fontSize: 14, color: '#c9a961', fontWeight: 'bold', role: 'label' },
      { id: 'TITLE', x: 70, y: 150, w: 560, h: 160, fontSize: 44, color: '#ffffff', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 70, y: 330, w: 520, h: 60, fontSize: 18, color: '#b8b2a5', role: 'summary' },
      { id: 'STAT', x: 70, y: 440, w: 300, h: 100, fontSize: 52, color: '#c9a961', fontWeight: 'bold', role: 'stat' },
      { id: 'STAT_DESC', x: 70, y: 545, w: 400, h: 40, fontSize: 16, color: '#918c80', role: 'stat_desc' },
      { id: 'BULLET_0', x: 70, y: 600, w: 560, h: 34, fontSize: 16, color: '#b8b2a5', role: 'bullet' },
      { id: 'IMAGE', x: 840, y: 80, w: 360, h: 280, fontSize: 0, color: 'transparent', rx: 4, role: 'image' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#151310;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;right:0;bottom:0;width:520px;background:linear-gradient(160deg,#2b2620,#151310);"></div>
  <div style="position:absolute;top:0;right:520px;width:2px;height:720px;background:#c9a961;"></div>
  <div style="position:absolute;right:80px;top:80px;width:360px;height:280px;border:1px solid rgba(201,169,97,0.35);"></div>
  <div style="position:absolute;right:110px;top:400px;width:300px;height:220px;border:1px solid rgba(201,169,97,0.2);"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#151310;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;right:0;bottom:0;width:520px;background:linear-gradient(160deg,#2b2620,#151310);display:flex;align-items:center;justify-content:center;"><div style="font-size:70px;">🏛️</div></div>
  <div style="position:absolute;top:0;right:520px;width:2px;height:720px;background:#c9a961;"></div>
  <div style="position:absolute;left:70px;top:115px;font-size:14px;font-weight:700;color:#c9a961;letter-spacing:3px;">PREMIUM LISTING</div>
  <div style="position:absolute;left:70px;top:155px;font-size:44px;font-weight:800;color:#fff;line-height:1.2;max-width:560px;">한강뷰 펜트하우스</div>
  <div style="position:absolute;left:70px;top:335px;font-size:18px;color:#b8b2a5;max-width:520px;">서울 성동구 · 245㎡ · 4베드룸 4배스룸</div>
  <div style="position:absolute;left:70px;top:440px;font-size:52px;font-weight:900;color:#c9a961;">₩38.5억</div>
  <div style="position:absolute;left:70px;top:548px;font-size:16px;color:#918c80;">전용면적 기준 · 즉시 입주 가능</div>
  <div style="position:absolute;left:70px;top:600px;font-size:16px;color:#b8b2a5;">전담 에이전트: 김민준 · 010-1234-5678</div>
</div>`,
  },

  // 21. FINANCE GROWTH ────────────────────────────────────────────────────────
  {
    id: 'finance-growth',
    name: '파이낸스 그로스',
    category: '금융',
    tags: ['finance', 'growth', '금융', '투자'],
    zones: [
      { id: 'TITLE', x: 60, y: 90, w: 900, h: 90, fontSize: 40, color: '#0f2e1f', fontWeight: 'bold', role: 'title' },
      { id: 'STAT', x: 60, y: 210, w: 400, h: 140, fontSize: 76, color: '#0d9256', fontWeight: 'bold', role: 'stat' },
      { id: 'STAT_DESC', x: 60, y: 360, w: 400, h: 40, fontSize: 18, color: '#4b5f56', role: 'stat_desc' },
      { id: 'BULLET_0', x: 60, y: 440, w: 460, h: 44, fontSize: 18, color: '#334a3f', role: 'bullet' },
      { id: 'BULLET_1', x: 60, y: 490, w: 460, h: 44, fontSize: 18, color: '#334a3f', role: 'bullet' },
      { id: 'BULLET_2', x: 60, y: 540, w: 460, h: 44, fontSize: 18, color: '#334a3f', role: 'bullet' },
      { id: 'SUMMARY', x: 640, y: 210, w: 580, h: 350, fontSize: 17, color: '#4b5f56', role: 'summary' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#f4f9f6;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#0d9256,#22c55e);"></div>
  <div style="position:absolute;bottom:0;left:600px;right:0;top:0;background:#fff;border-left:1px solid #dbe7e0;"></div>
  ${[0,1,2,3,4].map(i => `<div style="position:absolute;bottom:120px;left:${680+i*100}px;width:56px;height:${40+i*36}px;background:#0d9256;opacity:${0.35+i*0.13};border-radius:4px 4px 0 0;"></div>`).join('')}
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#f4f9f6;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#0d9256,#22c55e);"></div>
  <div style="position:absolute;bottom:0;left:600px;right:0;top:0;background:#fff;border-left:1px solid #dbe7e0;"></div>
  <div style="position:absolute;left:60px;top:95px;font-size:40px;font-weight:800;color:#0f2e1f;">2024 투자 실적 리포트</div>
  <div style="position:absolute;left:60px;top:215px;font-size:76px;font-weight:900;color:#0d9256;">+52.3%</div>
  <div style="position:absolute;left:60px;top:365px;font-size:18px;color:#4b5f56;">연간 포트폴리오 수익률</div>
  ${['자산 배분 다각화 전략', '리스크 관리 체계 강화', '장기 성장주 중심 편입'].map((t,i) => `<div style="position:absolute;top:${440+i*50}px;left:60px;display:flex;align-items:center;gap:10px;"><div style="width:6px;height:6px;background:#0d9256;border-radius:50%;"></div><span style="font-size:18px;color:#334a3f;">${t}</span></div>`).join('')}
  ${[0,1,2,3,4].map(i => `<div style="position:absolute;bottom:120px;left:${680+i*100}px;width:56px;height:${40+i*36}px;background:#0d9256;opacity:${0.35+i*0.13};border-radius:4px 4px 0 0;"></div>`).join('')}
  <div style="position:absolute;bottom:90px;left:680px;right:60px;height:1px;background:#dbe7e0;"></div>
</div>`,
  },

  // 22. FASHION EDITORIAL B&W ─────────────────────────────────────────────────
  {
    id: 'fashion-editorial-bw',
    name: '패션 에디토리얼',
    category: '패션',
    tags: ['fashion', 'editorial', '패션', '흑백'],
    zones: [
      { id: 'LABEL', x: 80, y: 90, w: 400, h: 30, fontSize: 13, color: '#000000', fontWeight: 'bold', role: 'label' },
      { id: 'TITLE', x: 80, y: 220, w: 1120, h: 260, fontSize: 96, color: '#000000', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 80, y: 520, w: 600, h: 50, fontSize: 19, color: '#404040', role: 'summary' },
      { id: 'BULLET_0', x: 900, y: 520, w: 300, h: 34, fontSize: 15, color: '#000000', textAlign: 'right', role: 'bullet' },
      { id: 'BULLET_1', x: 900, y: 554, w: 300, h: 34, fontSize: 15, color: '#000000', textAlign: 'right', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#ffffff;position:relative;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="position:absolute;top:0;left:640px;width:1px;height:720px;background:#000;"></div>
  <div style="position:absolute;top:60px;left:80px;right:80px;height:1px;background:#000;"></div>
  <div style="position:absolute;bottom:60px;left:80px;right:80px;height:1px;background:#000;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#ffffff;position:relative;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="position:absolute;top:0;left:640px;width:1px;height:720px;background:#000;"></div>
  <div style="position:absolute;top:60px;left:80px;right:80px;height:1px;background:#000;"></div>
  <div style="position:absolute;bottom:60px;left:80px;right:80px;height:1px;background:#000;"></div>
  <div style="position:absolute;left:80px;top:95px;font-size:13px;font-weight:700;color:#000;letter-spacing:4px;">ISSUE NO. 24 — F/W COLLECTION</div>
  <div style="position:absolute;left:80px;top:225px;font-size:96px;font-weight:900;color:#000;line-height:0.95;letter-spacing:-2px;">MINIMAL<br>FORM</div>
  <div style="position:absolute;left:80px;top:525px;font-size:19px;color:#404040;max-width:600px;">군더더기를 덜어낸, 본질에 집중한 실루엣</div>
  <div style="position:absolute;right:80px;top:520px;text-align:right;font-size:15px;color:#000;">MILAN · PARIS<br>2024 F/W</div>
</div>`,
  },

  // 23. GAMING ARCADE ─────────────────────────────────────────────────────────
  {
    id: 'gaming-arcade',
    name: '게이밍 아케이드',
    category: '게임',
    tags: ['gaming', 'esports', '게임', '네온'],
    zones: [
      { id: 'TITLE', x: 80, y: 190, w: 1100, h: 160, fontSize: 62, color: '#ffffff', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 80, y: 370, w: 820, h: 50, fontSize: 21, color: '#7cf5c4', role: 'summary' },
      { id: 'STAT', x: 80, y: 460, w: 260, h: 110, fontSize: 62, color: '#ff2ea6', fontWeight: 'bold', role: 'stat' },
      { id: 'BULLET_0', x: 400, y: 470, w: 400, h: 44, fontSize: 19, color: '#c9fbe5', role: 'bullet' },
      { id: 'BULLET_1', x: 400, y: 520, w: 400, h: 44, fontSize: 19, color: '#c9fbe5', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#0a0a12;position:relative;overflow:hidden;font-family:'Courier New',monospace;">
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,46,166,0.03) 30px,rgba(255,46,166,0.03) 31px);"></div>
  <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#ff2ea6,#7c3aed,#22d3ee);"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#22d3ee,#7c3aed,#ff2ea6);"></div>
  <div style="position:absolute;left:80px;top:160px;width:50px;height:4px;background:#7cf5c4;box-shadow:0 0 10px #7cf5c4;"></div>
  <div style="position:absolute;right:100px;top:150px;width:160px;height:160px;border:2px solid rgba(255,46,166,0.3);transform:rotate(15deg);"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#0a0a12;position:relative;overflow:hidden;font-family:'Courier New',monospace;">
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,46,166,0.03) 30px,rgba(255,46,166,0.03) 31px);"></div>
  <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#ff2ea6,#7c3aed,#22d3ee);"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#22d3ee,#7c3aed,#ff2ea6);"></div>
  <div style="position:absolute;left:80px;top:160px;width:50px;height:4px;background:#7cf5c4;box-shadow:0 0 10px #7cf5c4;"></div>
  <div style="position:absolute;left:80px;top:195px;font-size:62px;font-weight:900;color:#fff;text-shadow:0 0 20px rgba(255,46,166,0.4);">시즌 3 챔피언십</div>
  <div style="position:absolute;left:80px;top:375px;font-size:21px;color:#7cf5c4;">전 세계 128개 팀이 겨루는 결승 무대</div>
  <div style="position:absolute;left:80px;top:465px;font-size:62px;font-weight:900;color:#ff2ea6;text-shadow:0 0 20px rgba(255,46,166,0.5);">$1M</div>
  <div style="position:absolute;left:400px;top:480px;font-size:19px;color:#c9fbe5;">▸ 상금 규모 역대 최대</div>
  <div style="position:absolute;left:400px;top:524px;font-size:19px;color:#c9fbe5;">▸ 12월 20일 결승전 생중계</div>
</div>`,
  },

  // 24. NONPROFIT IMPACT ──────────────────────────────────────────────────────
  {
    id: 'nonprofit-impact',
    name: '논프로핏 임팩트',
    category: '소셜임팩트',
    tags: ['nonprofit', 'impact', '사회공헌', '기부'],
    zones: [
      { id: 'LABEL', x: 80, y: 110, w: 300, h: 30, fontSize: 14, color: '#b45309', fontWeight: 'bold', role: 'label' },
      { id: 'TITLE', x: 80, y: 150, w: 680, h: 160, fontSize: 46, color: '#1c1917', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 80, y: 330, w: 620, h: 60, fontSize: 19, color: '#78716c', role: 'summary' },
      { id: 'STAT', x: 860, y: 160, w: 340, h: 130, fontSize: 64, color: '#b45309', fontWeight: 'bold', textAlign: 'center', role: 'stat' },
      { id: 'STAT_DESC', x: 860, y: 300, w: 340, h: 40, fontSize: 16, color: '#78716c', textAlign: 'center', role: 'stat_desc' },
      { id: 'BULLET_0', x: 80, y: 440, w: 300, h: 100, fontSize: 17, color: '#57534e', role: 'bullet' },
      { id: 'BULLET_1', x: 400, y: 440, w: 300, h: 100, fontSize: 17, color: '#57534e', role: 'bullet' },
      { id: 'BULLET_2', x: 720, y: 440, w: 300, h: 100, fontSize: 17, color: '#57534e', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#fdf6ec;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;right:-80px;top:-80px;width:340px;height:340px;border:32px solid #f3dfc1;border-radius:50%;"></div>
  <div style="position:absolute;top:80px;left:80px;width:44px;height:4px;background:#b45309;border-radius:2px;"></div>
  <div style="position:absolute;top:410px;left:80px;right:80px;height:1px;background:#e7dac3;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#fdf6ec;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;right:-80px;top:-80px;width:340px;height:340px;border:32px solid #f3dfc1;border-radius:50%;"></div>
  <div style="position:absolute;left:80px;top:115px;font-size:14px;font-weight:700;color:#b45309;letter-spacing:2px;">2024 IMPACT REPORT</div>
  <div style="position:absolute;left:80px;top:155px;font-size:46px;font-weight:800;color:#1c1917;line-height:1.2;max-width:680px;">함께 만든 변화의 기록</div>
  <div style="position:absolute;left:80px;top:335px;font-size:19px;color:#78716c;max-width:620px;">작은 나눔이 모여 이룬 올해의 성과입니다</div>
  <div style="position:absolute;left:860px;top:170px;width:340px;text-align:center;"><div style="font-size:64px;font-weight:900;color:#b45309;">12,480</div><div style="font-size:16px;color:#78716c;margin-top:6px;">명의 아이들에게 전달된 교육 지원</div></div>
  <div style="position:absolute;top:410px;left:80px;right:80px;height:1px;background:#e7dac3;"></div>
  ${[{t:'🎒 학용품 지원'},{t:'🏫 지역아동센터 운영'},{t:'👩‍🏫 멘토링 프로그램'}].map(({t}) => `<div style="position:absolute;top:440px;font-size:17px;color:#57534e;font-weight:600;">${t}</div>`).join('')}
</div>`,
  },

  // 25. PORTFOLIO PHOTO ───────────────────────────────────────────────────────
  {
    id: 'portfolio-photo',
    name: '포트폴리오 포토',
    category: '포트폴리오',
    tags: ['portfolio', 'photo', '사진', '작업물'],
    zones: [
      { id: 'LABEL', x: 760, y: 120, w: 400, h: 30, fontSize: 13, color: '#a1a1aa', role: 'label' },
      { id: 'TITLE', x: 760, y: 160, w: 440, h: 160, fontSize: 40, color: '#fafafa', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 760, y: 340, w: 440, h: 100, fontSize: 17, color: '#a1a1aa', role: 'summary' },
      { id: 'BULLET_0', x: 760, y: 480, w: 440, h: 34, fontSize: 15, color: '#71717a', role: 'bullet' },
      { id: 'BULLET_1', x: 760, y: 514, w: 440, h: 34, fontSize: 15, color: '#71717a', role: 'bullet' },
      { id: 'IMAGE', x: 0, y: 0, w: 720, h: 720, fontSize: 0, color: 'transparent', rx: 0, role: 'image' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#18181b;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;width:720px;height:720px;background:linear-gradient(135deg,#3f3f46,#27272a);"></div>
  <div style="position:absolute;top:0;left:720px;width:2px;height:720px;background:#52525b;"></div>
  <div style="position:absolute;top:600px;left:40px;width:60px;height:60px;border:1px solid rgba(255,255,255,0.15);border-radius:50%;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#18181b;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;width:720px;height:720px;background:linear-gradient(135deg,#3f3f46,#27272a);display:flex;align-items:center;justify-content:center;"><div style="font-size:100px;opacity:0.3;">📷</div></div>
  <div style="position:absolute;top:0;left:720px;width:2px;height:720px;background:#52525b;"></div>
  <div style="position:absolute;left:760px;top:130px;font-size:13px;color:#a1a1aa;letter-spacing:3px;text-transform:uppercase;">SELECTED WORK</div>
  <div style="position:absolute;left:760px;top:165px;font-size:40px;font-weight:800;color:#fafafa;line-height:1.2;">도시의 빛과<br>그림자</div>
  <div style="position:absolute;left:760px;top:345px;font-size:17px;color:#a1a1aa;max-width:440px;line-height:1.5;">2024년 서울에서 촬영한 도시 사진 연작. 밤과 낮의 대비를 통해 도시의 이중적 얼굴을 담았습니다.</div>
  <div style="position:absolute;left:760px;top:485px;font-size:15px;color:#71717a;">촬영: 이도윤 · Fujifilm X-T5</div>
  <div style="position:absolute;left:760px;top:519px;font-size:15px;color:#71717a;">전시 기간: 2024.11 - 2025.01</div>
</div>`,
  },

  // 26. KANBAN PROCESS ────────────────────────────────────────────────────────
  {
    id: 'kanban-process',
    name: '칸반 프로세스',
    category: '비즈니스',
    tags: ['process', 'kanban', '프로세스', '워크플로우'],
    zones: [
      { id: 'TITLE', x: 60, y: 90, w: 1000, h: 90, fontSize: 42, color: '#1e293b', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 60, y: 190, w: 900, h: 50, fontSize: 19, color: '#64748b', role: 'summary' },
      { id: 'BULLET_0', x: 60, y: 400, w: 260, h: 140, fontSize: 17, color: '#334155', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_1', x: 360, y: 400, w: 260, h: 140, fontSize: 17, color: '#334155', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_2', x: 660, y: 400, w: 260, h: 140, fontSize: 17, color: '#334155', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_3', x: 960, y: 400, w: 260, h: 140, fontSize: 17, color: '#334155', textAlign: 'center', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#ffffff;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:#4f46e5;"></div>
  <div style="position:absolute;top:470px;left:190px;width:170px;height:2px;background:#c7d2fe;"></div>
  <div style="position:absolute;top:470px;left:490px;width:170px;height:2px;background:#c7d2fe;"></div>
  <div style="position:absolute;top:470px;left:790px;width:170px;height:2px;background:#c7d2fe;"></div>
  ${[60,360,660,960].map(x => `<div style="position:absolute;top:390px;left:${x}px;width:260px;height:170px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;border-top:4px solid #4f46e5;"></div><div style="position:absolute;top:405px;left:${x+18}px;width:36px;height:36px;background:#4f46e5;border-radius:50%;"></div>`).join('')}
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#ffffff;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:#4f46e5;"></div>
  <div style="position:absolute;left:60px;top:95px;font-size:42px;font-weight:800;color:#1e293b;">제품 개발 프로세스</div>
  <div style="position:absolute;left:60px;top:195px;font-size:19px;color:#64748b;">아이디어부터 출시까지 4단계 워크플로우</div>
  <div style="position:absolute;top:470px;left:190px;width:170px;height:2px;background:#c7d2fe;"></div>
  <div style="position:absolute;top:470px;left:490px;width:170px;height:2px;background:#c7d2fe;"></div>
  <div style="position:absolute;top:470px;left:790px;width:170px;height:2px;background:#c7d2fe;"></div>
  ${[{x:60,t:'기획'},{x:360,t:'디자인'},{x:660,t:'개발'},{x:960,t:'출시'}].map(({x,t},i) => `<div style="position:absolute;top:390px;left:${x}px;width:260px;height:170px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;border-top:4px solid #4f46e5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;"><div style="width:36px;height:36px;background:#4f46e5;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${i+1}</div><div style="font-size:17px;font-weight:700;color:#334155;">${t}</div></div>`).join('')}
</div>`,
  },

  // 27. TIMELINE HORIZONTAL ───────────────────────────────────────────────────
  {
    id: 'timeline-horizontal',
    name: '호라이즌 타임라인',
    category: '비즈니스',
    tags: ['timeline', '연혁', '로드맵'],
    zones: [
      { id: 'TITLE', x: 60, y: 80, w: 900, h: 90, fontSize: 40, color: '#0f172a', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 60, y: 175, w: 800, h: 40, fontSize: 18, color: '#64748b', role: 'summary' },
      { id: 'BULLET_0', x: 100, y: 420, w: 220, h: 120, fontSize: 16, color: '#334155', role: 'bullet' },
      { id: 'BULLET_1', x: 400, y: 420, w: 220, h: 120, fontSize: 16, color: '#334155', role: 'bullet' },
      { id: 'BULLET_2', x: 700, y: 420, w: 220, h: 120, fontSize: 16, color: '#334155', role: 'bullet' },
      { id: 'BULLET_3', x: 1000, y: 420, w: 220, h: 120, fontSize: 16, color: '#334155', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#f8fafc;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:#0ea5e9;"></div>
  <div style="position:absolute;top:390px;left:100px;right:100px;height:3px;background:#cbd5e1;border-radius:2px;"></div>
  ${[100,400,700,1000].map(x => `<div style="position:absolute;top:382px;left:${x+10}px;width:20px;height:20px;background:#fff;border:4px solid #0ea5e9;border-radius:50%;"></div>`).join('')}
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#f8fafc;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:#0ea5e9;"></div>
  <div style="position:absolute;left:60px;top:85px;font-size:40px;font-weight:800;color:#0f172a;">우리의 성장 여정</div>
  <div style="position:absolute;left:60px;top:180px;font-size:18px;color:#64748b;">2021년부터 이어온 주요 마일스톤</div>
  <div style="position:absolute;top:390px;left:100px;right:100px;height:3px;background:#cbd5e1;border-radius:2px;"></div>
  ${[{x:100,y:'2021',t:'서비스 출시'},{x:400,y:'2022',t:'시리즈 A 투자'},{x:700,y:'2023',t:'해외 진출'},{x:1000,y:'2024',t:'100만 사용자'}].map(({x,y,t}) => `<div style="position:absolute;top:382px;left:${x+10}px;width:20px;height:20px;background:#fff;border:4px solid #0ea5e9;border-radius:50%;"></div><div style="position:absolute;top:420px;left:${x}px;width:220px;"><div style="font-size:22px;font-weight:800;color:#0ea5e9;">${y}</div><div style="font-size:16px;color:#334155;margin-top:6px;">${t}</div></div>`).join('')}
</div>`,
  },

  // 28. COMPARISON VS ─────────────────────────────────────────────────────────
  {
    id: 'comparison-vs',
    name: '컴패리즌 VS',
    category: '비즈니스',
    tags: ['comparison', '비교', 'vs'],
    zones: [
      { id: 'TITLE', x: 0, y: 80, w: 1280, h: 60, fontSize: 34, color: '#0f172a', fontWeight: 'bold', textAlign: 'center', role: 'title' },
      { id: 'LABEL', x: 140, y: 190, w: 400, h: 40, fontSize: 24, color: '#2563eb', fontWeight: 'bold', role: 'label' },
      { id: 'BULLET_0', x: 140, y: 260, w: 420, h: 44, fontSize: 18, color: '#334155', role: 'bullet' },
      { id: 'BULLET_1', x: 140, y: 312, w: 420, h: 44, fontSize: 18, color: '#334155', role: 'bullet' },
      { id: 'BULLET_2', x: 140, y: 364, w: 420, h: 44, fontSize: 18, color: '#334155', role: 'bullet' },
      { id: 'SUMMARY', x: 720, y: 260, w: 420, h: 200, fontSize: 18, color: '#334155', role: 'summary' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#ffffff;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:#0f172a;"></div>
  <div style="position:absolute;top:170px;left:140px;right:140px;bottom:100px;background:#f8fafc;border-radius:16px;"></div>
  <div style="position:absolute;top:170px;left:640px;width:1px;bottom:100px;background:#e2e8f0;"></div>
  <div style="position:absolute;top:50%;left:640px;transform:translate(-50%,-50%);width:64px;height:64px;background:#0f172a;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.2);"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#ffffff;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:#0f172a;"></div>
  <div style="position:absolute;top:170px;left:140px;right:140px;bottom:100px;background:#f8fafc;border-radius:16px;"></div>
  <div style="position:absolute;top:170px;left:640px;width:1px;bottom:100px;background:#e2e8f0;"></div>
  <div style="position:absolute;top:50%;left:640px;transform:translate(-50%,-50%);width:64px;height:64px;background:#0f172a;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.2);color:#fff;font-weight:900;font-size:20px;">VS</div>
  <div style="position:absolute;top:90px;left:0;right:0;text-align:center;font-size:34px;font-weight:800;color:#0f172a;">기존 방식 vs. 새로운 접근</div>
  <div style="position:absolute;top:200px;left:200px;font-size:24px;font-weight:700;color:#64748b;">기존 방식</div>
  ${['수작업 중심의 느린 처리', '높은 인건비와 오류율', '확장성의 근본적 한계'].map((t,i) => `<div style="position:absolute;top:${260+i*52}px;left:200px;font-size:18px;color:#334155;">✕ ${t}</div>`).join('')}
  <div style="position:absolute;top:200px;left:760px;font-size:24px;font-weight:700;color:#2563eb;">AI 자동화</div>
  ${['10배 빠른 처리 속도', '비용 70% 절감 효과', '무한에 가까운 확장성'].map((t,i) => `<div style="position:absolute;top:${260+i*52}px;left:760px;font-size:18px;color:#334155;">✓ ${t}</div>`).join('')}
</div>`,
  },

  // 29. TEAM GRID CARDS ───────────────────────────────────────────────────────
  {
    id: 'team-grid-cards',
    name: '팀 그리드 카드',
    category: '비즈니스',
    tags: ['team', '팀소개', '조직'],
    zones: [
      { id: 'TITLE', x: 60, y: 80, w: 900, h: 70, fontSize: 38, color: '#0f172a', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 60, y: 165, w: 800, h: 40, fontSize: 18, color: '#64748b', role: 'summary' },
      { id: 'BULLET_0', x: 100, y: 500, w: 220, h: 80, fontSize: 16, color: '#334155', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_1', x: 400, y: 500, w: 220, h: 80, fontSize: 16, color: '#334155', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_2', x: 700, y: 500, w: 220, h: 80, fontSize: 16, color: '#334155', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_3', x: 1000, y: 500, w: 220, h: 80, fontSize: 16, color: '#334155', textAlign: 'center', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#fefefe;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#f97316,#ec4899);"></div>
  ${[100,400,700,1000].map(x => `<div style="position:absolute;top:280px;left:${x}px;width:220px;height:180px;background:#fff;border:1px solid #f1f5f9;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,0.05);"></div><div style="position:absolute;top:300px;left:${x+70}px;width:80px;height:80px;background:linear-gradient(135deg,#f97316,#ec4899);border-radius:50%;"></div>`).join('')}
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#fefefe;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#f97316,#ec4899);"></div>
  <div style="position:absolute;left:60px;top:85px;font-size:38px;font-weight:800;color:#0f172a;">우리 팀을 소개합니다</div>
  <div style="position:absolute;left:60px;top:170px;font-size:18px;color:#64748b;">각자의 전문성으로 함께 만들어가는 팀</div>
  ${[{x:100,i:'👩‍💼',n:'김서연',r:'CEO'},{x:400,i:'👨‍💻',n:'박도현',r:'CTO'},{x:700,i:'👩‍🎨',n:'이하윤',r:'Design Lead'},{x:1000,i:'👨‍🔬',n:'최지훈',r:'AI Lead'}].map(({x,i,n,r}) => `<div style="position:absolute;top:280px;left:${x}px;width:220px;height:180px;background:#fff;border:1px solid #f1f5f9;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,0.05);display:flex;flex-direction:column;align-items:center;padding-top:20px;box-sizing:border-box;"><div style="width:80px;height:80px;background:linear-gradient(135deg,#f97316,#ec4899);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;">${i}</div><div style="margin-top:14px;font-size:16px;font-weight:700;color:#0f172a;">${n}</div><div style="font-size:13px;color:#94a3b8;">${r}</div></div>`).join('')}
</div>`,
  },

  // 30. QUOTE SPOTLIGHT ───────────────────────────────────────────────────────
  {
    id: 'quote-spotlight',
    name: '쿼트 스포트라이트',
    category: '마케팅',
    tags: ['quote', '인용구', '고객후기'],
    zones: [
      { id: 'QUOTE', x: 180, y: 240, w: 920, h: 220, fontSize: 40, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Georgia, serif', role: 'quote' },
      { id: 'LABEL', x: 340, y: 500, w: 600, h: 40, fontSize: 18, color: '#a5b4fc', textAlign: 'center', role: 'label' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:linear-gradient(160deg,#1e1b4b,#312e81);position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;top:120px;left:160px;font-size:140px;color:rgba(255,255,255,0.12);font-family:Georgia,serif;">"</div>
  <div style="position:absolute;bottom:100px;right:180px;font-size:140px;color:rgba(255,255,255,0.12);font-family:Georgia,serif;transform:rotate(180deg);">"</div>
  <div style="position:absolute;top:490px;left:50%;transform:translateX(-50%);width:60px;height:3px;background:#818cf8;border-radius:2px;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:linear-gradient(160deg,#1e1b4b,#312e81);position:relative;overflow:hidden;font-family:Georgia,serif;">
  <div style="position:absolute;top:120px;left:160px;font-size:140px;color:rgba(255,255,255,0.12);">"</div>
  <div style="position:absolute;bottom:100px;right:180px;font-size:140px;color:rgba(255,255,255,0.12);transform:rotate(180deg);">"</div>
  <div style="position:absolute;top:250px;left:180px;right:180px;text-align:center;font-size:40px;font-weight:700;color:#fff;line-height:1.4;">"이 제품 덕분에 우리 팀의 생산성이<br>세 배 이상 향상되었습니다"</div>
  <div style="position:absolute;top:490px;left:50%;transform:translateX(-50%);width:60px;height:3px;background:#818cf8;border-radius:2px;"></div>
  <div style="position:absolute;top:510px;left:340px;width:600px;text-align:center;font-size:18px;color:#a5b4fc;">김민지 · ACME Corp 프로덕트 디렉터</div>
</div>`,
  },

  // 31. PASTEL MEMPHIS ────────────────────────────────────────────────────────
  {
    id: 'pastel-memphis',
    name: '파스텔 멤피스',
    category: '스타트업',
    tags: ['playful', 'pastel', '멤피스', '발랄'],
    zones: [
      { id: 'TITLE', x: 100, y: 210, w: 820, h: 180, fontSize: 58, color: '#27272a', fontWeight: 'bold', role: 'title' },
      { id: 'SUMMARY', x: 100, y: 400, w: 700, h: 60, fontSize: 21, color: '#52525b', role: 'summary' },
      { id: 'BULLET_0', x: 100, y: 490, w: 260, h: 90, fontSize: 16, color: '#3f3f46', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_1', x: 390, y: 490, w: 260, h: 90, fontSize: 16, color: '#3f3f46', textAlign: 'center', role: 'bullet' },
      { id: 'BULLET_2', x: 680, y: 490, w: 260, h: 90, fontSize: 16, color: '#3f3f46', textAlign: 'center', role: 'bullet' },
    ],
    backgroundHtml: `<div style="width:1280px;height:720px;background:#fef9f0;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:60px;right:120px;width:0;height:0;border-left:60px solid transparent;border-right:60px solid transparent;border-bottom:100px solid #a7f3d0;"></div>
  <div style="position:absolute;top:220px;right:60px;width:90px;height:90px;background:#fbcfe8;border-radius:50%;"></div>
  <div style="position:absolute;bottom:80px;right:200px;width:70px;height:70px;background:#93c5fd;transform:rotate(20deg);border-radius:12px;"></div>
  <div style="position:absolute;bottom:120px;right:340px;width:0;height:0;border-left:30px solid transparent;border-right:30px solid transparent;border-bottom:50px solid #fde68a;"></div>
  <div style="position:absolute;top:150px;left:100px;width:40px;height:6px;background:#27272a;border-radius:3px;"></div>
</div>`,
    thumbnailHtml: `<div style="width:1280px;height:720px;background:#fef9f0;position:relative;overflow:hidden;font-family:Arial,sans-serif;">
  <div style="position:absolute;top:60px;right:120px;width:0;height:0;border-left:60px solid transparent;border-right:60px solid transparent;border-bottom:100px solid #a7f3d0;"></div>
  <div style="position:absolute;top:220px;right:60px;width:90px;height:90px;background:#fbcfe8;border-radius:50%;"></div>
  <div style="position:absolute;bottom:80px;right:200px;width:70px;height:70px;background:#93c5fd;transform:rotate(20deg);border-radius:12px;"></div>
  <div style="position:absolute;bottom:120px;right:340px;width:0;height:0;border-left:30px solid transparent;border-right:30px solid transparent;border-bottom:50px solid #fde68a;"></div>
  <div style="position:absolute;top:150px;left:100px;width:40px;height:6px;background:#27272a;border-radius:3px;"></div>
  <div style="position:absolute;left:100px;top:215px;font-size:58px;font-weight:900;color:#27272a;line-height:1.15;max-width:820px;">즐겁게 일하는<br>우리들의 방법</div>
  <div style="position:absolute;left:100px;top:405px;font-size:21px;color:#52525b;">딱딱하지 않아도 프로페셔널할 수 있어요</div>
  ${[{i:'🎨',t:'자유로운 협업'},{i:'🎉',t:'즐거운 문화'},{i:'💡',t:'과감한 실험'}].map(({i,t},idx) => `<div style="position:absolute;top:490px;left:${100+idx*290}px;width:260px;height:90px;display:flex;flex-direction:column;align-items:center;gap:8px;"><div style="font-size:36px;">${i}</div><div style="font-size:16px;color:#3f3f46;font-weight:600;">${t}</div></div>`).join('')}
</div>`,
  },

]

export const HTML_TEMPLATE_CATEGORIES = ['전체', '비즈니스', '마케팅', '스타트업', '교육', '기술', '헬스케어', '여행', '푸드', '웨딩', '부동산', '금융', '패션', '게임', '소셜임팩트', '포트폴리오']
