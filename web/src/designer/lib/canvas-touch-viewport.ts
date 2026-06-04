import { clampStagePos } from "./clamp-stage-pos";
import {
  type CanvasViewportState,
  ZOOM_MAX,
  ZOOM_MIN,
} from "./canvas-wheel";

type PointerPoint = { x: number; y: number };

function pointerDistance(a: PointerPoint, b: PointerPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointerMidpoint(a: PointerPoint, b: PointerPoint): PointerPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Pinch-to-zoom and one-finger pan for touch pointers on the canvas wrap.
 * Mouse/trackpad keeps using wheel + Konva drag on desktop.
 */
export type CanvasTouchViewportOptions = {
  /** Let Konva handle this pointer (e.g. plant tap / drag). */
  shouldIgnorePointer?: (e: PointerEvent) => boolean;
};

export function bindCanvasTouchViewport(
  root: HTMLElement,
  getState: () => CanvasViewportState,
  apply: (next: CanvasViewportState) => void,
  options: CanvasTouchViewportOptions = {},
): () => void {
  const { shouldIgnorePointer } = options;
  const active = new Map<number, PointerPoint>();

  let pinchBase: {
    distance: number;
    zoom: number;
    stagePos: { x: number; y: number };
    midX: number;
    midY: number;
  } | null = null;

  let panBase: {
    pointerId: number;
    stagePos: { x: number; y: number };
    clientX: number;
    clientY: number;
  } | null = null;

  function viewportRect() {
    return root.getBoundingClientRect();
  }

  function syncGestureBases() {
    const pts = [...active.values()];
    if (pts.length >= 2) {
      const { zoom, stagePos } = getState();
      const mid = pointerMidpoint(pts[0]!, pts[1]!);
      const rect = viewportRect();
      pinchBase = {
        distance: pointerDistance(pts[0]!, pts[1]!),
        zoom,
        stagePos: { ...stagePos },
        midX: mid.x - rect.left,
        midY: mid.y - rect.top,
      };
      panBase = null;
      return;
    }
    pinchBase = null;
    if (pts.length === 1) {
      const entry = [...active.entries()][0]!;
      const { stagePos } = getState();
      panBase = {
        pointerId: entry[0],
        stagePos: { ...stagePos },
        clientX: entry[1].x,
        clientY: entry[1].y,
      };
    } else {
      panBase = null;
    }
  }

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === "mouse") return;
    if (document.querySelector(".designer-plant-row--dragging")) return;
    if (shouldIgnorePointer?.(e)) return;
    active.set(e.pointerId, { x: e.clientX, y: e.clientY });
    syncGestureBases();
  }

  function onPointerMove(e: PointerEvent) {
    if (!active.has(e.pointerId)) return;
    active.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (active.size >= 2 && pinchBase) {
      e.preventDefault();
      const pts = [...active.values()];
      if (pts.length < 2) return;
      const dist = pointerDistance(pts[0]!, pts[1]!);
      if (pinchBase.distance < 8) return;
      const ratio = dist / pinchBase.distance;
      const newZoom = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, pinchBase.zoom * ratio),
      );
      const mid = pointerMidpoint(pts[0]!, pts[1]!);
      const rect = viewportRect();
      const pointerX = mid.x - rect.left;
      const pointerY = mid.y - rect.top;
      const stageX =
        (pinchBase.midX - pinchBase.stagePos.x) / pinchBase.zoom;
      const stageY =
        (pinchBase.midY - pinchBase.stagePos.y) / pinchBase.zoom;
      apply({
        zoom: newZoom,
        stagePos: clampStagePos({
          x: pointerX - stageX * newZoom,
          y: pointerY - stageY * newZoom,
        }),
      });
      return;
    }

    if (active.size === 1 && panBase && e.pointerId === panBase.pointerId) {
      const dx = e.clientX - panBase.clientX;
      const dy = e.clientY - panBase.clientY;
      const panThreshold = 8;
      if (Math.hypot(dx, dy) < panThreshold) return;
      try {
        root.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      e.preventDefault();
      apply({
        zoom: getState().zoom,
        stagePos: clampStagePos({
          x: panBase.stagePos.x + dx,
          y: panBase.stagePos.y + dy,
        }),
      });
    }
  }

  function onPointerUp(e: PointerEvent) {
    active.delete(e.pointerId);
    syncGestureBases();
  }

  const captureOpts = { capture: true };

  root.addEventListener("pointerdown", onPointerDown, captureOpts);
  root.addEventListener("pointermove", onPointerMove, { passive: false, capture: true });
  root.addEventListener("pointerup", onPointerUp, captureOpts);
  root.addEventListener("pointercancel", onPointerUp, captureOpts);

  return () => {
    root.removeEventListener("pointerdown", onPointerDown, captureOpts);
    root.removeEventListener("pointermove", onPointerMove, captureOpts);
    root.removeEventListener("pointerup", onPointerUp, captureOpts);
    root.removeEventListener("pointercancel", onPointerUp, captureOpts);
  };
}
