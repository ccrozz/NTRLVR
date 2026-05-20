import { PX_PER_FOOT } from "./canvas-utils";
import { feetToPx } from "./zone-geometry";
import type { WorkspaceZone } from "../types/workspace";

/** Visible world rectangle in stage coordinates (matches plant x/y space). */
export type StageViewBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function visibleStageBounds(
  viewportW: number,
  viewportH: number,
  stagePos: { x: number; y: number },
  zoom: number,
  paddingFeet = 30,
): StageViewBounds {
  const pad = paddingFeet * PX_PER_FOOT;
  const x = -stagePos.x / zoom - pad;
  const y = -stagePos.y / zoom - pad;
  return {
    x,
    y,
    width: viewportW / zoom + pad * 2,
    height: viewportH / zoom + pad * 2,
  };
}

export function boundsAroundPoints(
  points: { x: number; y: number }[],
  paddingFeet: number,
): StageViewBounds | null {
  if (!points.length) return null;
  const pad = paddingFeet * PX_PER_FOOT;
  let minX = points[0]!.x;
  let maxX = points[0]!.x;
  let minY = points[0]!.y;
  let maxY = points[0]!.y;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

export function zoneOutlinePoints(zone: WorkspaceZone): { x: number; y: number }[] {
  switch (zone.shape) {
    case "rectangle": {
      if (
        zone.x == null ||
        zone.y == null ||
        zone.widthFeet == null ||
        zone.heightFeet == null
      ) {
        return [];
      }
      const w = feetToPx(zone.widthFeet);
      const h = feetToPx(zone.heightFeet);
      return [
        { x: zone.x, y: zone.y },
        { x: zone.x + w, y: zone.y },
        { x: zone.x + w, y: zone.y + h },
        { x: zone.x, y: zone.y + h },
      ];
    }
    case "circle": {
      if (zone.cx == null || zone.cy == null || zone.radiusFeet == null) {
        return [];
      }
      const r = feetToPx(zone.radiusFeet);
      return [
        { x: zone.cx - r, y: zone.cy - r },
        { x: zone.cx + r, y: zone.cy - r },
        { x: zone.cx + r, y: zone.cy + r },
        { x: zone.cx - r, y: zone.cy + r },
      ];
    }
    case "polygon":
      return zone.points ?? [];
    default:
      return [];
  }
}

export function stagePosToCenterBounds(
  bounds: StageViewBounds,
  viewportW: number,
  viewportH: number,
  zoom: number,
): { x: number; y: number } {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  return {
    x: viewportW / 2 - cx * zoom,
    y: viewportH / 2 - cy * zoom,
  };
}

export function contentLayoutBounds(
  zones: WorkspaceZone[],
  plants: { x: number; y: number }[],
  paddingFeet = 10,
): StageViewBounds {
  const points: { x: number; y: number }[] = [];
  for (const z of zones) points.push(...zoneOutlinePoints(z));
  for (const p of plants) points.push({ x: p.x, y: p.y });
  return (
    boundsAroundPoints(points, paddingFeet) ?? {
      x: 280,
      y: 180,
      width: 320,
      height: 280,
    }
  );
}
