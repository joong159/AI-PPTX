'use client'

import { THEMES } from '@/lib/themes'

interface Props {
  currentId: string
  onChange: (id: string) => void
}

export default function ThemePicker({ currentId, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          title={t.name}
          className={`relative flex flex-col items-center gap-1 transition-all ${
            currentId === t.id ? 'scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'
          }`}
        >
          <div
            className="w-8 h-6 rounded-md shadow-sm"
            style={{
              background: t.preview,
              outline: currentId === t.id ? '2px solid #4F46E5' : '2px solid transparent',
              outlineOffset: '2px',
            }}
          />
          <span className="text-xs text-gray-500 leading-none">{t.name}</span>
        </button>
      ))}
    </div>
  )
}
