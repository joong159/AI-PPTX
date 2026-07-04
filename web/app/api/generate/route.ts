import { NextRequest, NextResponse } from 'next/server'
import { getAiClient, AI_MODEL } from '@/lib/ai-client'
import { extractJson } from '@/lib/refine-shared'
import { autoAssignTemplate } from '@/lib/html-templates'

const SLIDE_TYPES = [
  'title_and_content', 'section_header', 'big_stat',
  'three_cards', 'timeline', 'two_column',
  'quote_slide', 'image_text', 'comparison',
]

const SYSTEM_PROMPT = `You are an expert presentation designer. Generate a structured JSON presentation.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "title": "Presentation Title",
  "slides": [
    {
      "_id": "slide_1",
      "slide_index": 0,
      "slide_type": "title_and_content",
      "title": "Slide Title",
      "summary": "Brief summary",
      "bullets": ["Point 1", "Point 2", "Point 3"],
      "key_takeaway": "One key message",
      "speaker_notes": "Notes for presenter",
      "image_prompt": "professional business team meeting modern office",
      "stat_value": null,
      "stat_description": null,
      "cards": null,
      "timeline_steps": null
    }
  ]
}

Slide type rules:
- title_and_content: bullets array required (3-5 items)
- section_header: only title + summary, no bullets needed (use as chapter dividers)
- big_stat: stat_value (e.g. "43%", "$2.4B", "3x"), stat_description, optional bullets (2-3)
- three_cards: cards array with {card_title, card_content} (exactly 3 cards)
- timeline: timeline_steps array with {step_title, step_desc} (3-4 steps)
- two_column: bullets array (6-8 items, split into 2 columns automatically)
- quote_slide: title is the quote text, summary is the attribution/source (e.g. "— Steve Jobs")
- image_text: title + summary (illustration caption) + bullets (3-4 items shown on the right side)
- comparison: cards array with exactly 2 cards {card_title, card_content} for left vs right comparison

image_prompt rules:
- ALWAYS include image_prompt for every slide
- 5-10 words in English describing ideal background or illustration
- For section_header: vivid scene (e.g. "futuristic city skyline purple sunset")
- For image_text: concrete visual (e.g. "scientist analyzing DNA helix laboratory")
- For others: abstract professional context (e.g. "data visualization charts blue gradient")
- Style: professional, clean, vector art, flat design

Use diverse slide types. Recommended distribution for a 7-slide deck:
1x section_header, 2x title_and_content, 1x big_stat or three_cards, 1x timeline or comparison, 1x quote_slide or image_text

Make content professional, concise, and impactful.`

export async function POST(req: NextRequest) {
  try {
    const client = getAiClient()
    const { topic, slide_count = 6, language = 'Korean', style = 'professional' } = await req.json()

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const userPrompt = `Create a ${style} presentation about: "${topic}"
Number of slides: ${slide_count}
Language: ${language}
Use diverse slide types from: ${SLIDE_TYPES.join(', ')}
Start with a title_and_content or section_header slide.`

    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    })

    const raw = completion.choices[0]?.message?.content || ''
    const data = extractJson(raw)
    if (!data) {
      return NextResponse.json({ error: 'AI returned invalid JSON', raw }, { status: 500 })
    }

    // Normalize slides + attach AI image URLs via Pollinations.ai (free, no API key)
    const usedTemplateIds = new Set<string>()
    data.slides = (data.slides || []).map((s: Record<string, unknown>, i: number) => {
      const imagePrompt = (s.image_prompt as string | undefined)?.trim() || ''
      const imageUrl = imagePrompt
        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt + ', professional presentation, flat design, clean')}&width=800&height=500&nologo=true&seed=${i + 1}`
        : undefined
      const slideType = (s.slide_type as string) || 'title_and_content'
      const bullets = Array.isArray(s.bullets) ? s.bullets : []
      const templateId = autoAssignTemplate(slideType, i, { bullets, stat_value: s.stat_value as string | undefined, imageUrl }, usedTemplateIds)
      usedTemplateIds.add(templateId)
      return {
        _id: `slide_${i + 1}`,
        slide_index: i,
        slide_type: slideType,
        title: s.title || '',
        summary: s.summary || '',
        bullets,
        key_takeaway: s.key_takeaway || '',
        speaker_notes: s.speaker_notes || '',
        image_prompt: imagePrompt || undefined,
        imageUrl: imageUrl,
        stat_value: s.stat_value || null,
        stat_description: s.stat_description || null,
        cards: Array.isArray(s.cards) ? s.cards : null,
        timeline_steps: Array.isArray(s.timeline_steps) ? s.timeline_steps : null,
        templateId,
      }
    })

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Generate error:', msg)
    if (msg.includes('NVIDIA_API_KEY') || msg.includes('apiKey')) {
      return NextResponse.json({ error: 'NVIDIA_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.' }, { status: 500 })
    }
    return NextResponse.json({ error: `생성 실패: ${msg}` }, { status: 500 })
  }
}
