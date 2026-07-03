'use client'

import { useEffect, useState, useCallback } from 'react'
import { CANVAS_W, CANVAS_H } from '@/lib/slide-to-fabric'

interface Props {
  selectedObject: any | null
  canvas: any | null
  onSave: () => void
  onDuplicate: () => void
}

export default function ObjectPropertiesPanel({ selectedObject: obj, canvas, onSave, onDuplicate }: Props) {
  const [fill, setFill]             = useState('#4F46E5')
  const [stroke, setStroke]         = useState('#4F46E5')
  const [strokeWidth, setStrokeWidth] = useState(0)
  const [opacity, setOpacity]       = useState(100)
  const [fontSize, setFontSize]     = useState(24)
  const [fontWeight, setFontWeight] = useState<'normal'|'bold'>('normal')
  const [fontStyle, setFontStyle]   = useState<'normal'|'italic'>('normal')
  const [underline, setUnderline]   = useState(false)
  const [textAlign, setTextAlign]   = useState<'left'|'center'|'right'>('left')
  const [textColor, setTextColor]   = useState('#1e293b')
  const [lineHeight, setLineHeight] = useState(1.2)
  const [shadowOn, setShadowOn]     = useState(false)
  const [shadowColor, setShadowColor] = useState('#00000066')
  const [shadowBlur, setShadowBlur] = useState(10)

  const isText = obj?.type === 'textbox' || obj?.type === 'i-text'

  useEffect(() => {
    if (!obj) return
    setFill(typeof obj.fill === 'string' ? obj.fill : '#ffffff')
    setStroke(obj.stroke || '#000000')
    setStrokeWidth(obj.strokeWidth || 0)
    setOpacity(Math.round((obj.opacity ?? 1) * 100))
    setShadowOn(!!obj.shadow)
    if (obj.shadow) {
      setShadowColor(obj.shadow.color || '#00000066')
      setShadowBlur(obj.shadow.blur || 10)
    }
    if (isText) {
      setFontSize(obj.fontSize || 24)
      setFontWeight(obj.fontWeight === 'bold' ? 'bold' : 'normal')
      setFontStyle(obj.fontStyle === 'italic' ? 'italic' : 'normal')
      setUnderline(!!obj.underline)
      setTextAlign(obj.textAlign || 'left')
      setTextColor(typeof obj.fill === 'string' ? obj.fill : '#1e293b')
      setLineHeight(obj.lineHeight || 1.2)
    }
  }, [obj, isText])

  const apply = useCallback((props: object) => {
    if (!obj || !canvas) return
    obj.set(props)
    canvas.requestRenderAll()
    onSave()
  }, [obj, canvas, onSave])

  // ── Alignment helpers ────────────────────────────────
  const alignH = (pos: 'left'|'center'|'right') => {
    if (!obj || !canvas) return
    const w = obj.getScaledWidth()
    obj.set({ left: pos === 'left' ? 0 : pos === 'center' ? (CANVAS_W - w) / 2 : CANVAS_W - w })
    canvas.requestRenderAll(); onSave()
  }
  const alignV = (pos: 'top'|'middle'|'bottom') => {
    if (!obj || !canvas) return
    const h = obj.getScaledHeight()
    obj.set({ top: pos === 'top' ? 0 : pos === 'middle' ? (CANVAS_H - h) / 2 : CANVAS_H - h })
    canvas.requestRenderAll(); onSave()
  }

  // ── Layer order ──────────────────────────────────────
  const layer = (action: 'front'|'back'|'fwd'|'bwd') => {
    if (!canvas || !obj) return
    if (action === 'front') canvas.bringObjectToFront(obj)
    else if (action === 'back') canvas.sendObjectToBack(obj)
    else if (action === 'fwd') canvas.bringObjectForward(obj)
    else canvas.sendObjectBackwards(obj)
    canvas.requestRenderAll(); onSave()
  }

  // ── Shadow ───────────────────────────────────────────
  const applyShadow = (on: boolean, color = shadowColor, blur = shadowBlur) => {
    if (!obj || !canvas) return
    obj.set({ shadow: on ? { color, blur, offsetX: 3, offsetY: 3 } : null })
    canvas.requestRenderAll(); onSave()
  }

  const deleteObj = () => {
    if (!canvas || !obj) return
    if (obj.type === 'activeSelection') obj.forEachObject((o: any) => canvas.remove(o))
    else canvas.remove(obj)
    canvas.discardActiveObject(); canvas.requestRenderAll(); onSave()
  }

  if (!obj) return (
    <div className="w-60 flex-shrink-0 bg-white border-l border-gray-100 flex flex-col items-center justify-center text-center gap-2 p-4">
      <span className="text-3xl opacity-30">↖</span>
      <p className="text-xs text-gray-400">오브젝트를 선택하면<br />속성이 표시됩니다</p>
    </div>
  )

  return (
    <div className="w-60 flex-shrink-0 bg-white border-l border-gray-100 overflow-y-auto text-sm">
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">속성</span>
        <span className="text-xs text-gray-400 capitalize">{obj.type}</span>
      </div>

      <div className="p-3 space-y-4">

        {/* ── 정렬 ─────────────────────────────────── */}
        <section>
          <SLabel>정렬</SLabel>
          <div className="grid grid-cols-3 gap-1 mt-1">
            {([['left','◧','왼쪽'],['center','▣','가운데'],['right','◨','오른쪽']] as const).map(([p,icon,label]) => (
              <button key={p} title={label} onClick={() => alignH(p)} className="py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 text-base transition-colors">{icon}</button>
            ))}
            {([['top','⬆','위'],['middle','↕','중앙'],['bottom','⬇','아래']] as const).map(([p,icon,label]) => (
              <button key={p} title={label} onClick={() => alignV(p)} className="py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 text-base transition-colors">{icon}</button>
            ))}
          </div>
        </section>

        {/* ── 텍스트 ───────────────────────────────── */}
        {isText && (
          <section>
            <SLabel>텍스트</SLabel>
            <div className="space-y-2 mt-1">
              <Row label="색상">
                <input type="color" value={textColor}
                  onChange={e => { setTextColor(e.target.value); apply({ fill: e.target.value }) }}
                  className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
              </Row>
              <Row label="크기">
                <input type="number" value={fontSize} min={8} max={300}
                  onChange={e => { const v=+e.target.value; setFontSize(v); apply({ fontSize: v }) }}
                  className="w-16 border border-gray-200 rounded px-1.5 py-0.5 text-xs text-center" />
              </Row>
              <Row label="행간">
                <input type="range" min={0.8} max={3} step={0.1} value={lineHeight}
                  onChange={e => { const v=+e.target.value; setLineHeight(v); apply({ lineHeight: v }) }}
                  className="w-24 accent-indigo-600" />
                <span className="text-xs text-gray-400 w-6 text-right">{lineHeight.toFixed(1)}</span>
              </Row>
              <div className="flex items-center gap-1">
                <Btn active={fontWeight==='bold'} onClick={() => { const v=fontWeight==='bold'?'normal':'bold'; setFontWeight(v); apply({ fontWeight: v }) }}>B</Btn>
                <Btn active={fontStyle==='italic'} onClick={() => { const v=fontStyle==='italic'?'normal':'italic'; setFontStyle(v); apply({ fontStyle: v }) }}><i>I</i></Btn>
                <Btn active={underline} onClick={() => { const v=!underline; setUnderline(v); apply({ underline: v }) }}><u>U</u></Btn>
                {(['left','center','right'] as const).map(a => (
                  <Btn key={a} active={textAlign===a} onClick={() => { setTextAlign(a); apply({ textAlign: a }) }}>
                    {a==='left'?'⬤≡':a==='center'?'≡':'>≡'}
                  </Btn>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 채우기 ───────────────────────────────── */}
        {!isText && (
          <section>
            <SLabel>채우기</SLabel>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={fill === 'transparent' ? '#ffffff' : fill}
                onChange={e => { setFill(e.target.value); apply({ fill: e.target.value }) }}
                className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
              <span className="text-xs text-gray-500 flex-1">{fill}</span>
              <button onClick={() => { setFill('transparent'); apply({ fill: 'transparent' }) }}
                className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-2 py-0.5 rounded">없음</button>
            </div>
          </section>
        )}

        {/* ── 테두리 ───────────────────────────────── */}
        <section>
          <SLabel>테두리</SLabel>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={stroke || '#000000'}
              onChange={e => { setStroke(e.target.value); apply({ stroke: e.target.value }) }}
              className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
            <input type="number" value={strokeWidth} min={0} max={30}
              onChange={e => { const v=+e.target.value; setStrokeWidth(v); apply({ strokeWidth: v }) }}
              className="w-12 border border-gray-200 rounded px-1.5 py-0.5 text-xs text-center" />
            <span className="text-xs text-gray-400">px</span>
          </div>
        </section>

        {/* ── 그림자 ───────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between">
            <SLabel>그림자</SLabel>
            <button onClick={() => { const v=!shadowOn; setShadowOn(v); applyShadow(v) }}
              className={`w-9 h-5 rounded-full transition-colors ${shadowOn ? 'bg-indigo-600' : 'bg-gray-200'} relative`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${shadowOn ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {shadowOn && (
            <div className="space-y-1.5 mt-1.5">
              <Row label="색상">
                <input type="color" value={shadowColor}
                  onChange={e => { setShadowColor(e.target.value); applyShadow(true, e.target.value, shadowBlur) }}
                  className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
              </Row>
              <Row label="흐림">
                <input type="range" min={0} max={50} value={shadowBlur}
                  onChange={e => { const v=+e.target.value; setShadowBlur(v); applyShadow(true, shadowColor, v) }}
                  className="w-24 accent-indigo-600" />
                <span className="text-xs text-gray-400 w-5 text-right">{shadowBlur}</span>
              </Row>
            </div>
          )}
        </section>

        {/* ── 투명도 ───────────────────────────────── */}
        <section>
          <SLabel>투명도 <span className="text-gray-400 font-normal">{opacity}%</span></SLabel>
          <input type="range" min={0} max={100} value={opacity}
            onChange={e => { const v=+e.target.value; setOpacity(v); apply({ opacity: v/100 }) }}
            className="w-full mt-1 accent-indigo-600" />
        </section>

        {/* ── 위치 / 크기 ──────────────────────────── */}
        <section>
          <SLabel>위치 / 크기</SLabel>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {(['left','top','width','height'] as const).map(prop => (
              <div key={prop} className="flex items-center gap-1">
                <span className="text-xs text-gray-400 w-6">
                  {prop==='left'?'X':prop==='top'?'Y':prop==='width'?'W':'H'}
                </span>
                <input type="number"
                  value={Math.round(prop === 'width' ? (obj.getScaledWidth?.() ?? obj[prop] ?? 0) : prop === 'height' ? (obj.getScaledHeight?.() ?? obj[prop] ?? 0) : (obj[prop] ?? 0))}
                  onChange={e => apply({ [prop]: +e.target.value })}
                  className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-xs text-gray-400 w-8">각도</span>
            <input type="number" value={Math.round(obj.angle ?? 0)}
              onChange={e => apply({ angle: +e.target.value })}
              className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs" />
            <span className="text-xs text-gray-400">°</span>
          </div>
        </section>

        {/* ── 레이어 ───────────────────────────────── */}
        <section>
          <SLabel>레이어</SLabel>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {([['맨 앞','front'],['맨 뒤','back'],['앞으로','fwd'],['뒤로','bwd']] as const).map(([label, act]) => (
              <button key={act} onClick={() => layer(act)}
                className="py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs transition-colors">{label}</button>
            ))}
          </div>
        </section>

        {/* ── 액션 ─────────────────────────────────── */}
        <div className="flex gap-1.5">
          <button onClick={onDuplicate}
            className="flex-1 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition-colors">
            ⧉ 복제
          </button>
          <button onClick={deleteObj}
            className="flex-1 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium transition-colors">
            🗑 삭제
          </button>
        </div>

      </div>
    </div>
  )
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-600 mb-0.5">{children}</p>
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-10">{label}</span>
      <div className="flex items-center gap-1 flex-1">{children}</div>
    </div>
  )
}
function Btn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded text-xs border transition-colors ${active ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
      {children}
    </button>
  )
}
