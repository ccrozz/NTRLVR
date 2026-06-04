import type { PlantCategory } from "../schema.js";
import type { DesignerStateCode } from "./designer-states.js";
import { catalogRowIsFoodForestTree } from "./food-forest-groups.js";
import type { GardenStyle, PlantingDensity } from "./food-forest-questionnaire.js";

/** Row fields used to gate Build For Me / layout catalog picks by garden style. */
export type GardenStyleCatalogRow = {
  id?: string;
  category: string;
  canopy_layer: string;
  edible?: boolean;
  native?: boolean;
  tags?: string[];
  is_kitchen_essential?: boolean;
};

const FRUIT_TREE_CATEGORIES: PlantCategory[] = [
  "Fruit Tree",
  "Citrus",
  "Tropical Fruit",
  "Palm",
];

const KITCHEN_CATEGORIES: PlantCategory[] = [
  "Herb",
  "Vegetable",
  "Berry",
  "Vine",
  "Ground Cover",
  "Edible Flower",
];

function hasTag(row: GardenStyleCatalogRow, tag: string): boolean {
  return (row.tags ?? []).some((t) => t.toLowerCase() === tag.toLowerCase());
}

export function catalogRowIsFruitTree(row: GardenStyleCatalogRow): boolean {
  return FRUIT_TREE_CATEGORIES.includes(row.category as PlantCategory);
}

export function catalogRowMatchesGardenStyle(
  row: GardenStyleCatalogRow,
  style: GardenStyle | undefined,
  stateCode: DesignerStateCode | string = "FL",
): boolean {
  if (!style || style === "easy_care") return true;

  if (style === "food_forest") {
    return catalogRowIsFoodForestTree(
      {
        category: row.category,
        edible: row.edible ?? false,
        native: row.native ?? false,
      },
      stateCode,
    );
  }

  if (catalogRowIsFruitTree(row)) return false;
  if (row.canopy_layer === "Overstory") return false;

  const cat = row.category as PlantCategory;

  switch (style) {
    case "kitchen_garden":
      if (row.is_kitchen_essential) return true;
      if (KITCHEN_CATEGORIES.includes(cat)) return true;
      if (
        row.edible &&
        (row.canopy_layer === "Herbaceous" ||
          row.canopy_layer === "Shrub" ||
          row.canopy_layer === "Groundcover" ||
          row.canopy_layer === "Vine")
      ) {
        return true;
      }
      return false;

    case "pollinator":
      if (cat === "Edible Flower" || cat === "Herb") return true;
      if (hasTag(row, "pollinator") || hasTag(row, "landscape")) return true;
      if (cat === "Native Shrub" || cat === "Support Species") return true;
      if (
        row.canopy_layer === "Herbaceous" ||
        row.canopy_layer === "Groundcover"
      ) {
        return cat !== "Vegetable";
      }
      if (row.canopy_layer === "Shrub" && (row.native || hasTag(row, "pollinator"))) {
        return true;
      }
      return false;

    case "visual":
      if (cat === "Vegetable") return false;
      if (hasTag(row, "landscape")) return true;
      if (cat === "Edible Flower" || cat === "Native Shrub") return true;
      if (hasTag(row, "pollinator") && !row.edible) return true;
      if (
        row.canopy_layer === "Groundcover" ||
        row.canopy_layer === "Herbaceous"
      ) {
        return !row.edible || cat === "Herb" || hasTag(row, "landscape");
      }
      if (row.canopy_layer === "Shrub" && !catalogRowIsFruitTree(row)) {
        return hasTag(row, "landscape") || !row.edible || cat === "Berry";
      }
      return (
        !row.edible &&
        row.canopy_layer !== "Understory" &&
        (hasTag(row, "landscape") || cat === "Support Species")
      );

    default:
      return true;
  }
}

export function filterCatalogForGardenStyle<T extends GardenStyleCatalogRow>(
  catalog: T[],
  style: GardenStyle | undefined,
  stateCode: DesignerStateCode | string = "FL",
  minPool = 10,
): T[] {
  if (!style) return catalog;
  const filtered = catalog.filter((row) =>
    catalogRowMatchesGardenStyle(row, style, stateCode),
  );
  return filtered.length >= minPool ? filtered : catalog;
}

export function filterIdsForGardenStyle(
  ids: string[],
  catalog: GardenStyleCatalogRow[],
  style: GardenStyle | undefined,
  stateCode: DesignerStateCode | string = "FL",
): string[] {
  if (!style || style === "easy_care") return ids;
  const byId = new Map(
    catalog.filter((r) => r.id).map((r) => [r.id!, r]),
  );
  return ids.filter((id) => {
    const row = byId.get(id);
    return row && catalogRowMatchesGardenStyle(row, style, stateCode);
  });
}

export function topUpIdsForGardenStyle(
  ids: string[],
  catalog: GardenStyleCatalogRow[],
  target: number,
  style: GardenStyle | undefined,
  stateCode: DesignerStateCode | string = "FL",
): string[] {
  if (!style || style === "easy_care") return ids;
  const used = new Set(ids);
  const pool = catalog
    .filter(
      (row) =>
        row.id &&
        catalogRowMatchesGardenStyle(row, style, stateCode) &&
        !used.has(row.id),
    )
    .sort((a, b) => {
      const ar = (a as { radius_ft?: number }).radius_ft ?? 3;
      const br = (b as { radius_ft?: number }).radius_ft ?? 3;
      if (style === "food_forest") return br - ar;
      return ar - br;
    });
  const out = [...ids];
  for (const row of pool) {
    if (out.length >= target) break;
    if (row.id && !used.has(row.id)) {
      used.add(row.id);
      out.push(row.id);
    }
  }
  return out;
}

/** Anthropic picking rules for Build For Me + layout, keyed by garden style. */
export function aiPickingRulesForGardenStyle(
  style: GardenStyle | undefined,
  target: number,
  density: PlantingDensity = "balanced",
): string {
  switch (style) {
    case "food_forest":
      return `- FOOD FOREST — CANVAS TREES ONLY: pick exactly ${target} fruit-tree ids (Fruit Tree, Citrus, Tropical Fruit, edible Palm).
- No shrubs, herbs, vines, groundcovers, or support plants — companions are added later from Browse Plants.
- Mix Overstory and Understory trees with realistic canopy spacing.`;

    case "kitchen_garden":
      return `- KITCHEN GARDEN: pick exactly ${target} cooking-garden ids — herbs, vegetables, tomatoes, peppers, beans, greens, berries, and vines.
- NO fruit trees, citrus, or large canopy trees — only what you would plant in a raised bed or kitchen plot.
- Favor Herbaceous, Shrub (compact), Groundcover, and Vine layers; at most one small edible shrub if needed for structure.`;

    case "pollinator":
      return `- POLLINATOR GARDEN: pick exactly ${target} ids that attract bees, butterflies, and hummingbirds.
- Perennial and annual flowers, flowering herbs, native pollinator shrubs, and support species — NOT fruit trees or row-crop vegetables.
- Layer for bloom through the seasons: mix Herbaceous, Groundcover, Shrub, and a few Vines; no Overstory.`;

    case "visual":
      return `- VISUAL GARDEN: pick exactly ${target} ornamental showpieces — the prettiest flowers, foliage, and landscape plants in the catalog.
- NO fruit trees, citrus, or tropical fruit — this is a beauty-first bed, not an orchard.
- Favor color, texture, and fragrance (flowers, landscape-tagged natives, ornamental shrubs and groundcovers).`;

    case "easy_care":
      return density === "dense"
        ? `- EASY-CARE DENSE: pick ${target} tough, low-fuss perennials and small shrubs — minimal pruning, forgiving water needs.
- At most 1 small tree or large shrub; mostly Herbaceous and Groundcover.`
        : `- EASY-CARE: pick ~${target} reliable, low-maintenance plants — fewer large trees, more forgiving perennials and groundcovers.`;

    default:
      return `- Pick exactly ${target} different plant ids from the catalog.
- Design a stacked guild (canopy, shrub, herb, ground layers) tailored to the profile.`;
  }
}

export function layoutUserPromptForStyle(style: GardenStyle | undefined): string {
  switch (style) {
    case "food_forest":
      return "Build a food-forest fruit tree list for this bed (trees only on the canvas).";
    case "kitchen_garden":
      return "Build a kitchen garden plant list (herbs, vegetables, and everyday cooking crops).";
    case "pollinator":
      return "Build a pollinator garden plant list (flowers and nectar plants).";
    case "visual":
      return "Build a visual garden plant list (ornamental beauty, no fruit trees).";
    default:
      return "Build a personalized garden plant list for this bed.";
  }
}

export function heuristicMessageForStyle(
  style: GardenStyle | undefined,
  plantCount: number,
): string | undefined {
  switch (style) {
    case "food_forest":
      return "Fruit trees selected for your food forest — add shrubs and herbs from Browse Plants.";
    case "kitchen_garden":
      return "Kitchen crops selected — herbs, veggies, and pick-for-dinner plants ready to place.";
    case "pollinator":
      return "Pollinator-friendly flowers and herbs selected for your bed.";
    case "visual":
      return plantCount >= 8
        ? "Ornamental plants selected for a beautiful, layered bed."
        : "Limited catalog matches; placed the best ornamental fits for your zone.";
    default:
      return plantCount >= 8
        ? "Dense guild selected from catalog."
        : "Limited catalog matches; placed as many as fit your zone.";
  }
}
