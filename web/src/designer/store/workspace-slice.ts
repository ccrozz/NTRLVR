import type { WorkspaceZone } from "../types/workspace";
import { feetToPx } from "../lib/zone-geometry";

let zoneCounter = 1;

export function nextZoneName(existing: WorkspaceZone[]): string {
  const n = existing.length + 1;
  return `Zone ${n}`;
}

export function createRectangleZone(
  widthFeet: number,
  heightFeet: number,
  anchor: { x: number; y: number },
  name?: string,
): WorkspaceZone {
  return {
    id: crypto.randomUUID(),
    name: name ?? `Zone ${zoneCounter++}`,
    shape: "rectangle",
    x: anchor.x,
    y: anchor.y,
    widthFeet,
    heightFeet,
  };
}

export function createCircleZone(
  diameterFeet: number,
  center: { x: number; y: number },
  name?: string,
): WorkspaceZone {
  return {
    id: crypto.randomUUID(),
    name: name ?? `Zone ${zoneCounter++}`,
    shape: "circle",
    cx: center.x,
    cy: center.y,
    radiusFeet: diameterFeet / 2,
  };
}

export function createPolygonZone(
  points: { x: number; y: number }[],
  name?: string,
): WorkspaceZone {
  return {
    id: crypto.randomUUID(),
    name: name ?? `Zone ${zoneCounter++}`,
    shape: "polygon",
    points,
  };
}

/** Default placement: centered in a 800×600 logical canvas area */
export function defaultZoneAnchor(
  widthFeet: number,
  heightFeet: number,
): { x: number; y: number } {
  const w = feetToPx(widthFeet);
  const h = feetToPx(heightFeet);
  return { x: Math.max(40, 400 - w / 2), y: Math.max(40, 300 - h / 2) };
}

export function defaultCircleCenter(_diameterFeet: number): { x: number; y: number } {
  return { x: 400, y: 300 };
}
