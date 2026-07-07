import type { CanopyLayer, PlantSummary } from "../../types";
import type { PlantListItem } from "../types";
import type { WorkspaceZone } from "../types/workspace";
import { PX_PER_FOOT } from "./canvas-utils";
import {
  pointInZone,
  zoneAreaSqFt,
  zoneLayoutBoundsPx,
  zoneLayoutDimensions,
} from "./zone-geometry";
import { createRectangleZone, defaultZoneAnchor } from "../store/workspace-slice";

import {
  DEFAULT_GARDEN_PREFERENCES,
  maxPlantsForCanvas,
  targetPlantCountFromPreferences,
  type GardenPreferences,
  type PlantingDensity,
} from "@lib/food-forest-questionnaire";
import { dedupePlantsByName, dedupeOrderedIds, normalizePlantName } from "@lib/plant-dedupe";
import { resolveCompanionPlacement } from "./companion-placement";

const API = import.meta.env.VITE_API_URL ?? "";

export type { GardenPreferences };
export { DEFAULT_GARDEN_PREFERENCES };

export type AutoPopulateAnswers = {
  hardinessZone: string;
  preferences: GardenPreferences;
  widthFeet: number;
  heightFeet: number;
  /** When set, plants are laid out inside this zone instead of creating a new rectangle. */
  existingZone?: WorkspaceZone;
};

export const SPACE_PRESETS = [
  { id: "compact", label: "10 × 10 ft", widthFeet: 10, heightFeet: 10 },
  { id: "small", label: "15 × 15 ft", widthFeet: 15, heightFeet: 15 },
  { id: "medium", label: "20 × 20 ft", widthFeet: 20, heightFeet: 20 },
  { id: "large", label: "25 × 30 ft", widthFeet: 25, heightFeet: 30 },
] as const;

const LAYER_ORDER: CanopyLayer[] = [
  "Overstory",
  "Understory",
  "Shrub",
  "Herbaceous",
  "Groundcover",
  "Vine",
];

/** Spacing footprint for packing (smaller than full mature circles on canvas). */
export function layoutRadiusFeet(plant: PlantSummary): number {
  const r = plant.canvas_radius_feet || 3;
  switch (plant.canopy_layer) {
    case "Overstory":
      return Math.min(r, 5.5);
    case "Understory":
      return Math.min(r, 4.5);
    case "Shrub":
      return Math.min(r, 3);
    case "Herbaceous":
      return Math.min(r, 2);
    case "Groundcover":
      return Math.min(r, 1.25);
    case "Vine":
      return Math.min(r, 2.5);
    default:
      return Math.min(r, 3);
  }
}

function gapFeet(layer: CanopyLayer, density?: PlantingDensity): number {
  const mult =
    density === "dense" ? 0.55 : density === "spacious" ? 1.25 : 1;
  const base =
    layer === "Groundcover" || layer === "Herbaceous"
      ? 0.85
      : layer === "Shrub"
        ? 1.2
        : 2;
  return base * mult;
}

function minCenterSpacingFeet(
  plant: PlantSummary,
  density?: PlantingDensity,
  relax = 1,
): number {
  const densityMult =
    density === "dense" ? 0.68 : density === "spacious" ? 1.15 : 0.88;
  return (
    (layoutRadiusFeet(plant) * 2.2 + gapFeet(plant.canopy_layer, density)) *
    densityMult *
    relax
  );
}

export function targetPlantCount(
  areaSqFt: number,
  preferences: GardenPreferences,
): number {
  return targetPlantCountFromPreferences(areaSqFt, preferences);
}

export async function fetchPlantsForAutoPopulate(
  zone: string,
): Promise<PlantListItem[]> {
  const fetchPage = async (params: URLSearchParams) => {
    const res = await fetch(`${API}/api/designer/plants?${params}`);
    if (!res.ok) throw new Error("Could not load plants for your zone");
    const json = await res.json();
    return (json.data ?? []) as PlantListItem[];
  };

  const base = new URLSearchParams();
  base.set("food_forest_only", "true");
  base.set("exclude_invasive", "true");
  base.set("limit", "200");

  const zoned = new URLSearchParams(base);
  zoned.set("hardiness_zone", zone);
  let pool = await fetchPage(zoned);

  if (pool.length < 50) {
    const broad = await fetchPage(base);
    const seen = new Set(pool.map((p) => p.id));
    for (const p of broad) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        pool.push(p);
      }
    }
  }

  return pool;
}

export type LayoutPlanResult = {
  plant_ids: string[];
  source: "ai" | "heuristic";
  target_count: number;
  message?: string;
};

export async function fetchLayoutPlan(
  answers: AutoPopulateAnswers,
): Promise<LayoutPlanResult> {
  const area =
    answers.existingZone != null
      ? zoneLayoutDimensions(answers.existingZone).areaSqFt
      : answers.widthFeet * answers.heightFeet;
  const target_count = targetPlantCount(area, answers.preferences);
  const res = await fetch(`${API}/api/food-forest-layout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hardiness_zone: answers.hardinessZone,
      preferences: answers.preferences,
      width_feet: answers.widthFeet,
      height_feet: answers.heightFeet,
      target_count,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? "Layout planning failed",
    );
  }
  return res.json() as Promise<LayoutPlanResult>;
}

export function pickPlantsFromIds(
  pool: PlantSummary[],
  plantIds: string[],
): PlantSummary[] {
  const byId = new Map(pool.map((p) => [p.id, p]));
  const picked: PlantSummary[] = [];
  for (const id of dedupeOrderedIds(plantIds)) {
    const p = byId.get(id);
    if (p) picked.push(p);
  }
  return dedupePlantsByName(picked).sort(
    (a, b) =>
      LAYER_ORDER.indexOf(a.canopy_layer) - LAYER_ORDER.indexOf(b.canopy_layer),
  );
}

function zoneBounds(zone: WorkspaceZone, marginFeet = 1.5) {
  return zoneLayoutBoundsPx(zone, marginFeet);
}

/** Grid of candidate points inside zone bounds (feet-based step). */
function gridCandidatePoints(
  bounds: { x0: number; y0: number; x1: number; y1: number },
  stepFt: number,
  order: "center-out" | "scan" | "shuffle" = "center-out",
): { x: number; y: number }[] {
  const step = Math.max(2, stepFt) * PX_PER_FOOT;
  const pts: { x: number; y: number }[] = [];
  let row = 0;
  for (let y = bounds.y0 + step * 0.5; y <= bounds.y1; y += step, row++) {
    const offset = row % 2 === 0 ? 0 : step * 0.5;
    for (let x = bounds.x0 + step * 0.5 + offset; x <= bounds.x1; x += step) {
      pts.push({ x, y });
    }
  }
  if (order === "scan") return pts;
  if (order === "shuffle") {
    for (let i = pts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pts[i], pts[j]] = [pts[j]!, pts[i]!];
    }
    return pts;
  }
  const cx = (bounds.x0 + bounds.x1) / 2;
  const cy = (bounds.y0 + bounds.y1) / 2;
  return pts.sort(
    (a, b) =>
      Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy),
  );
}

function placementScore(
  x: number,
  y: number,
  placed: { x: number; y: number }[],
  bounds: { x0: number; y0: number; x1: number; y1: number },
  density?: PlantingDensity,
): number {
  if (placed.length === 0) return Math.random();

  const minDist = Math.min(
    ...placed.map((p) => Math.hypot(p.x - x, p.y - y)),
  );

  if (density === "dense") {
    return minDist + Math.random() * 0.05;
  }

  const cx = (bounds.x0 + bounds.x1) / 2;
  const cy = (bounds.y0 + bounds.y1) / 2;
  const centerDist = Math.hypot(x - cx, y - cy);
  return minDist * 0.6 - centerDist * 0.08;
}

export type LayoutPlacement = { plant: PlantSummary; x: number; y: number };

export type FixedCanvasObstacle = {
  x: number;
  y: number;
  canvas_radius_feet: number;
  canopy_layer: CanopyLayer;
  plant_id?: string;
};

export type HostPlacementHint = {
  host_x: number;
  host_y: number;
  host_radius_feet: number;
  slot_index: number;
  total_slots: number;
};

function layoutStepMultiplier(density: PlantingDensity | undefined): number {
  switch (density) {
    case "spacious":
      return 1.2;
    case "dense":
      return 0.58;
    default:
      return 0.76;
  }
}

function sortPlantsForLayout(
  plants: PlantSummary[],
  density?: PlantingDensity,
): PlantSummary[] {
  return [...plants].sort((a, b) => {
    if (density === "dense" || density === "balanced") {
      const layerDiff =
        LAYER_ORDER.indexOf(b.canopy_layer) -
        LAYER_ORDER.indexOf(a.canopy_layer);
      if (layerDiff !== 0) return layerDiff;
      return layoutRadiusFeet(a) - layoutRadiusFeet(b);
    }
    const layerDiff =
      LAYER_ORDER.indexOf(a.canopy_layer) - LAYER_ORDER.indexOf(b.canopy_layer);
    if (layerDiff !== 0) return layerDiff;
    return layoutRadiusFeet(b) - layoutRadiusFeet(a);
  });
}

function collisionRadiusPx(
  plant: PlantSummary,
  density?: PlantingDensity,
): number {
  const r = layoutRadiusFeet(plant) * PX_PER_FOOT;
  return density === "dense" ? r * 0.5 : density === "balanced" ? r * 0.72 : r * 0.85;
}

function tryPlacePlants(
  zone: WorkspaceZone,
  plants: PlantSummary[],
  bounds: ReturnType<typeof zoneBounds>,
  candidates: { x: number; y: number }[],
  density: PlantingDensity | undefined,
  relax: number,
  placed: { x: number; y: number; r: number; layer: CanopyLayer }[],
  out: LayoutPlacement[],
  skipIds: Set<string>,
  skipNames: Set<string>,
): void {
  for (const plant of plants) {
    if (skipIds.has(plant.id)) continue;
    const nameKey = normalizePlantName(plant.common_name);
    if (skipNames.has(nameKey)) continue;
    const footprint = collisionRadiusPx(plant, density);
    const minDist = minCenterSpacingFeet(plant, density, relax) * PX_PER_FOOT;
    let best: { x: number; y: number } | null = null;
    let bestScore = -1;

    for (const { x, y } of candidates) {
      if (!pointInZone(x, y, zone)) continue;
      const tooClose = placed.some((p) => {
        const need = Math.min(minDist, footprint + p.r * (density === "dense" ? 0.55 : 0.85));
        return Math.hypot(p.x - x, p.y - y) < need;
      });
      if (tooClose) continue;
      const score = placementScore(x, y, placed, bounds, density);
      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }

    if (!best) continue;
    placed.push({
      x: best.x,
      y: best.y,
      r: footprint,
      layer: plant.canopy_layer,
    });
    out.push({ plant, x: best.x, y: best.y });
    skipIds.add(plant.id);
    skipNames.add(nameKey);
  }
}

export function layoutPlantsInZone(
  zone: WorkspaceZone,
  plants: PlantSummary[],
  density?: PlantingDensity,
): LayoutPlacement[] {
  const uniquePlants = dedupePlantsByName(plants);
  const marginFt = density === "dense" ? 0.75 : 1.5;
  const bounds = zoneLayoutBoundsPx(zone, marginFt);
  const area = zoneAreaSqFt(zone) ?? 400;
  const limit = Math.min(
    uniquePlants.length,
    maxPlantsForCanvas(area, density ?? "balanced"),
  );
  const sorted = sortPlantsForLayout(uniquePlants, density).slice(0, limit);

  const placed: { x: number; y: number; r: number; layer: CanopyLayer }[] = [];
  const out: LayoutPlacement[] = [];
  const avgSpacing =
    sorted.reduce((s, p) => s + minCenterSpacingFeet(p, density), 0) /
    Math.max(sorted.length, 1);
  const stepFt =
    (density === "dense"
      ? Math.max(2.2, avgSpacing * 0.42)
      : Math.max(4, avgSpacing * 0.75)) * layoutStepMultiplier(density);
  const placedIds = new Set<string>();
  const placedNames = new Set<string>();

  const passes: {
    stepMult: number;
    relax: number;
    order: "center-out" | "shuffle" | "scan";
  }[] =
    density === "dense"
      ? [
          { stepMult: 1, relax: 1, order: "shuffle" },
          { stepMult: 0.88, relax: 0.78, order: "shuffle" },
          { stepMult: 0.75, relax: 0.62, order: "scan" },
        ]
      : density === "balanced"
        ? [
            { stepMult: 1, relax: 1, order: "shuffle" },
            { stepMult: 0.9, relax: 0.82, order: "scan" },
          ]
        : [{ stepMult: 1, relax: 1, order: "center-out" }];

  for (const pass of passes) {
    const candidates = gridCandidatePoints(
      bounds,
      stepFt * pass.stepMult,
      pass.order,
    );
    tryPlacePlants(
      zone,
      sorted,
      bounds,
      candidates,
      density,
      pass.relax,
      placed,
      out,
      placedIds,
      placedNames,
    );
    if (density === "dense" && out.length >= sorted.length * 0.92) break;
    if (density === "balanced" && out.length >= sorted.length * 0.85) break;
  }

  return out;
}

function seedPlacedFromFixed(
  fixed: FixedCanvasObstacle[],
  density?: PlantingDensity,
): { x: number; y: number; r: number; layer: CanopyLayer }[] {
  return fixed.map((f) => ({
    x: f.x,
    y: f.y,
    r: collisionRadiusPx(
      {
        canvas_radius_feet: f.canvas_radius_feet,
        canopy_layer: f.canopy_layer,
      } as PlantSummary,
      density,
    ),
    layer: f.canopy_layer,
  }));
}

/** Place new plants around locked canvas positions (existing trees stay put). */
export function layoutPlantsAroundFixed(
  zone: WorkspaceZone,
  plants: PlantSummary[],
  fixed: FixedCanvasObstacle[],
  density?: PlantingDensity,
  hostHints?: Map<string, HostPlacementHint>,
): LayoutPlacement[] {
  const uniquePlants = dedupePlantsByName(plants);
  const marginFt = density === "dense" ? 0.75 : 1.5;
  const bounds = zoneLayoutBoundsPx(zone, marginFt);
  const area = zoneAreaSqFt(zone) ?? 400;
  const limit = Math.min(
    uniquePlants.length,
    maxPlantsForCanvas(area, density ?? "balanced"),
  );
  const sorted = sortPlantsForLayout(uniquePlants, density).slice(0, limit);

  const placed = seedPlacedFromFixed(fixed, density);
  const out: LayoutPlacement[] = [];
  const placedIds = new Set<string>(
    fixed.map((f) => f.plant_id).filter((id): id is string => Boolean(id)),
  );
  const placedNames = new Set<string>();

  const withHints: PlantSummary[] = [];
  const withoutHints: PlantSummary[] = [];
  for (const plant of sorted) {
    if (hostHints?.has(plant.id)) withHints.push(plant);
    else withoutHints.push(plant);
  }

  for (const plant of withHints) {
    const hint = hostHints!.get(plant.id)!;
    const host = {
      canvasId: "host",
      x: hint.host_x,
      y: hint.host_y,
      canvas_radius_feet: hint.host_radius_feet,
    };
    const pos = resolveCompanionPlacement(
      host,
      layoutRadiusFeet(plant),
      hint.slot_index,
      hint.total_slots,
      [
        ...fixed.map((f, i) => ({
          canvasId: `fixed-${i}`,
          plantId: f.plant_id ?? "",
          x: f.x,
          y: f.y,
          canvas_radius_feet: f.canvas_radius_feet,
        })),
        ...out.map((p, i) => ({
          canvasId: `new-${i}`,
          plantId: p.plant.id,
          x: p.x,
          y: p.y,
          canvas_radius_feet: p.plant.canvas_radius_feet,
        })),
      ],
    );
    if (!pointInZone(pos.x, pos.y, zone)) continue;
    placed.push({
      x: pos.x,
      y: pos.y,
      r: collisionRadiusPx(plant, density),
      layer: plant.canopy_layer,
    });
    out.push({ plant, x: pos.x, y: pos.y });
    placedIds.add(plant.id);
    placedNames.add(normalizePlantName(plant.common_name));
  }

  const avgSpacing =
    withoutHints.reduce((s, p) => s + minCenterSpacingFeet(p, density), 0) /
    Math.max(withoutHints.length, 1);
  const stepFt =
    (density === "dense"
      ? Math.max(2.2, avgSpacing * 0.42)
      : Math.max(4, avgSpacing * 0.75)) * layoutStepMultiplier(density);

  const passes: {
    stepMult: number;
    relax: number;
    order: "center-out" | "shuffle" | "scan";
  }[] =
    density === "dense"
      ? [
          { stepMult: 1, relax: 0.9, order: "shuffle" },
          { stepMult: 0.88, relax: 0.72, order: "shuffle" },
          { stepMult: 0.75, relax: 0.58, order: "scan" },
        ]
      : [
          { stepMult: 1, relax: 0.95, order: "shuffle" },
          { stepMult: 0.9, relax: 0.8, order: "scan" },
        ];

  for (const pass of passes) {
    const candidates = gridCandidatePoints(
      bounds,
      stepFt * pass.stepMult,
      pass.order,
    );
    tryPlacePlants(
      zone,
      withoutHints,
      bounds,
      candidates,
      density,
      pass.relax,
      placed,
      out,
      placedIds,
      placedNames,
    );
  }

  return out;
}

export async function runAutoPopulate(
  answers: AutoPopulateAnswers,
): Promise<{
  zone: WorkspaceZone;
  placements: LayoutPlacement[];
  meta: LayoutPlanResult;
}> {
  const pool = await fetchPlantsForAutoPopulate(answers.hardinessZone);
  const plan = await fetchLayoutPlan(answers);
  const areaSqFt =
    answers.existingZone != null
      ? zoneLayoutDimensions(answers.existingZone).areaSqFt
      : answers.widthFeet * answers.heightFeet;
  const density = answers.preferences.density ?? "balanced";
  const fitCap = maxPlantsForCanvas(areaSqFt, density);
  let picked = pickPlantsFromIds(pool, plan.plant_ids).slice(0, fitCap);

  const minPicked =
    density === "dense"
      ? Math.min(fitCap, Math.max(12, Math.floor(plan.target_count * 0.7)))
      : Math.min(fitCap, Math.max(8, Math.floor(plan.target_count * 0.75)));

  if (picked.length < minPicked) {
    const target = plan.target_count;
    const sorted = [...pool].sort(
      (a, b) => layoutRadiusFeet(a) - layoutRadiusFeet(b),
    );
    const used = new Set(picked.map((p) => p.id));
    for (const p of sorted) {
      if (picked.length >= target) break;
      if (!used.has(p.id)) {
        used.add(p.id);
        picked.push(p);
      }
    }
  }

  if (picked.length === 0) {
    throw new Error(
      "No plants matched your zone and goals. Try a different zone or add another goal.",
    );
  }

  const zone =
    answers.existingZone ??
    createRectangleZone(
      answers.widthFeet,
      answers.heightFeet,
      defaultZoneAnchor(answers.widthFeet, answers.heightFeet),
      "Your space",
    );
  const placements = layoutPlantsInZone(
    zone,
    picked,
    answers.preferences.density,
  );

  const minPlaced =
    density === "dense"
      ? 10
      : Math.min(fitCap, Math.max(6, Math.floor(areaSqFt / 14)));
  if (placements.length < minPlaced) {
    throw new Error(
      `Only ${placements.length} plants fit — try a larger bed, roomy density, or fewer large trees.`,
    );
  }

  return { zone, placements, meta: plan };
}
