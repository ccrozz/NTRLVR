/** Snap to close polygon when clicking near the first corner (stage px). */
export const DRAW_CLOSE_SNAP_PX = 18;

export function nearFirstDrawPoint(
  points: { x: number; y: number }[],
  x: number,
  y: number,
  thresholdPx = DRAW_CLOSE_SNAP_PX,
): boolean {
  if (points.length < 3) return false;
  const first = points[0]!;
  return Math.hypot(first.x - x, first.y - y) <= thresholdPx;
}
