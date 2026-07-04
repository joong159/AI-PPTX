// Shared "object-fit: cover" helper for Fabric.js images.
// FabricImage defaults to originX/originY: 'center', not 'left'/'top' like every
// other Fabric shape in this codebase — callers must normalize origin before
// treating left/top as a bounding-box corner, which this helper does for them.

export interface ImageBox {
  left: number
  top: number
  width: number
  height: number
  rx?: number
}

export function applyCoverFit(fab: any, img: any, box: ImageBox) {
  const { Rect } = fab
  img.set({ originX: 'left', originY: 'top' })
  const coverScale = Math.max(box.width / img.width, box.height / img.height)
  img.scale(coverScale)
  const rounding = box.rx ?? 8
  img.set({
    left: box.left + (box.width - img.getScaledWidth()) / 2,
    top: box.top + (box.height - img.getScaledHeight()) / 2,
    clipPath: new Rect({
      left: box.left + box.width / 2,
      top: box.top + box.height / 2,
      width: box.width,
      height: box.height,
      rx: rounding,
      ry: rounding,
      originX: 'center',
      originY: 'center',
      absolutePositioned: true,
    }),
  })
}
