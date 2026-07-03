'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Slide } from '@/lib/types'
import type { DesignSettings } from '@/lib/design-settings'
import { buildFabricObjects, CANVAS_W, CANVAS_H } from '@/lib/slide-to-fabric'

export type CanvasTool =
  | 'select' | 'text'
  | 'rect' | 'circle' | 'triangle' | 'line'
  | 'star' | 'arrow' | 'diamond' | 'pentagon'
  | 'image'

export interface CanvasHandle {
  undo: () => void
  redo: () => void
  duplicate: () => void
  copyObj: () => void
  pasteObj: () => void
  selectAll: () => void
  groupSel: () => void
  ungroupSel: () => void
  addImage: (file: File) => void
  getCanvas: () => any | null
  saveState: () => void
}

interface Props {
  slide: Slide
  design: DesignSettings
  accentColor: string
  bgColor: string
  activeTool: CanvasTool
  onToolReset: () => void
  onChange: (updated: Slide) => void
  onSelectionChange: (obj: any | null) => void
  onReady: (handle: CanvasHandle) => void
}

// SVG-path helpers for extra shapes
function starPath(cx: number, cy: number, r: number) {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const rad = (Math.PI / 5) * i - Math.PI / 2
    const ri = i % 2 === 0 ? r : r * 0.45
    pts.push(`${i === 0 ? 'M' : 'L'} ${cx + ri * Math.cos(rad)} ${cy + ri * Math.sin(rad)}`)
  }
  return pts.join(' ') + ' Z'
}
function arrowPath() { return 'M 0 35 L 70 35 L 70 15 L 110 55 L 70 95 L 70 75 L 0 75 Z' }
function diamondPath() { return 'M 60 0 L 120 60 L 60 120 L 0 60 Z' }
function pentagonPath() {
  const pts: string[] = []
  for (let i = 0; i < 5; i++) {
    const rad = (Math.PI * 2 / 5) * i - Math.PI / 2
    pts.push(`${i === 0 ? 'M' : 'L'} ${60 + 60 * Math.cos(rad)} ${60 + 60 * Math.sin(rad)}`)
  }
  return pts.join(' ') + ' Z'
}

export default function FabricCanvas({
  slide, accentColor, bgColor,
  activeTool, onToolReset, onChange, onSelectionChange, onReady,
}: Props) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<{ canvas: any; fab: any } | null>(null)
  const historyRef = useRef<string[]>([])
  const historyIdxRef = useRef(-1)
  const clipboardRef = useRef<any | null>(null)
  const [scale, setScale] = useState(1)
  const activeToolRef = useRef(activeTool)
  activeToolRef.current = activeTool

  const slideRef = useRef(slide)
  slideRef.current = slide
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      if (w > 0) setScale(w / CANVAS_W)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const doSave = useCallback((canvas: any) => {
    const json = JSON.stringify(canvas.toJSON(['data']))
    onChangeRef.current({ ...slideRef.current, fabricState: json })
    const hist = historyRef.current.slice(0, historyIdxRef.current + 1)
    hist.push(json)
    historyRef.current = hist.slice(-50)
    historyIdxRef.current = historyRef.current.length - 1
  }, [])

  useEffect(() => {
    const el = canvasElRef.current
    if (!el) return
    let canvas: any
    let keyHandler: ((e: KeyboardEvent) => void) | null = null

    import('fabric').then((fab) => {
      const { Canvas, Rect, Circle, Triangle, Line, Textbox, Path, FabricImage, ActiveSelection } = fab

      canvas = new Canvas(el, {
        width: CANVAS_W,
        height: CANVAS_H,
        backgroundColor: bgColor || '#F8F9FF',
        preserveObjectStacking: true,
        selection: true,
      })
      fabricRef.current = { canvas, fab }

      // ── Load ──────────────────────────────────────────────
      const load = async () => {
        if (slide.fabricState) {
          await canvas.loadFromJSON(JSON.parse(slide.fabricState))
          canvas.renderAll()
        } else {
          const objs = buildFabricObjects(fab, slide, accentColor, bgColor || '#F8F9FF')
          objs.forEach((o: any) => canvas.add(o))
          canvas.renderAll()
          const json = JSON.stringify(canvas.toJSON(['data']))
          onChange({ ...slide, fabricState: json })
          historyRef.current = [json]
          historyIdxRef.current = 0
        }
      }
      load()

      // ── Selection events ────────────────────────────────
      canvas.on('selection:created', () => onSelectionChange(canvas.getActiveObject()))
      canvas.on('selection:updated', () => onSelectionChange(canvas.getActiveObject()))
      canvas.on('selection:cleared', () => onSelectionChange(null))
      canvas.on('object:modified', () => doSave(canvas))

      // ── Add shape on click ─────────────────────────────
      canvas.on('mouse:down', (opt: any) => {
        const tool = activeToolRef.current
        if (tool === 'select') return
        const ptr = canvas.getScenePoint(opt.e)
        let obj: any = null

        const shapeOpts = { fill: accentColor + '33', stroke: accentColor, strokeWidth: 2 }

        if (tool === 'text') {
          obj = new Textbox('텍스트', { left: ptr.x - 100, top: ptr.y - 20, width: 200, fontSize: 28, fill: '#1e293b', fontFamily: 'Arial, sans-serif' })
        } else if (tool === 'rect') {
          obj = new Rect({ left: ptr.x - 80, top: ptr.y - 50, width: 160, height: 100, ...shapeOpts })
        } else if (tool === 'circle') {
          obj = new Circle({ left: ptr.x - 60, top: ptr.y - 60, radius: 60, ...shapeOpts })
        } else if (tool === 'triangle') {
          obj = new Triangle({ left: ptr.x - 70, top: ptr.y - 60, width: 140, height: 120, ...shapeOpts })
        } else if (tool === 'line') {
          obj = new Line([ptr.x - 100, ptr.y, ptr.x + 100, ptr.y], { stroke: accentColor, strokeWidth: 3 })
        } else if (tool === 'star') {
          obj = new Path(starPath(60, 60, 60), { left: ptr.x - 60, top: ptr.y - 60, ...shapeOpts })
        } else if (tool === 'arrow') {
          obj = new Path(arrowPath(), { left: ptr.x - 55, top: ptr.y - 55, ...shapeOpts })
        } else if (tool === 'diamond') {
          obj = new Path(diamondPath(), { left: ptr.x - 60, top: ptr.y - 60, ...shapeOpts })
        } else if (tool === 'pentagon') {
          obj = new Path(pentagonPath(), { left: ptr.x - 60, top: ptr.y - 60, ...shapeOpts })
        }

        if (obj) {
          canvas.add(obj)
          canvas.setActiveObject(obj)
          canvas.renderAll()
          if (tool === 'text') obj.enterEditing()
          doSave(canvas)
          onToolReset()
        }
      })

      // ── Actions ────────────────────────────────────────
      const undo = () => {
        if (historyIdxRef.current <= 0) return
        historyIdxRef.current--
        canvas.loadFromJSON(JSON.parse(historyRef.current[historyIdxRef.current])).then(() => canvas.renderAll())
      }
      const redo = () => {
        if (historyIdxRef.current >= historyRef.current.length - 1) return
        historyIdxRef.current++
        canvas.loadFromJSON(JSON.parse(historyRef.current[historyIdxRef.current])).then(() => canvas.renderAll())
      }
      const duplicate = () => {
        const active = canvas.getActiveObject()
        if (!active) return
        active.clone().then((c: any) => {
          c.set({ left: c.left + 24, top: c.top + 24 })
          canvas.add(c); canvas.setActiveObject(c); canvas.requestRenderAll(); doSave(canvas)
        })
      }
      const copyObj = () => {
        const active = canvas.getActiveObject()
        if (active) active.clone().then((c: any) => { clipboardRef.current = c })
      }
      const pasteObj = () => {
        const cb = clipboardRef.current
        if (!cb) return
        cb.clone().then((c: any) => {
          canvas.discardActiveObject()
          c.set({ left: c.left + 24, top: c.top + 24, evented: true })
          if (c.type === 'activeSelection') {
            c.canvas = canvas
            c.forEachObject((o: any) => canvas.add(o))
            c.setCoords()
          } else {
            canvas.add(c)
          }
          clipboardRef.current.top += 24
          clipboardRef.current.left += 24
          canvas.setActiveObject(c)
          canvas.requestRenderAll()
          doSave(canvas)
        })
      }
      const selectAll = () => {
        const all = canvas.getObjects().filter((o: any) => o.selectable !== false)
        if (!all.length) return
        const sel = new ActiveSelection(all, { canvas })
        canvas.setActiveObject(sel)
        canvas.requestRenderAll()
      }
      const groupSel = () => {
        const active = canvas.getActiveObject()
        if (!active || active.type !== 'activeSelection') return
        active.toGroup()
        canvas.requestRenderAll()
        doSave(canvas)
      }
      const ungroupSel = () => {
        const active = canvas.getActiveObject()
        if (!active || active.type !== 'group') return
        active.toActiveSelection()
        canvas.requestRenderAll()
        doSave(canvas)
      }
      const addImage = (file: File) => {
        const url = URL.createObjectURL(file)
        FabricImage.fromURL(url).then((img: any) => {
          img.scaleToWidth(Math.min(500, CANVAS_W / 2))
          img.set({ left: CANVAS_W / 2 - img.getScaledWidth() / 2, top: CANVAS_H / 2 - img.getScaledHeight() / 2 })
          canvas.add(img); canvas.setActiveObject(img); canvas.renderAll(); doSave(canvas)
        })
      }

      onReady({ undo, redo, duplicate, copyObj, pasteObj, selectAll, groupSel, ungroupSel, addImage, getCanvas: () => fabricRef.current?.canvas ?? null, saveState: () => doSave(canvas) })

      // ── Keyboard ───────────────────────────────────────
      keyHandler = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        const ctrl = e.ctrlKey || e.metaKey
        if (ctrl && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return }
        if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); return }
        if (ctrl && e.key === 'c') { e.preventDefault(); copyObj(); return }
        if (ctrl && e.key === 'v') { e.preventDefault(); pasteObj(); return }
        if (ctrl && e.key === 'd') { e.preventDefault(); duplicate(); return }
        if (ctrl && e.key === 'a') { e.preventDefault(); selectAll(); return }
        if (ctrl && !e.shiftKey && e.key === 'g') { e.preventDefault(); groupSel(); return }
        if (ctrl && e.shiftKey && e.key === 'G') { e.preventDefault(); ungroupSel(); return }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const active = canvas.getActiveObject()
          if (!active || (active as any).isEditing || (active as any).data?.role === 'bg') return
          if (active.type === 'activeSelection') {
            (active as any).forEachObject((o: any) => canvas.remove(o))
          } else {
            canvas.remove(active)
          }
          canvas.discardActiveObject(); canvas.renderAll(); doSave(canvas)
        }
        // Arrow keys for nudge
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
          const active = canvas.getActiveObject()
          if (!active || (active as any).isEditing) return
          const d = e.shiftKey ? 10 : 1
          const dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0
          const dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0
          active.set({ left: (active.left ?? 0) + dx, top: (active.top ?? 0) + dy })
          canvas.requestRenderAll(); doSave(canvas)
        }
      }
      window.addEventListener('keydown', keyHandler)
    })

    return () => {
      if (keyHandler) window.removeEventListener('keydown', keyHandler)
      canvas?.dispose()
      fabricRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide._id, !slide.fabricState && slide.title])

  useEffect(() => {
    const fc = fabricRef.current?.canvas
    if (!fc) return
    const cur: Record<string, string> = {
      select: 'default', text: 'text',
      rect: 'crosshair', circle: 'crosshair', triangle: 'crosshair',
      line: 'crosshair', star: 'crosshair', arrow: 'crosshair',
      diamond: 'crosshair', pentagon: 'crosshair', image: 'default',
    }
    fc.defaultCursor = cur[activeTool] || 'default'
    fc.hoverCursor = activeTool === 'select' ? 'move' : (cur[activeTool] || 'default')
  }, [activeTool])

  return (
    <div ref={containerRef} className="w-full select-none" style={{ position: 'relative' }}>
      <div style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: 'top left', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', borderRadius: 4, overflow: 'hidden' }}>
        <canvas ref={canvasElRef} />
      </div>
      <div style={{ height: CANVAS_H * scale }} />
    </div>
  )
}
