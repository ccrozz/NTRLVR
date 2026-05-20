import { PX_PER_FOOT, radiusPx } from "./canvas-utils";

export type PlacementHost = {
  canvasId: string;
  x: number;
  y: number;
  canvas_radius_feet: number;
};

export type PlacementPlant = {
  canvasId: string;
  plantId: string;
  x: number;
  y: number;
  canvas_radius_feet?: number;
};

/** Matches the suggestion ring drawn around a host on the canvas. */
export function companionRingPx(hostRadiusFeet: number): number {
  return radiusPx(hostRadiusFeet, 1) * 0.72;
}

export function companionSlotAngle(index: number, total: number): number {
  return (2 * Math.PI * index) / Math.max(total, 1) - Math.PI / 2;
}

export function companionSlotPosition(
  host: Pick<PlacementHost, "x" | "y" | "canvas_radius_feet">,
  slotIndex: number,
  totalSlots: number,
): { x: number; y: number } {
  const ring = companionRingPx(host.canvas_radius_feet);
  const angle = companionSlotAngle(slotIndex, totalSlots);
  return {
    x: host.x + Math.cos(angle) * ring,
    y: host.y + Math.sin(angle) * ring,
  };
}

const NEAR_HOST_MAX_FT = 28;

/** True if this catalog plant is already on the canvas near the host. */
export function isCompanionPlacedNearHost(
  host: PlacementHost,
  plantId: string,
  canvasPlants: PlacementPlant[],
): boolean {
  const maxPx = NEAR_HOST_MAX_FT * PX_PER_FOOT;
  return canvasPlants.some(
    (p) =>
      p.plantId === plantId &&
      p.canvasId !== host.canvasId &&
      Math.hypot(p.x - host.x, p.y - host.y) <= maxPx,
  );
}

/**
 * Pick a position on the companion ring for this slot (panel order).
 * Tries the preferred index first, then other open slots on the ring.
 */
export function resolveCompanionPlacement(
  host: PlacementHost,
  companionRadiusFeet: number,
  preferredSlotIndex: number,
  totalSlots: number,
  canvasPlants: PlacementPlant[],
): { x: number; y: number } {
  const tolerance = PX_PER_FOOT * 2.5;
  const tryOrder = [
    preferredSlotIndex,
    ...Array.from({ length: totalSlots }, (_, i) => i).filter(
      (i) => i !== preferredSlotIndex,
    ),
  ];

  for (const idx of tryOrder) {
    const { x, y } = companionSlotPosition(host, idx, totalSlots);
    const occupied = canvasPlants.some((p) => {
      if (p.canvasId === host.canvasId) return false;
      return Math.hypot(p.x - x, p.y - y) < tolerance;
    });
    if (!occupied) return { x, y };
  }

  const ring = companionRingPx(host.canvas_radius_feet);
  const angle = companionSlotAngle(preferredSlotIndex, totalSlots);
  const nudge = (companionRadiusFeet + 2) * PX_PER_FOOT;
  return {
    x: host.x + Math.cos(angle) * (ring + nudge),
    y: host.y + Math.sin(angle) * (ring + nudge),
  };
}
