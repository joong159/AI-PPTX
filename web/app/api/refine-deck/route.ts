import { NextRequest, NextResponse } from 'next/server'
import { getAiClient, AI_MODEL } from '@/lib/ai-client'
import type { Slide } from '@/lib/types'
import { extractJson, stripTransportFields, restoreTransportFields } from '@/lib/refine-shared'

export async function POST(req: NextRequest) {
  try {
    const client = getAiClient()
    const { slides, instruction, history = [] } = await req.json()
    if (!Array.isArray(slides) || !slides.length || !instruction) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const historyMessages = history.slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const strippedSlides = (slides as Slide[]).map(stripTransportFields)

    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert presentation editor. The user has a whole slide deck they want to edit all at once.

Current slides JSON (array, in order):
${JSON.stringify(strippedSlides, null, 2)}

Rules:
- Return ONLY valid JSON, no markdown, no explanation outside JSON
- Format: { "slides": [ ...complete modified slides array, same length and order... ], "message": "Korean description of changes" }
- Return every slide in the array, even ones you didn't change — never drop a slide
- Keep ALL existing fields on each slide (even if unchanged)
- Preserve each slide's _id, slide_index, slide_type unless explicitly asked to change
- Apply the instruction consistently across every slide (e.g. a tone/style change should touch all slides, not just one)
- For Korean requests, respond in Korean; for English requests, use English content`,
        },
        ...historyMessages,
        {
          role: 'user',
          content: instruction,
        },
      ],
      temperature: 0.4,
      max_tokens: 4000,
    })

    const raw = completion.choices[0]?.message?.content || ''
    const data = extractJson(raw)

    if (!data) {
      return NextResponse.json({ error: `AI가 잘못된 형식을 반환했습니다: ${raw.slice(0, 100)}` }, { status: 500 })
    }
    if (!Array.isArray(data.slides)) {
      return NextResponse.json({ error: 'AI 응답에 slides 데이터가 없습니다.' }, { status: 500 })
    }

    // Re-attach stripped transport fields by matching _id against the original
    // deck (fall back to positional match if an _id ever goes missing).
    data.slides = data.slides.map((s: any, i: number) => {
      const original = (slides as Slide[]).find(orig => orig._id === s._id) ?? slides[i]
      return restoreTransportFields(s, original)
    })

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Refine-deck error:', msg)
    if (msg.includes('NVIDIA_API_KEY') || msg.includes('apiKey')) {
      return NextResponse.json({ error: 'NVIDIA_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }
    return NextResponse.json({ error: `수정 실패: ${msg}` }, { status: 500 })
  }
}
