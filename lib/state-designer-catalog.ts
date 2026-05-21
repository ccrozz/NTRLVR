/**
 * Per-state designer plant catalog: curated state seeds plus SQLite rows
 * that grow in that state's USDA range.
 */
import type { Plant, PlantFilters } from "../schema.js";
import { designerSeedsForState } from "../data/state-seed-catalog.js";
import {
  isFoodForestGroup,
  plantMatchesFoodForestGroup,
  plantIsNativeForDesignerState,
} from "./food-forest-groups.js";
import { getPlantById, listPlants } from "../db/plant-repository.js";
import { applyDesignerProfile } from "./designer-plant-profiles.js";
import {
  designerStateConfig,
  type DesignerStateCode,
  DEFAULT_DESIGNER_STATE,
  isDesignerStateCode,
} from "./designer-states.js";
import { plantSuitableForDesignerCatalog } from "./growing-zones.js";
import { dedupePlantsByName } from "./plant-dedupe.js";

function coalesceImageUrl(
  ...candidates: (string | null | undefined)[]
): string | null {
  for (const url of candidates) {
    const trimmed = url?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

const DESIGNER_DB_CAP = 8000;

function resolveStateCode(filters: PlantFilters): DesignerStateCode {
  const raw = filters.native_state?.toUpperCase() ?? DEFAULT_DESIGNER_STATE;
  return isDesignerStateCode(raw) ? raw : DEFAULT_DESIGNER_STATE;
}

/** Zone overlap alone must not flood TN/CT with other states' Trefle stubs. */
function dbPlantIncludedInStateDesigner(
  plant: Plant,
  stateCode: DesignerStateCode,
): boolean {
  if (plant.is_kitchen_essential || plant.is_edible) return true;
  if (plantIsNativeForDesignerState(plant, stateCode)) return true;
  if (plant.category === "Support Species") return true;
  const src = plant.data_source ?? "";
  if (src === "manual" || src === "ifas" || src === "seed" || src === "usda") return true;
  return false;
}

function seedMatchesFilters(
  plant: Plant,
  filters: PlantFilters,
  stateCode: DesignerStateCode,
): boolean {
  const searchText = filters.search?.trim();
  if (searchText) {
    const tokens = searchText.toLowerCase().split(/\s+/).filter(Boolean);
    const hay = [
      plant.common_name,
      plant.scientific_name,
      plant.category,
      plant.canopy_layer,
      plant.family ?? "",
      plant.genus ?? "",
      plant.care_summary,
      ...plant.tags,
    ]
      .join(" ")
      .toLowerCase();
    if (!tokens.every((t) => hay.includes(t))) return false;
  }

  if (filters.category) {
    const cats = Array.isArray(filters.category)
      ? filters.category
      : [filters.category];
    if (!cats.includes(plant.category)) return false;
  }

  if (filters.canopy_layer) {
    const layers = Array.isArray(filters.canopy_layer)
      ? filters.canopy_layer
      : [filters.canopy_layer];
    if (!layers.includes(plant.canopy_layer)) return false;
  }

  if (
    filters.florida_native_only &&
    !plantIsNativeForDesignerState(plant, stateCode)
  ) {
    return false;
  }
  if (filters.kitchen_essentials_only && !plant.is_kitchen_essential) {
    return false;
  }
  if (filters.edible_only && !plant.is_edible) return false;
  if (filters.exclude_invasive && plant.is_invasive_in_florida) return false;

  const minZone =
    designerStateConfig(stateCode)?.minCatalogZone ?? "8b";
  if (!plantSuitableForDesignerCatalog(plant.florida_hardiness_zones, minZone)) {
    return false;
  }

  if (
    filters.food_forest_group &&
    isFoodForestGroup(filters.food_forest_group) &&
    !plantMatchesFoodForestGroup(plant, filters.food_forest_group, stateCode)
  ) {
    return false;
  }

  if (filters.native_to_state_only && filters.native_state) {
    if (!plantIsNativeForDesignerState(plant, filters.native_state)) return false;
  }

  if (filters.hardiness_zone) {
    const z = filters.hardiness_zone.trim().toLowerCase();
    const zones = plant.florida_hardiness_zones.map((x) => x.toLowerCase());
    const whole = z.replace(/[ab]$/i, "");
    if (!zones.includes(z) && !zones.some((x) => x.startsWith(whole))) {
      return false;
    }
  }

  return true;
}

function dbFiltersForDesigner(
  filters: PlantFilters,
  stateCode: DesignerStateCode,
): PlantFilters {
  return {
    ...filters,
    food_forest_only: undefined,
    exclude_invasive: true,
    for_my_area: filters.for_my_area !== false,
    native_state: stateCode,
    us_only: false,
    limit: DESIGNER_DB_CAP,
    offset: 0,
  };
}

/** Merge state curated seeds with DB rows for that state (deduped by id). */
export async function listStateDesignerPlants(
  filters: PlantFilters,
): Promise<Plant[]> {
  const stateCode = resolveStateCode(filters);
  const effective: PlantFilters = {
    ...filters,
    exclude_invasive: true,
    native_state: stateCode,
    for_my_area: filters.for_my_area !== false,
  };

  const byId = new Map<string, Plant>();
  const stateSeeds = designerSeedsForState(stateCode);

  for (const seed of stateSeeds) {
    if (!seedMatchesFilters(seed, effective, stateCode)) continue;
    const stored = await getPlantById(seed.id);
    const plant: Plant = stored
      ? {
          ...seed,
          ...stored,
          image_url: coalesceImageUrl(stored.image_url, seed.image_url),
        }
      : seed;
    byId.set(seed.id, plant);
  }

  const { data: dbRows } = await listPlants(
    dbFiltersForDesigner(effective, stateCode),
  );
  for (const row of dbRows) {
    if (byId.has(row.id)) {
      const existing = byId.get(row.id)!;
      byId.set(row.id, {
        ...existing,
        image_url: coalesceImageUrl(row.image_url, existing.image_url),
      });
      continue;
    }
    if (!dbPlantIncludedInStateDesigner(row, stateCode)) continue;
    if (!seedMatchesFilters(row, effective, stateCode)) continue;
    byId.set(row.id, applyDesignerProfile(row));
  }

  return dedupePlantsByName([...byId.values()]).sort((a, b) =>
    a.common_name.localeCompare(b.common_name),
  );
}
