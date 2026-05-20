import { PX_PER_FOOT } from "./canvas-utils";
import type { WorkspaceZone } from "../types/workspace";

export function feetToPx(feet: number): number {
  return feet * PX_PER_FOOT;
}

export function pxToFeet(px: number): number {
  return px / PX_PER_FOOT;
}

/** Inner layout bounds in stage pixels (inset from zone edges). */
export function zoneLayoutBoundsPx(
  zone: WorkspaceZone,
  marginFeet = 1.5,
): { x0: number; y0: number; x1: number; y1: number } {
  const margin = Math.max(0.5, marginFeet) * PX_PER_FOOT;

  if (zone.shape === "rectangle") {
    if (zone.x == null || zone.y == null) {
      return { x0: 40, y0: 40, x1: 440, y1: 340 };
    }
    const w = feetToPx(zone.widthFeet ?? 20);
    const h = feetToPx(zone.heightFeet ?? 20);
    return {
      x0: zone.x + margin,
      y0: zone.y + margin,
      x1: zone.x + w - margin,
      y1: zone.y + h - margin,
    };
  }

  if (zone.shape === "circle") {
    if (zone.cx == null || zone.cy == null || zone.radiusFeet == null) {
      return { x0: 40, y0: 40, x1: 440, y1: 340 };
    }
    const r = feetToPx(zone.radiusFeet);
    return {
      x0: zone.cx - r + margin,
      y0: zone.cy - r + margin,
      x1: zone.cx + r - margin,
      y1: zone.cy + r - margin,
    };
  }

  if (zone.shape === "polygon" && zone.points && zone.points.length >= 3) {
    const xs = zone.points.map((p) => p.x);
    const ys = zone.points.map((p) => p.y);
    return {
      x0: Math.min(...xs) + margin,
      y0: Math.min(...ys) + margin,
      x1: Math.max(...xs) - margin,
      y1: Math.max(...ys) - margin,
    };
  }

  return { x0: 40, y0: 40, x1: 440, y1: 340 };
}

/** Foot dimensions for layout API + plant count (from bounds or stored dims). */
export function zoneLayoutDimensions(zone: WorkspaceZone): {
  widthFeet: number;
  heightFeet: number;
  areaSqFt: number;
} {
  const area = zoneAreaSqFt(zone) ?? 400;
  if (
    zone.shape === "rectangle" &&
    zone.widthFeet != null &&
    zone.heightFeet != null
  ) {
    return {
      widthFeet: zone.widthFeet,
      heightFeet: zone.heightFeet,
      areaSqFt: area,
    };
  }
  const b = zoneLayoutBoundsPx(zone, 0);
  const widthFeet = Math.max(6, Math.round((b.x1 - b.x0) / PX_PER_FOOT));
  const heightFeet = Math.max(6, Math.round((b.y1 - b.y0) / PX_PER_FOOT));
  return { widthFeet, heightFeet, areaSqFt: area };
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
