import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { slide, instruction } = await req.json()
    if (!slide || !instruction) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a slide editing assistant. The user will give you a slide JSON and an instruction.
Return ONLY valid JSON with two fields:
{
  "slide": { ...the modified slide object... },
  "message": "Brief description of what you changed (in Korean)"
}
Keep all existing fields. Modify only what the instruction asks.`,
        },
        {
          role: 'user',
          content: `Slide: ${JSON.stringify(slide)}\n\nInstruction: ${instruction}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    })

    const raw = completion.choices[0]?.message?.content || ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const data = JSON.parse(jsonMatch?.[0] || raw)

    return NextResponse.json(data)
  } catch (err) {
    console.error('Refine error:', err)
    return NextResponse.json({ error: 'Refinement failed' }, { status: 500 })
  }
}
