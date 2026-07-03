'use client'

import { useEffect, useState, useCallback } from 'react'

interface Props {
  selectedObject: any | null
  canvas: any | null
  onSave: () => void
}

export default function ObjectPropertiesPanel({ selectedObject: obj, canvas, onSave }: Props) {
  const [fill, setFill] = useState('#4F46E5')
  const [stroke, setStroke] = useState('#4F46E5')
  const [strokeWidth, setStrokeWidth] = useState(0)
  const [opacity, setOpacity] = useState(100)
  const [fontSize, setFontSize] = useState(24)
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal')
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal')
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left')
  const [textColor, setTextColor] = useState('#1e293b')

  const isText = obj?.type === 'textbox' || obj?.type === 'i-text'

  // Sync state from selected object
  useEffect(() => {
    if (!obj) return
    setFill(obj.fill || '#ffffff')
    setStroke(obj.stroke || '#000000')
    setStrokeWidth(obj.strokeWidth || 0)
    setOpacity(Math.round((obj.opacity ?? 1) * 100))
    if (isText) {
      setFontSize(obj.fontSize || 24)
      setFontWeight(obj.fontWeight === 'bold' ? 'bold' : 'normal')
      setFontStyle(obj.fontStyle === 'italic' ? 'italic' : 'normal')
      setTextAlign(obj.textAlign || 'left')
      setTextColor(obj.fill || '#1e293b')
    }
  }, [obj, isText])

  const apply = useCallback((props: object) => {
    if (!obj || !canvas) return
    obj.set(props)
    canvas.requestRenderAll()
    onSave()
  }, [obj, canvas, onSave])

  const bringForward = () => { if (canvas && obj) { canvas.bringObjectForward(obj); canvas.requestRenderAll(); onSave() } }
  const sendBackward = () => { if (canvas && obj) { canvas.sendObjectBackwards(obj); canvas.requestRenderAll(); onSave() } }
  const bringToFront = () => { if (canvas && obj) { canvas.bringObjectToFront(obj); canvas.requestRenderAll(); onSave() } }
  const sendToBack   = () => { if (canvas && obj) { canvas.sendObjectToBack(obj); canvas.requestRenderAll(); onSave() } }
  const deleteObj    = () => {
    if (!canvas || !obj) return
    canvas.remove(obj)
    canvas.discardActiveObject()
    canvas.requestRenderAll()
    onSave()
  }

  if (!obj) return (
    <div className="w-64 flex-shrink-0 bg-white border-l border-gray-100 p-4 flex flex-col items-center justify-center text-center gap-2">
      <span className="text-3xl">↖</span>
      <p className="text-sm font-medium text-gray-500">오브젝트를 선택하면<br />속성이 표시됩니다</p>
    </div>
  )

  return (
    <div className="w-64 flex-shrink-0 bg-white border-l border-gray-100 overflow-y-auto">
      <div className="p-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">속성</span>
        <span className="ml-2 text-xs text-gray-400 capitalize">{obj.type}</span>
      </div>

      <div className="p-3 space-y-4">

        {/* Text properties */}
        {isText && (
          <section>
            <Label>텍스트</Label>
            <div className="space-y-2 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-14">색상</span>
                <input type="color" value={textColor}
                  onChange={e => { setTextColor(e.target.value); apply({ fill: e.target.value }) }}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-14">크기</span>
                <input type="number" value={fontSize} min={8} max={200}
                  onChange={e => { const v = Number(e.target.value); setFontSize(v); apply({ fontSize: v }) }}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center" />
                <span className="text-xs text-gray-400">px</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { const v = fontWeight === 'bold' ? 'normal' : 'bold'; setFontWeight(v); apply({ fontWeight: v }) }}
                  className={`px-2 py-1 rounded text-xs font-bold border ${fontWeight === 'bold' ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600'}`}
                >B</button>
                <button
                  onClick={() => { const v = fontStyle === 'italic' ? 'normal' : 'italic'; setFontStyle(v); apply({ fontStyle: v }) }}
                  className={`px-2 py-1 rounded text-xs italic border ${fontStyle === 'italic' ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600'}`}
                >I</button>
                {(['left', 'center', 'right'] as const).map(a => (
                  <button key={a}
                    onClick={() => { setTextAlign(a); apply({ textAlign: a }) }}
                    className={`px-2 py-1 rounded text-xs border ${textAlign === a ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600'}`}
                  >{a === 'left' ? '≡' : a === 'center' ? '≡' : '≡'}{a === 'left' ? '←' : a === 'center' ? '↔' : '→'}</button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Fill */}
        {!isText && (
          <section>
            <Label>채우기 색상</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={fill}
                onChange={e => { setFill(e.target.value); apply({ fill: e.target.value }) }}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
              <span className="text-xs text-gray-500">{fill.toUpperCase()}</span>
              <button onClick={() => { setFill('transparent'); apply({ fill: 'transparent' }) }}
                className="ml-auto text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-2 py-0.5 rounded">
                투명
              </button>
            </div>
          </section>
        )}

        {/* Stroke */}
        <section>
          <Label>테두리</Label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={stroke === 'null' || !stroke ? '#000000' : stroke}
              onChange={e => { setStroke(e.target.value); apply({ stroke: e.target.value }) }}
              className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
            <input type="number" value={strokeWidth} min={0} max={20}
              onChange={e => { const v = Number(e.target.value); setStrokeWidth(v); apply({ strokeWidth: v }) }}
              className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center" />
            <span className="text-xs text-gray-400">px</span>
          </div>
        </section>

        {/* Opacity */}
        <section>
          <Label>투명도 <span className="text-gray-400">{opacity}%</span></Label>
          <input type="range" min={0} max={100} value={opacity}
            onChange={e => { const v = Number(e.target.value); setOpacity(v); apply({ opacity: v / 100 }) }}
            className="w-full mt-1 accent-indigo-600" />
        </section>

        {/* Layer order */}
        <section>
          <Label>레이어 순서</Label>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {[
              { label: '맨 앞으로', action: bringToFront },
              { label: '맨 뒤로',   action: sendToBack },
              { label: '앞으로',   action: bringForward },
              { label: '뒤로',     action: sendBackward },
            ].map(b => (
              <button key={b.label} onClick={b.action}
                className="text-xs py-1.5 px-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                {b.label}
              </button>
            ))}
          </div>
        </section>

        {/* Position */}
        <section>
          <Label>위치 / 크기</Label>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {(['left','top','width','height'] as const).map(prop => (
              <div key={prop} className="flex items-center gap-1">
                <span className="text-xs text-gray-400 w-8">{prop === 'left' ? 'X' : prop === 'top' ? 'Y' : prop === 'width' ? 'W' : 'H'}</span>
                <input type="number"
                  value={Math.round(obj[prop] ?? 0)}
                  onChange={e => { const v = Number(e.target.value); apply({ [prop]: v }) }}
                  className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs" />
              </div>
            ))}
          </div>
        </section>

        {/* Delete */}
        <button onClick={deleteObj}
          className="w-full py-2 rounded-xl text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-colors mt-2">
          🗑 삭제
        </button>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-600">{children}</p>
}
