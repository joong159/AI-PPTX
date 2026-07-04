// Generates candidate HtmlTemplate designs via LLM (instead of hand-authoring
// them), validates their structure, and builds an HTML gallery for human
// review. Only candidates a human picks get manually integrated into
// lib/html-templates.ts afterward — this script never writes to that file.
//
// Run: node --env-file=.env.local --experimental-strip-types scripts/generate-templates.ts
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAiClient, AI_MODEL } from '../lib/ai-client.ts'
import { extractJson } from '../lib/refine-shared.ts'
import { HTML_TEMPLATES, HTML_TEMPLATE_CATEGORIES } from '../lib/html-templates.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'template-candidates')
fs.mkdirSync(OUT_DIR, { recursive: true })

const VALID_ZONE_IDS = ['TITLE', 'SUMMARY', 'LABEL', 'STAT', 'STAT_DESC', 'QUOTE', 'IMAGE', 'BULLET_0', 'BULLET_1', 'BULLET_2', 'BULLET_3', 'BULLET_4']
const VALID_ROLES = ['title', 'summary', 'bullet', 'stat', 'stat_desc', 'quote', 'label', 'image']
const CATEGORIES = HTML_TEMPLATE_CATEGORIES.filter(c => c !== '전체')
const EXISTING_IDS = new Set(HTML_TEMPLATES.map(t => t.id))

const STYLE_BRIEFS = [
  '미니멀 테크 스타트업 — 화이트 배경, 민트/틸 포인트 컬러, 넓은 여백, 산세리프',
  '럭셔리 뷰티/코스메틱 — 로즈골드 + 아이보리, 세리프 폰트, 우아하고 고급스러운 느낌',
  '다크 시네마틱 — 영화 포스터 느낌, 강한 명암 대비, 극적인 조명 효과',
  '에코/지속가능성 — 자연스러운 그린 톤, 유기적인 곡선, 손그림 느낌의 장식',
  '핀테크 프로페셔널 — 네이비 + 네온그린, 데이터/차트 느낌의 그래픽 장식',
  '헬스&웰니스 프리미엄 — 부드러운 파스텔톤, 둥근 곡선, 차분하고 신뢰감 있는 느낌',
  '컨퍼런스/이벤트 — 볼드한 타이포그래피, 강렬한 컬러 블록, 에너지 넘치는 느낌',
  '일본식 미니멀리즘 — 여백 강조, 차분한 무채색+인디고, 정갈하고 절제된 느낌',
]

const dark_hero_example = HTML_TEMPLATES.find(t => t.id === 'dark-hero')!

function buildPrompt(brief: string): { system: string; user: string } {
  const system = `You generate ONE presentation slide template as JSON, matching this exact TypeScript schema:

interface SlotZone {
  id: string        // MUST be one of: ${VALID_ZONE_IDS.join(', ')}
  x: number; y: number; w: number; h: number   // position within a 1280x720 canvas — all four MUST be within those bounds
  fontSize: number
  color: string      // hex like "#ffffff" or "rgba(r,g,b,a)"
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
  fontFamily?: string
  rx?: number        // corner rounding, image zones only
  role: string       // MUST be one of: ${VALID_ROLES.join(', ')}
}
interface HtmlTemplate {
  id: string         // kebab-case, unique, in English, e.g. "midnight-cinema"
  name: string        // Korean display name
  category: string    // MUST be exactly one of: ${CATEGORIES.join(', ')}
  tags: string[]       // 3-4 short Korean/English tags
  zones: SlotZone[]    // MUST include at least a TITLE zone
  backgroundHtml: string   // decorative background ONLY — absolutely NO text content, no {{slots}}
  thumbnailHtml: string    // the SAME background PLUS invented, theme-appropriate Korean demo copy positioned at each zone — this is a preview a user browses, so write real, specific, on-theme Korean text (not placeholders)
}

Hard rules:
- Both backgroundHtml and thumbnailHtml are self-contained HTML strings. Each one INDEPENDENTLY starts with exactly: <div style="width:1280px;height:720px;position:relative;overflow:hidden;...">  (you may add more to that style attribute, e.g. background/font-family, but keep those four properties)
- Use ONLY inline style="..." attributes. No <style> tags, no CSS classes, no <script>, no external images/fonts/URLs.
- Every <div> you open must be closed. Double-check nesting before answering.
- Return ONLY the JSON object for HtmlTemplate. No markdown fences, no commentary.

Here is one real existing template as a concrete example of the expected style, quality bar, and JSON shape:
${JSON.stringify(dark_hero_example, null, 2)}`

  const user = `Design a new, visually distinct template for this style brief:
${brief}

Make it clearly different from the dark-hero example above in composition (don't just recolor it) — vary the layout: where the title sits, whether it's left/center-aligned, how bullets are arranged, what decorative shapes/gradients appear. Include 3 bullet zones (BULLET_0..2) and an IMAGE zone somewhere with generous, non-overlapping space.`

  return { system, user }
}

interface ValidationResult {
  valid: boolean
  reason?: string
}

function validateCandidate(obj: any): ValidationResult {
  if (!obj || typeof obj !== 'object') return { valid: false, reason: 'not an object' }
  for (const field of ['id', 'name', 'category', 'tags', 'zones', 'backgroundHtml', 'thumbnailHtml']) {
    if (!(field in obj)) return { valid: false, reason: `missing field: ${field}` }
  }
  if (EXISTING_IDS.has(obj.id)) return { valid: false, reason: `id collides with existing template: ${obj.id}` }
  if (!Array.isArray(obj.zones) || obj.zones.length === 0) return { valid: false, reason: 'zones empty/not an array' }
  if (!obj.zones.some((z: any) => z.id === 'TITLE')) return { valid: false, reason: 'no TITLE zone' }
  for (const z of obj.zones) {
    if (!VALID_ZONE_IDS.includes(z.id)) return { valid: false, reason: `invalid zone id: ${z.id}` }
    if (!VALID_ROLES.includes(z.role)) return { valid: false, reason: `invalid zone role: ${z.role}` }
    for (const key of ['x', 'y', 'w', 'h']) {
      const v = z[key]
      if (typeof v !== 'number' || Number.isNaN(v)) return { valid: false, reason: `zone ${z.id}.${key} not a number` }
    }
    if (z.x < 0 || z.x > 1280 || z.y < 0 || z.y > 720) return { valid: false, reason: `zone ${z.id} out of canvas bounds` }
  }
  if (!CATEGORIES.includes(obj.category)) return { valid: false, reason: `category not in whitelist: ${obj.category}` }

  for (const field of ['backgroundHtml', 'thumbnailHtml']) {
    const html: string = obj[field]
    if (typeof html !== 'string' || html.length < 50) return { valid: false, reason: `${field} too short/missing` }
    if (!/^<div style="width:1280px;height:720px;/.test(html.trim())) {
      return { valid: false, reason: `${field} doesn't start with the required wrapper div` }
    }
    if (/<script/i.test(html)) return { valid: false, reason: `${field} contains <script>` }
    const opens = (html.match(/<div/g) || []).length
    const closes = (html.match(/<\/div>/g) || []).length
    if (opens !== closes) return { valid: false, reason: `${field} has unbalanced <div> tags (${opens} open, ${closes} close)` }
  }

  return { valid: true }
}

async function generateOne(brief: string, index: number) {
  const client = getAiClient()
  const { system, user } = buildPrompt(brief)
  console.log(`\n[${index + 1}/${STYLE_BRIEFS.length}] Generating: ${brief.slice(0, 40)}...`)

  try {
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.75,
      max_tokens: 4000,
    })
    const raw = completion.choices[0]?.message?.content || ''
    const parsed = extractJson(raw)
    if (!parsed) {
      console.log(`  ✗ REJECTED — could not parse JSON. Raw (first 200 chars): ${raw.slice(0, 200)}`)
      return null
    }
    const result = validateCandidate(parsed)
    if (!result.valid) {
      console.log(`  ✗ REJECTED — ${result.reason}`)
      return null
    }
    const outPath = path.join(OUT_DIR, `${parsed.id}.json`)
    fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2))
    console.log(`  ✓ ACCEPTED — ${parsed.id} (${parsed.name}, ${parsed.category}) -> ${outPath}`)
    return parsed
  } catch (err) {
    console.log(`  ✗ ERROR — ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

function buildGalleryHtml(candidates: any[]): string {
  const cards = candidates.map(t => {
    const scale = 320 / 1280
    const h = Math.round(720 * scale)
    return `<div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#fff;">
  <div style="width:320px;height:${h}px;overflow:hidden;position:relative;">
    <div style="width:1280px;height:720px;transform:scale(${scale});transform-origin:top left;">${t.thumbnailHtml}</div>
  </div>
  <div style="padding:10px 12px;">
    <div style="font-weight:700;font-size:14px;color:#111;">${t.name}</div>
    <div style="font-size:12px;color:#888;">${t.category} · ${t.id}</div>
    <div style="font-size:11px;color:#aaa;margin-top:4px;">${(t.tags || []).join(', ')}</div>
  </div>
</div>`
  }).join('\n')

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>AI 생성 템플릿 후보</title></head>
<body style="margin:0;padding:32px;background:#f3f4f6;font-family:-apple-system,system-ui,sans-serif;">
  <h1 style="font-size:20px;margin-bottom:20px;">AI 생성 템플릿 후보 (${candidates.length}개)</h1>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;">
    ${cards}
  </div>
</body></html>`
}

async function main() {
  const candidates: any[] = []
  for (let i = 0; i < STYLE_BRIEFS.length; i++) {
    const result = await generateOne(STYLE_BRIEFS[i], i)
    if (result) candidates.push(result)
  }

  console.log(`\n${candidates.length}/${STYLE_BRIEFS.length} candidates accepted.`)

  const galleryPath = path.join(OUT_DIR, 'gallery.html')
  fs.writeFileSync(galleryPath, buildGalleryHtml(candidates))
  console.log(`Gallery written to ${galleryPath}`)
}

main()
