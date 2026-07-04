'use client'

import { useState, useEffect, useRef } from 'react'
import type { Slide } from '@/lib/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  slide: Slide
  onUpdateSlide: (updated: Slide) => void
  allSlides: Slide[]
  onUpdateAllSlides: (updated: Slide[]) => void
}

type Mode = 'slide' | 'deck'

const QUICK_SLIDE = [
  '내용을 더 간결하게',
  '불릿 포인트 3개 추가',
  '제목을 더 임팩트 있게',
  '영어로 번역',
  '더 전문적인 어조로',
  '핵심 메시지 강조',
]

const QUICK_DECK = [
  '전체 톤을 더 캐주얼하게',
  '모든 제목을 더 임팩트 있게',
  '전체를 영어로 번역',
  '전체적으로 더 간결하게',
  '전체를 더 전문적인 어조로',
]

export default function AiPanel({ slide, onUpdateSlide, allSlides, onUpdateAllSlides }: Props) {
  const [mode, setMode] = useState<Mode>('slide')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevSlideId = useRef(slide._id)

  // Reset messages when slide changes
  useEffect(() => {
    if (prevSlideId.current !== slide._id) {
      setMessages([])
      prevSlideId.current = slide._id
    }
  }, [slide._id])

  // Reset messages when switching between per-slide and whole-deck mode
  function changeMode(next: Mode) {
    if (next === mode) return
    setMode(next)
    setMessages([])
  }

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      if (mode === 'deck') {
        const res = await fetch('/api/refine-deck', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slides: allSlides,
            instruction: msg,
            history: messages,
          }),
        })
        const data = await res.json()

        if (data.slides) {
          onUpdateAllSlides(data.slides)
          setMessages([...newMessages, {
            role: 'assistant',
            content: data.message || '전체 프레젠테이션을 수정했습니다. ✓',
          }])
        } else {
          setMessages([...newMessages, {
            role: 'assistant',
            content: `⚠️ ${data.error || '오류가 발생했습니다.'}`,
          }])
        }
      } else {
        const res = await fetch('/api/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slide,
            instruction: msg,
            history: messages, // send full conversation history
          }),
        })
        const data = await res.json()

        if (data.slide) {
          onUpdateSlide(data.slide)
          setMessages([...newMessages, {
            role: 'assistant',
            content: data.message || '슬라이드를 수정했습니다. ✓',
          }])
        } else {
          setMessages([...newMessages, {
            role: 'assistant',
            content: `⚠️ ${data.error || '오류가 발생했습니다.'}`,
          }])
        }
      }
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: '⚠️ 서버 연결에 실패했습니다.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100">
      {/* Header */}
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI 편집 도우미</div>
          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">
            {mode === 'deck' ? `전체 프레젠테이션 (${allSlides.length}장)` : (slide.title || '(제목 없음)')}
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {/* Mode toggle */}
      <div className="px-3 pt-2 flex gap-1 border-b border-gray-100 pb-2">
        <button
          onClick={() => changeMode('slide')}
          disabled={loading}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
            mode === 'slide' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          이 슬라이드만
        </button>
        <button
          onClick={() => changeMode('deck')}
          disabled={loading}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
            mode === 'deck' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          전체 프레젠테이션
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="text-2xl mb-2">✨</div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {mode === 'deck'
                ? <>전체 프레젠테이션을 어떻게 바꿀까요?<br />아래 빠른 명령이나 직접 입력해보세요.</>
                : <>이 슬라이드를 어떻게 바꿀까요?<br />아래 빠른 명령이나 직접 입력해보세요.</>}
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] text-sm rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
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
              <span className="inline-flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        {(mode === 'deck' ? QUICK_DECK : QUICK_SLIDE).map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={loading}
            className="text-xs px-2.5 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40"
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
          placeholder="수정 요청을 입력하세요..."
          disabled={loading}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 disabled:opacity-50"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="text-sm font-bold px-3 py-2 rounded-xl text-white transition-opacity disabled:opacity-40"
          style={{ background: '#4F46E5' }}
        >
          →
        </button>
      </div>
    </div>
  )
}
