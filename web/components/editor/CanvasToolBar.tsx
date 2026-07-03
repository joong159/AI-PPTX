'use client'

import { useRef } from 'react'
import type { CanvasTool } from './FabricCanvas'

const TOOLS: { id: CanvasTool; icon: string; label: string }[] = [
  { id: 'select',   icon: '↖',  label: '선택 (V)' },
  { id: 'text',     icon: 'T',  label: '텍스트 (T)' },
  { id: 'rect',     icon: '□',  label: '사각형 (R)' },
  { id: 'circle',   icon: '○',  label: '원 (C)' },
  { id: 'triangle', icon: '△',  label: '삼각형' },
  { id: 'line',     icon: '╱', label: '선 (L)' },
  { id: 'image',    icon: '🖼',  label: '이미지 (I)' },
]

interface Props {
  activeTool: CanvasTool
  onChange: (tool: CanvasTool) => void
  onUndo: () => void
  onRedo: () => void
  onImageFile: (file: File) => void
}

export default function CanvasToolBar({ activeTool, onChange, onUndo, onRedo, onImageFile }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleTool = (id: CanvasTool) => {
    if (id === 'image') {
      fileRef.current?.click()
      return
    }
    onChange(id)
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-100 flex-wrap">
      {/* Tools */}
      <div className="flex items-center gap-0.5 bg-gray-50 rounded-xl p-1">
        {TOOLS.map(t => (
          <button
            key={t.id}
            title={t.label}
            onClick={() => handleTool(t.id)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
              activeTool === t.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 bg-gray-50 rounded-xl p-1">
        <button
          title="실행 취소 (Ctrl+Z)"
          onClick={onUndo}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        >
          ↩
        </button>
        <button
          title="다시 실행 (Ctrl+Y)"
          onClick={onRedo}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        >
          ↪
        </button>
      </div>

      {/* Hint */}
      <span className="text-xs text-gray-400 ml-1">
        {activeTool === 'select' ? '클릭으로 선택 · 드래그로 이동 · 더블클릭으로 텍스트 편집'
          : activeTool === 'text' ? '슬라이드를 클릭해 텍스트 박스를 추가하세요'
          : activeTool === 'image' ? '이미지 파일을 선택하세요'
          : '슬라이드를 클릭해 도형을 추가하세요'}
      </span>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) { onImageFile(file); onChange('select') }
          e.target.value = ''
        }}
      />
    </div>
  )
}
