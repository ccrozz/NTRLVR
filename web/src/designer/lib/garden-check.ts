import { designerStateConfig, type DesignerStateCode } from "@lib/designer-states";
import { US_GROWING_ZONES, usdaSubzoneSortKey } from "@lib/growing-zones";
import { radiusPx } from "./canvas-utils";
import { plantOutsideOwnedZone } from "./zone-geometry";
import { zoneAreaSqFt } from "./zone-geometry";
import { zoneNeedsGuildEnhance } from "./enhance-zone";
import type { CanvasPlant } from "../types";
import type { WorkspaceZone } from "../types/workspace";

/** Screen-relative compass points, clockwise from the top of the plan. */
export const SCREEN_DIRECTIONS = [
  "up",
  "up-right",
  "right",
  "down-right",
  "down",
  "down-left",
  "left",
  "up-left",
] as const;

export type ScreenDirection = (typeof SCREEN_DIRECTIONS)[number];

const DIRECTION_LABELS: Record<ScreenDirection, string> = {
  up: "top",
  "up-right": "top right",
  right: "right",
  "down-right": "bottom right",
  down: "bottom",
  "down-left": "bottom left",
  left: "left",
  "up-left": "top left",
};

/** Clockwise rotation (degrees) of a screen direction, 0 = up. */
export function directionAngle(dir: ScreenDirection): number {
  return SCREEN_DIRECTIONS.indexOf(dir) * 45;
}

export function directionLabel(dir: ScreenDirection): string {
  return DIRECTION_LABELS[dir];
}

/**
 * The sun sets in the west, so marking the sunset edge fixes the compass:
 * north sits a quarter turn clockwise from it.
 */
export function northFromSunset(sunset: ScreenDirection): ScreenDirection {
  const idx = SCREEN_DIRECTIONS.indexOf(sunset);
  return SCREEN_DIRECTIONS[(idx + 2) % SCREEN_DIRECTIONS.length]!;
}

export function isScreenDirection(value: string): value is ScreenDirection {
  return (SCREEN_DIRECTIONS as readonly string[]).includes(value);
}

/** Hardiness subzones worth offering for a state's catalog band. */
export function zoneChoicesForState(state: DesignerStateCode): string[] {
  const config = designerStateConfig(state);
  const floor = usdaSubzoneSortKey(config?.minCatalogZone ?? "8b");
  if (floor == null) return [...US_GROWING_ZONES];
  return US_GROWING_ZONES.filter((zone) => {
    const key = usdaSubzoneSortKey(zone);
    return key != null && key >= floor && key <= floor + 6;
  });
}

export function defaultZoneForState(state: DesignerStateCode): string {
  return designerStateConfig(state)?.defaultZone ?? "10a";
}

export type GardenCheckSeverity = "ok" | "warn" | "todo";

export type GardenCheckItem = {
  id: string;
  label: string;
  detail: string;
  severity: GardenCheckSeverity;
};

/** Canopies this fraction closer than their combined spread count as crowded. */
const CROWDING_FACTOR = 0.62;

export function countCrowdedPairs(plants: CanvasPlant[]): number {
  let crowded = 0;
  for (let i = 0; i < plants.length; i++) {
    for (let j = i + 1; j < plants.length; j++) {
      const a = plants[i]!;
      const b = plants[j]!;
      const combined =
        radiusPx(a.canvas_radius_feet, 1) + radiusPx(b.canvas_radius_feet, 1);
      const gap = Math.hypot(a.x - b.x, a.y - b.y);
      if (gap < combined * CROWDING_FACTOR) crowded += 1;
    }
  }
  return crowded;
}

export type GardenCheckInput = {
  plants: CanvasPlant[];
  zones: WorkspaceZone[];
  state: DesignerStateCode;
  sunsetDirection: ScreenDirection | null;
};

export function buildGardenChecks({
  plants,
  zones,
  state,
  sunsetDirection,
}: GardenCheckInput): GardenCheckItem[] {
  const items: GardenCheckItem[] = [];

  if (!zones.length) {
    items.push({
      id: "beds",
      label: "Draw a bed",
      detail: "Beds set the real footprint we measure spacing against.",
      severity: "todo",
    });
  } else {
    const area = zones.reduce((sum, z) => sum + (zoneAreaSqFt(z) ?? 0), 0);
    items.push({
      id: "beds",
      label: `${zones.length} ${zones.length === 1 ? "bed" : "beds"} drawn`,
      detail: area > 0 ? `About ${Math.round(area).toLocaleString()} sq ft of growing space.` : "Bed outlines are set.",
      severity: "ok",
    });
  }

  if (!plants.length) {
    items.push({
      id: "plants",
      label: "Add your first plant",
      detail: "Spacing, layers and sun are checked as soon as plants land.",
      severity: "todo",
    });
    return items;
  }

  const crowded = countCrowdedPairs(plants);
  items.push(
    crowded > 0
      ? {
          id: "spacing",
          label: `${crowded} crowded ${crowded === 1 ? "pair" : "pairs"}`,
          detail: "Mature canopies overlap heavily — drag them apart or swap in a smaller species.",
          severity: "warn",
        }
      : {
          id: "spacing",
          label: "Spacing looks good",
          detail: "No canopies are fighting for the same space at maturity.",
          severity: "ok",
        },
  );

  const strays = plants.filter((p) => plantOutsideOwnedZone(p, zones)).length;
  if (strays > 0) {
    items.push({
      id: "placement",
      label: `${strays} ${strays === 1 ? "plant" : "plants"} outside a bed`,
      detail: "Drag them back inside so bed plans and quantities stay accurate.",
      severity: "warn",
    });
  }

  const invasive = plants.filter((p) => p.is_invasive_in_florida).length;
  if (invasive > 0) {
    items.push({
      id: "invasive",
      label: `${invasive} flagged as invasive`,
      detail: "These spread aggressively in Florida — consider a native substitute.",
      severity: "warn",
    });
  }

  const thinGuilds = zones.filter((z) =>
    zoneNeedsGuildEnhance(plants, z, zones, state),
  ).length;
  if (thinGuilds > 0) {
    items.push({
      id: "layers",
      label: `${thinGuilds} ${thinGuilds === 1 ? "bed needs" : "beds need"} understory`,
      detail: "Trees are in, but shrubs, herbs and groundcover are still sparse.",
      severity: "warn",
    });
  }

  if (!sunsetDirection) {
    items.push({
      id: "sun",
      label: "Set your sun direction",
      detail: "Shade and sun checks follow the sunset edge you mark.",
      severity: "todo",
    });
  }

  return items;
}
