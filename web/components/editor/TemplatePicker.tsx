'use client'

import { useState } from 'react'
import { HTML_TEMPLATES, HTML_TEMPLATE_CATEGORIES } from '@/lib/html-templates'

interface Props {
  currentTemplateId?: string
  onSelect: (templateId: string) => void
  onClear: () => void
}

export default function TemplatePicker({ currentTemplateId, onSelect, onClear }: Props) {
  const [activeCategory, setActiveCategory] = useState('전체')

  const filtered = HTML_TEMPLATES.filter(t =>
    activeCategory === '전체' || t.category === activeCategory
  )

  const PREVIEW_W = 232

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="p-2 border-b border-gray-100 flex flex-wrap gap-1">
        {HTML_TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
              activeCategory === cat ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Default/clear option */}
        <div
          onClick={onClear}
          className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${
            !currentTemplateId ? 'border-indigo-400' : 'border-transparent hover:border-gray-200'
          }`}
        >
          <div className="h-14 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
            <span className="text-xs text-gray-500 font-medium">🎨 기본 레이아웃</span>
          </div>
        </div>

        {filtered.map(template => {
          const scale = PREVIEW_W / 1280
          const previewH = Math.round(720 * scale)
          const isActive = currentTemplateId === template.id

          return (
            <div
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${
                isActive ? 'border-indigo-400 shadow-md' : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div style={{ width: PREVIEW_W, height: previewH, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: 1280,
                    height: 720,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                  }}
                  dangerouslySetInnerHTML={{ __html: template.thumbnailHtml }}
                />
              </div>
              <div className="px-2 py-1.5 bg-white border-t border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-700 truncate">{template.name}</div>
                  <div className="text-xs text-gray-400">{template.category}</div>
                </div>
                {isActive && <span className="text-xs text-indigo-600 font-medium">✓ 적용됨</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
