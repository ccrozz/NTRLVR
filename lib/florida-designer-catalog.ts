/**
 * Florida designer plant catalog: curated IFAS seeds plus SQLite rows
 * that grow in Florida (8b–11b). Excludes zone 8a and colder.
 */
import type { Plant, PlantFilters } from "../schema.js";
import { SEED_PLANTS } from "../data/plants.seed.js";
import {
  isFoodForestGroup,
  plantMatchesFoodForestGroup,
} from "./food-forest-groups.js";
import { getPlantById, listPlants } from "../db/plant-repository.js";
import { applyDesignerProfile } from "./designer-plant-profiles.js";
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

const FL_STATE = "FL";
const DESIGNER_DB_CAP = 8000;

function seedMatchesFilters(plant: Plant, filters: PlantFilters): boolean {
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

  if (filters.florida_native_only && !plant.is_florida_native) return false;
  if (filters.kitchen_essentials_only && !plant.is_kitchen_essential) {
    return false;
  }
  if (filters.edible_only && !plant.is_edible) return false;
  if (filters.exclude_invasive && plant.is_invasive_in_florida) return false;

  if (!plantSuitableForDesignerCatalog(plant.florida_hardiness_zones)) {
    return false;
  }

  if (
    filters.food_forest_group &&
    isFoodForestGroup(filters.food_forest_group) &&
    !plantMatchesFoodForestGroup(plant, filters.food_forest_group)
  ) {
    return false;
  }

  if (filters.native_to_state_only && filters.native_state) {
    const st = filters.native_state.toUpperCase();
    const native =
      plant.native_states.some((s) => s.toUpperCase() === st) ||
      (st === FL_STATE &&
        plant.is_florida_native &&
        plant.native_states.length === 0);
    if (!native) return false;
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

function dbFiltersForDesigner(filters: PlantFilters): PlantFilters {
  const state = filters.native_state?.toUpperCase() ?? FL_STATE;
  return {
    ...filters,
    food_forest_only: undefined,
    exclude_invasive: true,
    for_my_area: filters.for_my_area !== false,
    native_state: state,
    us_only: false,
    limit: DESIGNER_DB_CAP,
    offset: 0,
  };
}

/** Merge curated seeds with Florida-growable DB rows (deduped by id). */
export function listFloridaDesignerPlants(filters: PlantFilters): Plant[] {
  const effective: PlantFilters = {
    ...filters,
    exclude_invasive: true,
    native_state: filters.native_state ?? FL_STATE,
    for_my_area: filters.for_my_area !== false,
  };

  const byId = new Map<string, Plant>();

  for (const seed of SEED_PLANTS) {
    if (!seedMatchesFilters(seed, effective)) continue;
    const stored = getPlantById(seed.id);
    const plant: Plant = stored
      ? {
          ...seed,
          ...stored,
          image_url: coalesceImageUrl(stored.image_url, seed.image_url),
        }
      : seed;
    byId.set(seed.id, plant);
  }

  const { data: dbRows } = listPlants(dbFiltersForDesigner(effective));
  for (const row of dbRows) {
    if (byId.has(row.id)) {
      const existing = byId.get(row.id)!;
      byId.set(row.id, {
        ...existing,
        image_url: coalesceImageUrl(row.image_url, existing.image_url),
      });
      continue;
    }
    if (!seedMatchesFilters(row, effective)) continue;
    byId.set(row.id, applyDesignerProfile(row));
  }

  return dedupePlantsByName([...byId.values()]).sort((a, b) =>
    a.common_name.localeCompare(b.common_name),
  );
}
