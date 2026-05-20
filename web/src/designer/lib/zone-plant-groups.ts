import { plantBelongsToZone } from "./zone-geometry";
import { zoneSummary } from "./zone-summary";
import type { CanvasPlant } from "../types";
import type { WorkspaceZone } from "../types/workspace";

export function canvasPlantsInZone(
  plants: CanvasPlant[],
  zone: WorkspaceZone,
  zones: WorkspaceZone[],
): CanvasPlant[] {
  return plants.filter((p) => plantBelongsToZone(p, zone, zones));
}

export function countCanvasPlantsInZone(
  plants: CanvasPlant[],
  zone: WorkspaceZone,
  zones: WorkspaceZone[],
): number {
  return canvasPlantsInZone(plants, zone, zones).length;
}

export function zoneHasPlants(
  plants: CanvasPlant[],
  zone: WorkspaceZone,
  zones: WorkspaceZone[],
): boolean {
  return countCanvasPlantsInZone(plants, zone, zones) > 0;
}

export function plantIdsPlacedInZone(
  plants: CanvasPlant[],
  zone: WorkspaceZone,
  zones: WorkspaceZone[],
): Set<string> {
  return new Set(
    canvasPlantsInZone(plants, zone, zones).map((p) => p.plantId),
  );
}

export function zoneTabLabel(zone: WorkspaceZone, plantCount: number): string {
  const short = zone.name?.trim() || "Space";
  return plantCount > 0 ? `${short} (${plantCount})` : short;
}

export function zoneTabSublabel(zone: WorkspaceZone): string {
  return zoneSummary(zone);
}
