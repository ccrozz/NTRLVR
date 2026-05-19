/** Pixels per foot on the designer canvas. */
export const PX_PER_FOOT = 20;

export function radiusPx(canvas_radius_feet: number, zoom = 1): number {
  return Math.max(12, canvas_radius_feet * PX_PER_FOOT * zoom);
}

export function stagePoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  stagePos: { x: number; y: number },
  zoom: number,
): { x: number; y: number } {
  return {
    x: (clientX - rect.left - stagePos.x) / zoom,
    y: (clientY - rect.top - stagePos.y) / zoom,
  };
}
