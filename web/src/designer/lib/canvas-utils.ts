/** Pixels per foot on the designer canvas. */
export const PX_PER_FOOT = 20;

/** Plant photos on the 2D canvas (sidebar/detail still use images). */
export const CANVAS_USE_PLANT_PHOTOS = false;

/** Max radius for the center marker so wide-spread plants don't obscure neighbors. */
export const CANVAS_MAX_CENTER_DOT_PX = 20;

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
