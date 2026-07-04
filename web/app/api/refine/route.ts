import { NextRequest, NextResponse } from 'next/server'
import { getAiClient, AI_MODEL } from '@/lib/ai-client'
import { extractJson, stripTransportFields, restoreTransportFields } from '@/lib/refine-shared'

export async function POST(req: NextRequest) {
  try {
    const client = getAiClient()
    const { slide, instruction, history = [] } = await req.json()
    if (!slide || !instruction) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Build conversation messages with history for context
    const historyMessages = history.slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.role === 'assistant' ? m.content : m.content,
    }))

    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert slide editor. The user has a slide they want to edit.

Current slide JSON:
${JSON.stringify(stripTransportFields(slide), null, 2)}

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

    // Re-attach transport fields (fabricState/imageUrl/image_prompt/templateId)
    // that were stripped before the prompt, and force back identity fields.
    data.slide = restoreTransportFields(data.slide, slide)

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Refine error:', msg)
    if (msg.includes('NVIDIA_API_KEY') || msg.includes('apiKey')) {
      return NextResponse.json({ error: 'NVIDIA_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }
    return NextResponse.json({ error: `수정 실패: ${msg}` }, { status: 500 })
  }
}
