import { EDGE_RULER_LEFT, EDGE_RULER_TOP } from "./canvas-ruler-insets";

/** Keep world origin (0,0) at or inside the ruler insets — no negative foot coords. */
export function clampStagePos(pos: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return {
    x: Math.min(EDGE_RULER_LEFT, pos.x),
    y: Math.min(EDGE_RULER_TOP, pos.y),
  };
}
