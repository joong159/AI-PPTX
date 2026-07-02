'use client'

import {
  SLIDE_SIZES, FONT_OPTIONS, COLOR_PALETTES,
  type DesignSettings,
} from '@/lib/design-settings'

interface Props {
  design: DesignSettings
  onChange: (d: DesignSettings) => void
}

export default function DesignPanel({ design, onChange }: Props) {
  function set(patch: Partial<DesignSettings>) {
    onChange({ ...design, ...patch })
  }

  return (
    <div className="w-72 flex-shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <span className="text-base">🎨</span>
        <span className="text-sm font-semibold text-gray-800">디자인 설정</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Slide Size */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">슬라이드 크기</p>
          <div className="space-y-1.5">
            {SLIDE_SIZES.map(s => (
              <button
                key={s.id}
                onClick={() => set({ size: s.id })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors ${
                  design.size === s.id
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-xs text-gray-400">{s.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Font */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">폰트</p>
          <div className="grid grid-cols-2 gap-2">
            {FONT_OPTIONS.map(f => (
              <button
                key={f.id}
                onClick={() => set({ font: f.id })}
                style={{ fontFamily: f.css }}
                className={`px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  design.font === f.id
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-lg font-bold leading-none">{f.preview}</div>
                <div className="text-xs mt-0.5 truncate">{f.label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Color Palette */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">색상 팔레트</p>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_PALETTES.map(p => (
              <button
                key={p.id}
                onClick={() => set({ paletteId: p.id, bgColor: '', accentColor: p.accent, textColor: p.text })}
                title={p.name}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                  design.paletteId === p.id
                    ? 'border-indigo-400 bg-indigo-50 scale-105'
                    : 'border-gray-100 hover:border-gray-300 hover:scale-105'
                }`}
              >
                <div className="flex gap-0.5">
                  {p.preview.slice(0, 2).map((c, i) => (
                    <div key={i} className="w-4 h-4 rounded-sm" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-xs text-gray-500 leading-none">{p.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Background Color */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">배경색 직접 지정</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={design.bgColor || '#F8F9FF'}
              onChange={e => set({ bgColor: e.target.value })}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
            />
            <div className="flex-1">
              <input
                type="text"
                value={design.bgColor || ''}
                onChange={e => {
                  const v = e.target.value
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) set({ bgColor: v })
                }}
                placeholder="#FFFFFF"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-300 font-mono"
              />
            </div>
            {design.bgColor && (
              <button
                onClick={() => set({ bgColor: '' })}
                className="text-xs text-gray-400 hover:text-gray-600"
                title="초기화"
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {/* Reset */}
        <button
          onClick={() => onChange({ size: '16:9', font: 'sans', paletteId: 'indigo', bgColor: '', accentColor: '#4F46E5', textColor: '#1e293b' })}
          className="w-full text-sm text-gray-400 hover:text-gray-600 py-1.5 border border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          초기화
        </button>
      </div>
    </div>
  )
}
