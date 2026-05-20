import type { LayoutPlacement } from "./auto-populate";
import { feetToPx, getZoneBounds } from "./zone-geometry";
import { defaultZoneAnchor } from "../store/workspace-slice";
import type { WorkspaceZone } from "../types/workspace";

const ZONE_GAP_FT = 4;

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function zoneBoundsPx(zone: WorkspaceZone): Bounds | null {
  return getZoneBounds(zone);
}

function rectsOverlap(a: Bounds, b: Bounds, gapPx: number): boolean {
  return !(
    a.maxX + gapPx < b.minX ||
    a.minX - gapPx > b.maxX ||
    a.maxY + gapPx < b.minY ||
    a.minY - gapPx > b.maxY
  );
}

/** Place a new bed in open canvas space — never on top of existing zones. */
export function nextZoneAnchor(
  existing: WorkspaceZone[],
  widthFeet: number,
  heightFeet: number,
): { x: number; y: number } {
  const gap = feetToPx(ZONE_GAP_FT);
  const w = feetToPx(widthFeet);
  const h = feetToPx(heightFeet);

  const occupied = existing
    .map(zoneBoundsPx)
    .filter((b): b is Bounds => b != null);

  if (!occupied.length) {
    return defaultZoneAnchor(widthFeet, heightFeet);
  }

  const startX = Math.min(...occupied.map((b) => b.minX));
  const startY = Math.min(...occupied.map((b) => b.minY));

  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      const x = startX + col * (w + gap);
      const y = startY + row * (h + gap);
      const candidate: Bounds = {
        minX: x,
        minY: y,
        maxX: x + w,
        maxY: y + h,
      };
      const hits = occupied.some((b) => rectsOverlap(candidate, b, 0));
      if (!hits) {
        return { x: Math.max(40, x), y: Math.max(40, y) };
      }
    }
  }

  const maxY = Math.max(...occupied.map((b) => b.maxY));
  const maxX = Math.max(...occupied.map((b) => b.maxX));
  return { x: Math.max(40, maxX + gap), y: Math.max(40, maxY + gap) };
}

export function anchorZone(
  zone: WorkspaceZone,
  anchor: { x: number; y: number },
): WorkspaceZone {
  switch (zone.shape) {
    case "rectangle":
      return { ...zone, x: anchor.x, y: anchor.y };
    case "circle": {
      const r = feetToPx((zone.radiusFeet ?? 10) / 2);
      return { ...zone, cx: anchor.x + r, cy: anchor.y + r };
    }
    case "polygon":
      if (!zone.points?.length) return zone;
      const b = getZoneBounds(zone);
      if (!b) return zone;
      const dx = anchor.x - b.minX;
      const dy = anchor.y - b.minY;
      return {
        ...zone,
        points: zone.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      };
    default:
      return zone;
  }
}

export function zonePlacementOffset(
  zone: WorkspaceZone,
  targetAnchor: { x: number; y: number },
): { dx: number; dy: number } {
  const w = zone.widthFeet ?? 20;
  const h = zone.heightFeet ?? 20;
  const base = defaultZoneAnchor(w, h);
  const b = getZoneBounds(zone);
  const originX =
    zone.shape === "rectangle" ? (zone.x ?? base.x) : (b?.minX ?? base.x);
  const originY =
    zone.shape === "rectangle" ? (zone.y ?? base.y) : (b?.minY ?? base.y);
  return { dx: targetAnchor.x - originX, dy: targetAnchor.y - originY };
}

export function offsetPlacements(
  placements: LayoutPlacement[],
  dx: number,
  dy: number,
): LayoutPlacement[] {
  if (dx === 0 && dy === 0) return placements;
  return placements.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
}
