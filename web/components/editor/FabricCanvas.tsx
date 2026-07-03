'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Slide } from '@/lib/types'
import type { DesignSettings } from '@/lib/design-settings'
import { buildFabricObjects, CANVAS_W, CANVAS_H } from '@/lib/slide-to-fabric'

export type CanvasTool = 'select' | 'text' | 'rect' | 'circle' | 'triangle' | 'line' | 'image'

export interface CanvasHandle {
  undo: () => void
  redo: () => void
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

export default function FabricCanvas({
  slide, design, accentColor, bgColor,
  activeTool, onToolReset, onChange, onSelectionChange, onReady,
}: Props) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<{ canvas: any; fab: any } | null>(null)
  const historyRef = useRef<string[]>([])
  const historyIdxRef = useRef(-1)
  const [scale, setScale] = useState(1)
  const activeToolRef = useRef(activeTool)
  activeToolRef.current = activeTool

  // Resize observer — scale canvas to fit container
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

  // Save state (called after any change)
  const doSave = useCallback((canvas: any) => {
    const json = JSON.stringify(canvas.toJSON(['data']))
    onChange({ ...slide, fabricState: json })
    const hist = historyRef.current.slice(0, historyIdxRef.current + 1)
    hist.push(json)
    historyRef.current = hist.slice(-50)  // keep last 50 states
    historyIdxRef.current = historyRef.current.length - 1
  }, [slide, onChange])

  // Initialize / re-initialize fabric canvas when slide changes
  useEffect(() => {
    const el = canvasElRef.current
    if (!el) return

    let canvas: any
    let keyHandler: ((e: KeyboardEvent) => void) | null = null

    import('fabric').then((fab) => {
      const { Canvas, Rect, Circle, Triangle, Line, Textbox, FabricImage } = fab

      canvas = new Canvas(el, {
        width: CANVAS_W,
        height: CANVAS_H,
        backgroundColor: bgColor || '#F8F9FF',
        preserveObjectStacking: true,
        selection: true,
      })

      fabricRef.current = { canvas, fab }

      // ── Load slide content ──────────────────────────────
      const load = async () => {
        if (slide.fabricState) {
          const parsed = JSON.parse(slide.fabricState)
          await canvas.loadFromJSON(parsed)
          canvas.renderAll()
        } else {
          const objs = buildFabricObjects(fab, slide, accentColor, bgColor || '#F8F9FF')
          objs.forEach((o: any) => canvas.add(o))
          canvas.renderAll()
          // auto-save initial state
          const json = JSON.stringify(canvas.toJSON(['data']))
          onChange({ ...slide, fabricState: json })
          historyRef.current = [json]
          historyIdxRef.current = 0
        }
      }
      load()

      // ── Selection ───────────────────────────────────────
      canvas.on('selection:created', () => onSelectionChange(canvas.getActiveObject()))
      canvas.on('selection:updated', () => onSelectionChange(canvas.getActiveObject()))
      canvas.on('selection:cleared', () => onSelectionChange(null))

      // ── Save on modification ────────────────────────────
      canvas.on('object:modified', () => doSave(canvas))

      // ── Tool: add shape on mouse:down ───────────────────
      canvas.on('mouse:down', (opt: any) => {
        const tool = activeToolRef.current
        if (tool === 'select') return

        const ptr = canvas.getScenePoint(opt.e)

        let obj: any = null

        if (tool === 'text') {
          obj = new Textbox('텍스트', {
            left: ptr.x - 100, top: ptr.y - 20, width: 200,
            fontSize: 28, fill: '#1e293b', fontFamily: 'Arial, sans-serif', editable: true,
          })
        } else if (tool === 'rect') {
          obj = new Rect({
            left: ptr.x - 80, top: ptr.y - 50, width: 160, height: 100,
            fill: accentColor + '33', stroke: accentColor, strokeWidth: 2,
          })
        } else if (tool === 'circle') {
          obj = new Circle({
            left: ptr.x - 60, top: ptr.y - 60, radius: 60,
            fill: accentColor + '33', stroke: accentColor, strokeWidth: 2,
          })
        } else if (tool === 'triangle') {
          obj = new Triangle({
            left: ptr.x - 70, top: ptr.y - 60, width: 140, height: 120,
            fill: accentColor + '33', stroke: accentColor, strokeWidth: 2,
          })
        } else if (tool === 'line') {
          obj = new Line([ptr.x - 100, ptr.y, ptr.x + 100, ptr.y], {
            stroke: accentColor, strokeWidth: 3,
          })
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

      // ── Keyboard shortcuts ───────────────────────────────
      const undo = () => {
        if (historyIdxRef.current <= 0) return
        historyIdxRef.current--
        const json = historyRef.current[historyIdxRef.current]
        if (json) canvas.loadFromJSON(JSON.parse(json)).then(() => canvas.renderAll())
      }
      const redo = () => {
        if (historyIdxRef.current >= historyRef.current.length - 1) return
        historyIdxRef.current++
        const json = historyRef.current[historyIdxRef.current]
        if (json) canvas.loadFromJSON(JSON.parse(json)).then(() => canvas.renderAll())
      }
      const addImage = (file: File) => {
        const url = URL.createObjectURL(file)
        FabricImage.fromURL(url).then((img: any) => {
          img.scaleToWidth(Math.min(400, CANVAS_W / 2))
          img.set({ left: CANVAS_W / 2 - 200, top: CANVAS_H / 2 - img.getScaledHeight() / 2 })
          canvas.add(img)
          canvas.setActiveObject(img)
          canvas.renderAll()
          doSave(canvas)
        })
      }

      // Expose handle to parent
      onReady({
        undo,
        redo,
        addImage,
        getCanvas: () => fabricRef.current?.canvas ?? null,
        saveState: () => doSave(canvas),
      })

      keyHandler = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo() }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const active = canvas.getActiveObject()
          if (!active) return
          if ((active as any).isEditing) return
          if ((active as any).data?.role === 'bg') return  // don't delete background
          canvas.remove(active)
          canvas.discardActiveObject()
          canvas.renderAll()
          doSave(canvas)
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
  }, [slide._id, !slide.fabricState && slide.title])  // re-init when slide changes or when fabricState is cleared

  // Update canvas cursor based on active tool (without re-init)
  useEffect(() => {
    const fc = fabricRef.current?.canvas
    if (!fc) return
    const cursorMap: Record<CanvasTool, string> = {
      select: 'default', text: 'text', rect: 'crosshair',
      circle: 'crosshair', triangle: 'crosshair', line: 'crosshair', image: 'default',
    }
    fc.defaultCursor = cursorMap[activeTool] || 'default'
    fc.hoverCursor = activeTool === 'select' ? 'move' : cursorMap[activeTool]
  }, [activeTool])

  return (
    <div ref={containerRef} className="w-full select-none" style={{ position: 'relative' }}>
      {/* Canvas at logical size, scaled to fit container */}
      <div style={{
        width: CANVAS_W,
        height: CANVAS_H,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <canvas ref={canvasElRef} />
      </div>
      {/* Spacer for actual rendered height */}
      <div style={{ height: CANVAS_H * scale }} />
    </div>
  )
}
