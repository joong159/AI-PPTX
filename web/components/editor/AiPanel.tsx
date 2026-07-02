'use client'

import { useState } from 'react'
import type { Slide } from '@/lib/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  slide: Slide
  onUpdateSlide: (updated: Slide) => void
}

export default function AiPanel({ slide, onUpdateSlide }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '이 슬라이드를 어떻게 개선할까요? 자유롭게 요청해보세요.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide, instruction: text }),
      })
      const data = await res.json()
      if (data.slide) {
        onUpdateSlide(data.slide)
        setMessages([...newMessages, { role: 'assistant', content: data.message || '슬라이드를 수정했습니다.' }])
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.error || '오류가 발생했습니다.' }])
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '서버 오류가 발생했습니다.' }])
    } finally {
      setLoading(false)
    }
  }

  const QUICK = ['내용을 더 간결하게', '불릿 3개 추가', '제목 더 임팩트 있게', '영어로 번역']

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100">
      <div className="p-3 border-b border-gray-100">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI 편집 도우미</div>
        <div className="text-xs text-gray-400 mt-0.5">현재 슬라이드: {slide.title || '(제목 없음)'}</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] text-sm rounded-2xl px-4 py-2.5 leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-700 rounded-bl-md'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-400 text-sm rounded-2xl rounded-bl-md px-4 py-2.5">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => { setInput(q); }}
            className="text-xs px-2.5 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="이 슬라이드를 수정해달라고 요청..."
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="text-sm font-medium px-3 py-2 rounded-xl text-white transition-opacity disabled:opacity-40"
          style={{ background: '#4F46E5' }}
        >
          →
        </button>
      </div>
    </div>
  )
}
