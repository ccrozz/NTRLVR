import { feetToPx, getZoneBounds, pxToFeet } from "./zone-geometry";
import type { WorkspaceZone } from "../types/workspace";

export const MIN_ZONE_FEET = 6;

export type ZoneResizeCorner = "nw" | "ne" | "sw" | "se";

const minPx = () => feetToPx(MIN_ZONE_FEET);

export function resizeRectangleZone(
  origin: WorkspaceZone,
  corner: ZoneResizeCorner,
  pointerX: number,
  pointerY: number,
): WorkspaceZone | null {
  if (
    origin.shape !== "rectangle" ||
    origin.x == null ||
    origin.y == null
  ) {
    return null;
  }

  const ox = origin.x;
  const oy = origin.y;
  const ow = feetToPx(origin.widthFeet ?? MIN_ZONE_FEET);
  const oh = feetToPx(origin.heightFeet ?? MIN_ZONE_FEET);
  const min = minPx();

  let x = ox;
  let y = oy;
  let w = ow;
  let h = oh;

  switch (corner) {
    case "se":
      w = Math.max(min, pointerX - ox);
      h = Math.max(min, pointerY - oy);
      break;
    case "sw":
      w = Math.max(min, ox + ow - pointerX);
      h = Math.max(min, pointerY - oy);
      x = ox + ow - w;
      break;
    case "ne":
      w = Math.max(min, pointerX - ox);
      h = Math.max(min, oy + oh - pointerY);
      y = oy + oh - h;
      break;
    case "nw":
      w = Math.max(min, ox + ow - pointerX);
      h = Math.max(min, oy + oh - pointerY);
      x = ox + ow - w;
      y = oy + oh - h;
      break;
  }

  return {
    ...origin,
    x,
    y,
    widthFeet: Math.round(pxToFeet(w) * 10) / 10,
    heightFeet: Math.round(pxToFeet(h) * 10) / 10,
  };
}

export function scalePlantsToZoneBounds(
  plants: { canvasId: string; x: number; y: number }[],
  oldBounds: { minX: number; minY: number; maxX: number; maxY: number },
  newBounds: { minX: number; minY: number; maxX: number; maxY: number },
): { canvasId: string; x: number; y: number }[] {
  const oldW = oldBounds.maxX - oldBounds.minX;
  const oldH = oldBounds.maxY - oldBounds.minY;
  if (oldW < 1 || oldH < 1) return plants;

  const newW = newBounds.maxX - newBounds.minX;
  const newH = newBounds.maxY - newBounds.minY;

  return plants.map((p) => ({
    canvasId: p.canvasId,
    x: newBounds.minX + ((p.x - oldBounds.minX) / oldW) * newW,
    y: newBounds.minY + ((p.y - oldBounds.minY) / oldH) * newH,
  }));
}

/** Konva cursor for each corner handle. */
export function resizeCornerCursor(corner: ZoneResizeCorner): string {
  switch (corner) {
    case "nw":
    case "se":
      return "nwse-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
  }
}

export function cornerPosition(
  zone: WorkspaceZone,
  corner: ZoneResizeCorner,
): { x: number; y: number } | null {
  const bounds = getZoneBounds(zone);
  if (!bounds) return null;
  switch (corner) {
    case "nw":
      return { x: bounds.minX, y: bounds.minY };
    case "ne":
      return { x: bounds.maxX, y: bounds.minY };
    case "sw":
      return { x: bounds.minX, y: bounds.maxY };
    case "se":
      return { x: bounds.maxX, y: bounds.maxY };
  }
}
