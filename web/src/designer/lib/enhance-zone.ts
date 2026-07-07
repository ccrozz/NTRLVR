import type { CanopyLayer } from "../../types";
import { matchesFruitTreesGroup } from "@lib/food-forest-groups";
import type { DesignerStateCode } from "@lib/designer-states";
import { canvasPlantsInZone } from "./zone-plant-groups";
import type { CanvasPlant } from "../types";
import type { WorkspaceZone } from "../types/workspace";

const UNDERSTORY_LAYERS: CanopyLayer[] = [
  "Shrub",
  "Herbaceous",
  "Groundcover",
  "Vine",
  "Understory",
];

export function countFruitTreesInZone(
  plants: CanvasPlant[],
  zone: WorkspaceZone,
  zones: WorkspaceZone[],
  stateCode: DesignerStateCode,
): number {
  return canvasPlantsInZone(plants, zone, zones).filter((p) =>
    matchesFruitTreesGroup(
      { category: p.category, is_edible: true },
      stateCode,
    ),
  ).length;
}

export function countUnderstoryInZone(
  plants: CanvasPlant[],
  zone: WorkspaceZone,
  zones: WorkspaceZone[],
): number {
  return canvasPlantsInZone(plants, zone, zones).filter((p) =>
    UNDERSTORY_LAYERS.includes(p.canopy_layer),
  ).length;
}

/** True when a bed has fruit trees but few understory layers — good enhance candidate. */
export function zoneNeedsGuildEnhance(
  plants: CanvasPlant[],
  zone: WorkspaceZone,
  zones: WorkspaceZone[],
  stateCode: DesignerStateCode,
): boolean {
  const inZone = canvasPlantsInZone(plants, zone, zones);
  if (!inZone.length) return false;
  const trees = countFruitTreesInZone(plants, zone, zones, stateCode);
  if (trees < 1) return false;
  const understory = countUnderstoryInZone(plants, zone, zones);
  return understory < Math.max(2, trees);
}

export function pickEnhanceZone(
  plants: CanvasPlant[],
  zones: WorkspaceZone[],
  activeZoneId: string | null,
  stateCode: DesignerStateCode,
): WorkspaceZone | null {
  if (activeZoneId) {
    const active = zones.find((z) => z.id === activeZoneId);
    if (active && zoneNeedsGuildEnhance(plants, active, zones, stateCode)) {
      return active;
    }
  }
  for (const zone of zones) {
    if (zoneNeedsGuildEnhance(plants, zone, zones, stateCode)) return zone;
  }
  if (zones.length === 1 && canvasPlantsInZone(plants, zones[0]!, zones).length) {
    return zones[0]!;
  }
  return activeZoneId
    ? (zones.find((z) => z.id === activeZoneId) ?? null)
    : (zones[0] ?? null);
}
