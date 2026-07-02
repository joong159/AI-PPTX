import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

function extractJson(raw: string) {
  // 1) direct parse
  try { return JSON.parse(raw) } catch {}
  // 2) strip markdown code fences
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fence) try { return JSON.parse(fence[1]) } catch {}
  // 3) greedy brace match
  const brace = raw.match(/\{[\s\S]*\}/)
  if (brace) try { return JSON.parse(brace[0]) } catch {}
  return null
}

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { slide, instruction, history = [] } = await req.json()
    if (!slide || !instruction) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Build conversation messages with history for context
    const historyMessages = history.slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.role === 'assistant' ? m.content : m.content,
    }))

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert slide editor. The user has a slide they want to edit.

Current slide JSON:
${JSON.stringify(slide, null, 2)}

Rules:
- Return ONLY valid JSON, no markdown, no explanation outside JSON
- Format: { "slide": { ...complete modified slide... }, "message": "Korean description of changes" }
- Keep ALL existing fields (even if unchanged)
- Preserve _id, slide_index, slide_type unless explicitly asked to change
- If user asks to add bullets, append to existing bullets array
- If user asks to make content shorter/longer, rewrite bullets/title accordingly
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
    if (!data.slide) {
      return NextResponse.json({ error: 'AI 응답에 slide 데이터가 없습니다.' }, { status: 500 })
    }

    // Ensure required fields are preserved
    data.slide._id = slide._id
    data.slide.slide_index = slide.slide_index

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Refine error:', msg)
    if (msg.includes('GROQ_API_KEY') || msg.includes('apiKey')) {
      return NextResponse.json({ error: 'GROQ_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }
    return NextResponse.json({ error: `수정 실패: ${msg}` }, { status: 500 })
  }
}
