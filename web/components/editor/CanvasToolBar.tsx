'use client'

import { useRef, useState } from 'react'
import type { CanvasTool } from './FabricCanvas'

const SHAPE_TOOLS: { id: CanvasTool; icon: string; label: string }[] = [
  { id: 'rect',     icon: '□',  label: '사각형 (R)' },
  { id: 'circle',   icon: '○',  label: '원 (C)' },
  { id: 'triangle', icon: '△',  label: '삼각형' },
  { id: 'line',     icon: '╱',  label: '선' },
  { id: 'star',     icon: '★',  label: '별' },
  { id: 'arrow',    icon: '➜',  label: '화살표' },
  { id: 'diamond',  icon: '◇',  label: '다이아몬드' },
  { id: 'pentagon', icon: '⬠',  label: '오각형' },
]

interface Props {
  activeTool: CanvasTool
  onChange: (tool: CanvasTool) => void
  onUndo: () => void
  onRedo: () => void
  onDuplicate: () => void
  onCopy: () => void
  onPaste: () => void
  onSelectAll: () => void
  onGroup: () => void
  onUngroup: () => void
  onImageFile: (file: File) => void
}

export default function CanvasToolBar({
  activeTool, onChange,
  onUndo, onRedo, onDuplicate, onCopy, onPaste, onSelectAll, onGroup, onUngroup,
  onImageFile,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [showShapes, setShowShapes] = useState(false)

  const isShape = SHAPE_TOOLS.some(t => t.id === activeTool)

  const MAIN_TOOLS: { id: CanvasTool; icon: string; label: string }[] = [
    { id: 'select', icon: '↖',  label: '선택 (V)' },
    { id: 'text',   icon: 'T',  label: '텍스트 (T)' },
  ]

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-gray-100 flex-wrap relative">

      {/* Main tools */}
      <div className="flex items-center gap-0.5 bg-gray-50 rounded-xl p-1">
        {MAIN_TOOLS.map(t => (
          <ToolBtn key={t.id} active={activeTool === t.id} title={t.label} onClick={() => onChange(t.id)}>
            {t.icon}
          </ToolBtn>
        ))}

        {/* Shapes dropdown */}
        <div className="relative">
          <ToolBtn
            active={isShape || showShapes}
            title="도형 추가"
            onClick={() => setShowShapes(v => !v)}
          >
            {isShape ? SHAPE_TOOLS.find(t => t.id === activeTool)?.icon : '□'}
            <span className="text-[7px] ml-0.5">▾</span>
          </ToolBtn>
          {showShapes && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 z-50 grid grid-cols-4 gap-1 w-40">
              {SHAPE_TOOLS.map(t => (
                <button key={t.id} title={t.label}
                  onClick={() => { onChange(t.id); setShowShapes(false) }}
                  className={`w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-all ${activeTool === t.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >{t.icon}</button>
              ))}
            </div>
          )}
        </div>

        {/* Image */}
        <ToolBtn title="이미지 업로드 (I)" active={false} onClick={() => fileRef.current?.click()}>🖼</ToolBtn>
      </div>

      <Sep />

      {/* History */}
      <div className="flex items-center gap-0.5 bg-gray-50 rounded-xl p-1">
        <ToolBtn title="실행 취소 (Ctrl+Z)" active={false} onClick={onUndo}>↩</ToolBtn>
        <ToolBtn title="다시 실행 (Ctrl+Y)" active={false} onClick={onRedo}>↪</ToolBtn>
      </div>

      <Sep />

      {/* Edit */}
      <div className="flex items-center gap-0.5 bg-gray-50 rounded-xl p-1">
        <ToolBtn title="복사 (Ctrl+C)" active={false} onClick={onCopy}>⎘</ToolBtn>
        <ToolBtn title="붙여넣기 (Ctrl+V)" active={false} onClick={onPaste}>⊕</ToolBtn>
        <ToolBtn title="복제 (Ctrl+D)" active={false} onClick={onDuplicate}>⧉</ToolBtn>
        <ToolBtn title="전체 선택 (Ctrl+A)" active={false} onClick={onSelectAll}>⊞</ToolBtn>
      </div>

      <Sep />

      {/* Group */}
      <div className="flex items-center gap-0.5 bg-gray-50 rounded-xl p-1">
        <ToolBtn title="그룹 (Ctrl+G)" active={false} onClick={onGroup}>⊛</ToolBtn>
        <ToolBtn title="그룹 해제 (Ctrl+Shift+G)" active={false} onClick={onUngroup}>⊙</ToolBtn>
      </div>

      {/* Hint text */}
      <span className="text-xs text-gray-400 ml-1 hidden md:block">
        {activeTool === 'select'
          ? '클릭 선택 · 드래그 이동 · 더블클릭 텍스트 편집 · Delete 삭제'
          : activeTool === 'text' ? '슬라이드를 클릭해 텍스트 추가'
          : isShape ? '슬라이드를 클릭해 도형 추가'
          : '이미지 파일을 선택하세요'}
      </span>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) { onImageFile(f); onChange('select') }
          e.target.value = ''
        }}
      />
    </div>
  )
}

function ToolBtn({ children, active, title, onClick }: { children: React.ReactNode; active: boolean; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick}
      className={`min-w-[32px] h-8 px-1.5 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${active ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
    >{children}</button>
  )
}

function Sep() { return <div className="w-px h-6 bg-gray-200" /> }
