import { clampStagePos } from "./clamp-stage-pos";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;

export type CanvasViewportState = {
  zoom: number;
  stagePos: { x: number; y: number };
};

/** Pinch-to-zoom (ctrl/meta + wheel) or mouse wheel; otherwise pan the canvas. */
export function wheelIntent(e: WheelEvent): "zoom" | "pan" {
  if (e.ctrlKey || e.metaKey) return "zoom";
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) return "zoom";
  return "pan";
}

function zoomFactor(e: WheelEvent): number {
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return Math.pow(1.1, -e.deltaY / 53);
  }
  return Math.exp(-e.deltaY * 0.008);
}

/**
 * Handle wheel on the canvas viewport. Returns true if the event was consumed.
 * Uses non-passive listener so the page does not scroll while zooming.
 */
export function handleCanvasWheel(
  e: WheelEvent,
  root: HTMLElement,
  state: CanvasViewportState,
  apply: (next: CanvasViewportState) => void,
): boolean {
  if (e.deltaX === 0 && e.deltaY === 0) return false;

  const rect = root.getBoundingClientRect();
  const { zoom, stagePos } = state;

  if (wheelIntent(e) === "zoom") {
    e.preventDefault();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;
    const stageX = (pointerX - stagePos.x) / zoom;
    const stageY = (pointerY - stagePos.y) / zoom;
    const newZoom = Math.min(
      ZOOM_MAX,
      Math.max(ZOOM_MIN, zoom * zoomFactor(e)),
    );
    apply({
      zoom: newZoom,
      stagePos: clampStagePos({
        x: pointerX - stageX * newZoom,
        y: pointerY - stageY * newZoom,
      }),
    });
    return true;
  }

  e.preventDefault();
  apply({
    zoom,
    stagePos: clampStagePos({
      x: stagePos.x - e.deltaX,
      y: stagePos.y - e.deltaY,
    }),
  });
  return true;
}
