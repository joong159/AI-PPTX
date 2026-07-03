import type { Slide } from './types'
import { buildFabricObjects, CANVAS_W, CANVAS_H } from './slide-to-fabric'

// Renders a slide to a PNG dataURL using a temporary off-screen fabric Canvas.
// The canvas is appended to the DOM temporarily so system fonts are available.
export async function renderSlideToDataUrl(
  slide: Slide,
  accent: string,
  bg: string,
  multiplier = 1,
): Promise<string> {
  const fab = await import('fabric')
  const { Canvas } = fab

  const el = document.createElement('canvas')
  el.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;'
  document.body.appendChild(el)

  try {
    const canvas = new Canvas(el, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: bg || '#F8F9FF',
      enableRetinaScaling: false,
      renderOnAddRemove: false,
    })

    if (slide.fabricState) {
      await canvas.loadFromJSON(JSON.parse(slide.fabricState))
    } else {
      const objs = buildFabricObjects(fab, slide, accent, bg || '#F8F9FF')
      objs.forEach((o: any) => canvas.add(o))
    }

    canvas.renderAll()

    // Wait one paint cycle so fonts are measured and rendered correctly
    await new Promise<void>(resolve => requestAnimationFrame(() => { canvas.renderAll(); resolve() }))

    const dataUrl = canvas.toDataURL({ format: 'png', multiplier })
    canvas.dispose()
    return dataUrl
  } finally {
    if (document.body.contains(el)) document.body.removeChild(el)
  }
}
