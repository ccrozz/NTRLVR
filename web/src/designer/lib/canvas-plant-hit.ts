import type Konva from "konva";
import type { CanopyLayer, PlantCategory } from "../../types";
import type { CanvasPlant } from "../types";
import { CENTER_DOT_RATIO } from "./canopy-colors";
import { CANOPY_LAYER_ORDER } from "./canopy-colors";
import { CANVAS_MAX_CENTER_DOT_PX, radiusPx } from "./canvas-utils";

export const LARGE_CANOPY_LAYERS: CanopyLayer[] = ["Overstory", "Understory"];

const TREE_LIKE_CATEGORIES: PlantCategory[] = [
  "Fruit Tree",
  "Citrus",
  "Tropical Fruit",
  "Palm",
];

/** Minimum canvas spread (ft) for shrub-sized plants to use tree-style labels. */
const TREE_HOST_MIN_SPREAD_FT = 3.5;

export type CanvasTreeHostFields = Pick<
  CanvasPlant,
  "canopy_layer" | "canvas_radius_feet" | "category"
>;

/** Tree-style canvas treatment: centered name, always-visible spread ring. */
export function isCanvasTreeHost(plant: CanvasTreeHostFields): boolean {
  if (LARGE_CANOPY_LAYERS.includes(plant.canopy_layer)) return true;
  if (plant.canvas_radius_feet >= TREE_HOST_MIN_SPREAD_FT) return true;
  if (TREE_LIKE_CATEGORIES.includes(plant.category)) return true;
  return false;
}

export type PlantHitOptions = {
  active?: boolean;
  compactVisuals?: boolean;
  /** Large canopy rings are not clickable — edit shrubs & herbs under trees. */
  understoryFocus?: boolean;
};

export function plantCenterDotPx(
  canvas_radius_feet: number,
  canopy_layer: CanopyLayer,
): number {
  const r = radiusPx(canvas_radius_feet, 1);
  const dotRatio = CENTER_DOT_RATIO[canopy_layer];
  return Math.min(CANVAS_MAX_CENTER_DOT_PX, Math.max(4, r * dotRatio));
}

/** Match PlantCircle hit target so geometry picks align with clicks. */
export function plantHitRadiusPx(
  plant: Pick<CanvasPlant, "canvas_radius_feet" | "canopy_layer" | "category">,
  options: PlantHitOptions = {},
): number {
  const { active = false, compactVisuals = false, understoryFocus = false } =
    options;
  const r = radiusPx(plant.canvas_radius_feet, 1);
  const dotR = plantCenterDotPx(plant.canvas_radius_feet, plant.canopy_layer);

  if (understoryFocus && isCanvasTreeHost(plant)) {
    return 0;
  }

  const treeHost = isCanvasTreeHost(plant);
  const centerOnly = treeHost && !active && (compactVisuals || !active);

  if (centerOnly) {
    return dotR + 12;
  }

  return Math.max(r, dotR + 12);
}

export function plantContainsPoint(
  plant: CanvasPlant,
  x: number,
  y: number,
  options: PlantHitOptions = {},
): boolean {
  const hitR = plantHitRadiusPx(plant, options);
  if (hitR <= 0) return false;
  return Math.hypot(x - plant.x, y - plant.y) <= hitR;
}

export function findPlantsAtPoint(
  plants: CanvasPlant[],
  x: number,
  y: number,
  options: PlantHitOptions = {},
): CanvasPlant[] {
  return plants.filter((p) => plantContainsPoint(p, x, y, options));
}

/** Prefer shrubs, herbs, and smaller plants when several overlap. */
export function sortPlantsForSelection(plants: CanvasPlant[]): CanvasPlant[] {
  return [...plants].sort((a, b) => {
    const layerDiff =
      CANOPY_LAYER_ORDER[b.canopy_layer] - CANOPY_LAYER_ORDER[a.canopy_layer];
    if (layerDiff !== 0) return layerDiff;
    return (
      radiusPx(a.canvas_radius_feet, 1) - radiusPx(b.canvas_radius_feet, 1)
    );
  });
}

const PICK_CYCLE_TOLERANCE_PX = 22;

export type PlantPickStack = {
  ids: string[];
  index: number;
  x: number;
  y: number;
};

export function nextPlantPickStack(
  prev: PlantPickStack | null,
  x: number,
  y: number,
  sorted: CanvasPlant[],
): PlantPickStack {
  const ids = sorted.map((p) => p.canvasId);
  const sameSpot =
    prev != null &&
    Math.hypot(prev.x - x, prev.y - y) <= PICK_CYCLE_TOLERANCE_PX;
  const sameStack =
    prev != null &&
    prev.ids.length === ids.length &&
    prev.ids.every((id, i) => id === ids[i]);

  if (sameSpot && sameStack && ids.length > 1) {
    return {
      ids,
      index: (prev.index + 1) % ids.length,
      x,
      y,
    };
  }

  return { ids, index: 0, x, y };
}

/** True when a screen point hits a draggable canvas plant (not empty bed). */
export function pointerHitsCanvasPlant(
  stage: Konva.Stage,
  root: HTMLElement,
  clientX: number,
  clientY: number,
): boolean {
  const rect = root.getBoundingClientRect();
  const shape = stage.getIntersection({
    x: clientX - rect.left,
    y: clientY - rect.top,
  });
  if (!shape) return false;

  let node: Konva.Node | null = shape;
  while (node && node !== stage) {
    if (node.getAttr("canvasPlant") === true) return true;
    node = node.parent;
  }
  return false;
}
