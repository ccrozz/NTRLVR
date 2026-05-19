import { PX_PER_FOOT } from "./canvas-utils";
import type { WorkspaceZone } from "../types/workspace";

export function feetToPx(feet: number): number {
  return feet * PX_PER_FOOT;
}

export function pxToFeet(px: number): number {
  return px / PX_PER_FOOT;
}

export function zoneAreaSqFt(zone: WorkspaceZone): number | null {
  switch (zone.shape) {
    case "rectangle":
      if (zone.widthFeet == null || zone.heightFeet == null) return null;
      return zone.widthFeet * zone.heightFeet;
    case "circle":
      if (zone.radiusFeet == null) return null;
      return Math.PI * zone.radiusFeet * zone.radiusFeet;
    case "polygon": {
      if (!zone.points || zone.points.length < 3) return null;
      let area = 0;
      const pts = zone.points;
      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        area += pts[i]!.x * pts[j]!.y - pts[j]!.x * pts[i]!.y;
      }
      return Math.abs(area / 2) / (PX_PER_FOOT * PX_PER_FOOT);
    }
    default:
      return null;
  }
}

function pointInPolygon(x: number, y: number, points: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i]!.x;
    const yi = points[i]!.y;
    const xj = points[j]!.x;
    const yj = points[j]!.y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function pointInZone(x: number, y: number, zone: WorkspaceZone): boolean {
  switch (zone.shape) {
    case "rectangle": {
      if (
        zone.x == null ||
        zone.y == null ||
        zone.widthFeet == null ||
        zone.heightFeet == null
      ) {
        return false;
      }
      const w = feetToPx(zone.widthFeet);
      const h = feetToPx(zone.heightFeet);
      return x >= zone.x && x <= zone.x + w && y >= zone.y && y <= zone.y + h;
    }
    case "circle": {
      if (zone.cx == null || zone.cy == null || zone.radiusFeet == null) {
        return false;
      }
      const r = feetToPx(zone.radiusFeet);
      const dx = x - zone.cx;
      const dy = y - zone.cy;
      return dx * dx + dy * dy <= r * r;
    }
    case "polygon":
      return zone.points ? pointInPolygon(x, y, zone.points) : false;
    default:
      return false;
  }
}

/** Soft rule: plant center must lie inside at least one zone (if any zones exist). */
export function plantInsideZones(
  x: number,
  y: number,
  zones: WorkspaceZone[],
): boolean {
  if (zones.length === 0) return true;
  return zones.some((z) => pointInZone(x, y, z));
}

export function plantInsideZone(
  x: number,
  y: number,
  zone: WorkspaceZone,
): boolean {
  return pointInZone(x, y, zone);
}

export function translateZone(
  zone: WorkspaceZone,
  dx: number,
  dy: number,
): WorkspaceZone {
  switch (zone.shape) {
    case "rectangle":
      return {
        ...zone,
        x: (zone.x ?? 0) + dx,
        y: (zone.y ?? 0) + dy,
      };
    case "circle":
      return {
        ...zone,
        cx: (zone.cx ?? 0) + dx,
        cy: (zone.cy ?? 0) + dy,
      };
    case "polygon":
      return {
        ...zone,
        points: zone.points?.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      };
    default:
      return zone;
  }
}

export function getZoneBounds(
  zone: WorkspaceZone,
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  switch (zone.shape) {
    case "rectangle": {
      if (
        zone.x == null ||
        zone.y == null ||
        zone.widthFeet == null ||
        zone.heightFeet == null
      ) {
        return null;
      }
      const w = feetToPx(zone.widthFeet);
      const h = feetToPx(zone.heightFeet);
      return { minX: zone.x, minY: zone.y, maxX: zone.x + w, maxY: zone.y + h };
    }
    case "circle": {
      if (zone.cx == null || zone.cy == null || zone.radiusFeet == null) {
        return null;
      }
      const r = feetToPx(zone.radiusFeet);
      return {
        minX: zone.cx - r,
        minY: zone.cy - r,
        maxX: zone.cx + r,
        maxY: zone.cy + r,
      };
    }
    case "polygon": {
      if (!zone.points?.length) return null;
      const xs = zone.points.map((p) => p.x);
      const ys = zone.points.map((p) => p.y);
      return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
      };
    }
    default:
      return null;
  }
}
