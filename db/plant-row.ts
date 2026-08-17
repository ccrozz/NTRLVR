import type {
  CanopyLayer,
  GuildFunction,
  Plant,
  PlantCategory,
  PlantSummary,
} from "../schema.js";
import {
  effectiveIsFloridaNative,
  effectiveNativeStates,
} from "../lib/plant-native-status.js";
import { isRejectedPlantImageUrl } from "../lib/plant-image-quality.js";

export type PlantRow = {
  id: string;
  common_name: string;
  scientific_name: string;
  image_url: string | null;
  trefle_id: number;
  trefle_slug: string;
  family: string | null;
  genus: string | null;
  edible_part: string | null;
  vegetable: number | boolean;
  observations: string | null;
  synonyms: string | unknown;
  trefle_json: string | null;
  category: PlantCategory;
  canopy_layer: CanopyLayer;
  guild_functions: string | unknown;
  is_florida_native: number | boolean;
  is_kitchen_essential: number | boolean;
  is_edible: number | boolean;
  florida_hardiness_zones: string | unknown;
  native_states: string | unknown;
  native_origin: string | null;
  grows_in_us: number | boolean;
  is_invasive_in_florida: number | boolean;
  mature_height_min: number;
  mature_height_max: number;
  mature_spread_min: number;
  mature_spread_max: number;
  canvas_radius_feet: number;
  sunlight: Plant["sunlight"];
  water_needs: Plant["water_needs"];
  soil_preferences: string | unknown;
  best_planting_seasons: string | unknown;
  growth_rate: Plant["growth_rate"];
  care_summary: string;
  uses: string | unknown;
  benefits: string | unknown;
  companion_plants: string | unknown;
  avoid_planting_near: string | unknown;
  tags: string | unknown;
  data_source: Plant["data_source"];
  last_updated: string;
};

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string") return [];
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
}

function boolVal(v: number | boolean | undefined): boolean {
  return v === true || v === 1;
}

export function rowToPlant(row: PlantRow): Plant {
  return {
    id: row.id,
    common_name: row.common_name,
    scientific_name: row.scientific_name,
    image_url: row.image_url,
    trefle_id: row.trefle_id ?? 0,
    trefle_slug: row.trefle_slug ?? row.id,
    family: row.family,
    genus: row.genus,
    edible_part: row.edible_part,
    vegetable: boolVal(row.vegetable),
    observations: row.observations,
    synonyms: parseJsonArray<string>(row.synonyms ?? "[]"),
    trefle_json: row.trefle_json,
    category: row.category,
    canopy_layer: row.canopy_layer,
    guild_functions: parseJsonArray<GuildFunction>(row.guild_functions),
    is_florida_native: boolVal(row.is_florida_native),
    is_kitchen_essential: boolVal(row.is_kitchen_essential),
    is_edible: boolVal(row.is_edible),
    florida_hardiness_zones: parseJsonArray<string>(
      row.florida_hardiness_zones,
    ),
    native_states: parseJsonArray<string>(row.native_states ?? "[]"),
    native_origin: row.native_origin?.trim() || null,
    grows_in_us: boolVal(row.grows_in_us),
    is_invasive_in_florida: boolVal(row.is_invasive_in_florida),
    mature_height_feet: [row.mature_height_min, row.mature_height_max],
    mature_spread_feet: [row.mature_spread_min, row.mature_spread_max],
    canvas_radius_feet: row.canvas_radius_feet,
    sunlight: row.sunlight,
    water_needs: row.water_needs,
    soil_preferences: parseJsonArray(row.soil_preferences),
    best_planting_seasons: parseJsonArray(row.best_planting_seasons),
    growth_rate: row.growth_rate,
    care_summary: row.care_summary,
    uses: parseJsonArray(row.uses),
    benefits: parseJsonArray(row.benefits),
    companion_plants: parseJsonArray(row.companion_plants),
    avoid_planting_near: parseJsonArray(row.avoid_planting_near),
    tags: parseJsonArray(row.tags),
    data_source: row.data_source,
    last_updated: row.last_updated,
  };
}

export function plantToSummary(plant: Plant): PlantSummary & {
  is_invasive_in_florida: boolean;
} {
  return {
    id: plant.id,
    common_name: plant.common_name,
    scientific_name: plant.scientific_name,
    category: plant.category,
    canopy_layer: plant.canopy_layer,
    is_florida_native: effectiveIsFloridaNative(plant),
    is_kitchen_essential: plant.is_kitchen_essential,
    is_edible: plant.is_edible,
    native_states: effectiveNativeStates(plant),
    native_origin: plant.native_origin?.trim() || null,
    growing_zones: plant.florida_hardiness_zones,
    canvas_radius_feet: plant.canvas_radius_feet,
    image_url: isRejectedPlantImageUrl(plant.image_url)
      ? null
      : plant.image_url,
    tags: plant.tags,
    is_invasive_in_florida: plant.is_invasive_in_florida,
    data_source: plant.data_source,
    mature_height_feet: plant.mature_height_feet,
    mature_spread_feet: plant.mature_spread_feet,
    sunlight: plant.sunlight,
    water_needs: plant.water_needs,
  };
}

/** Stable slug for UNIQUE(trefle_slug); IFAS ids must not steal Trefle slugs. */
export function catalogTrefleSlug(plant: Plant): string {
  const explicit = plant.trefle_slug?.trim();
  if (explicit) return explicit;
  if (plant.id.startsWith("trefle-")) return plant.id.slice("trefle-".length);
  return `local-${plant.id}`;
}

export function plantToRow(plant: Plant) {
  return {
    id: plant.id,
    common_name: plant.common_name,
    scientific_name: plant.scientific_name,
    image_url: plant.image_url ?? null,
    trefle_id: plant.trefle_id ?? 0,
    trefle_slug: catalogTrefleSlug(plant),
    family: plant.family,
    genus: plant.genus,
    edible_part: plant.edible_part,
    vegetable: plant.vegetable,
    observations: plant.observations,
    synonyms: plant.synonyms ?? [],
    trefle_json: plant.trefle_json,
    category: plant.category,
    canopy_layer: plant.canopy_layer,
    guild_functions: plant.guild_functions ?? [],
    is_florida_native: plant.is_florida_native,
    is_kitchen_essential: plant.is_kitchen_essential,
    is_edible: plant.is_edible,
    florida_hardiness_zones: plant.florida_hardiness_zones ?? [],
    native_states: plant.native_states ?? [],
    native_origin: plant.native_origin?.trim() || null,
    grows_in_us: plant.grows_in_us,
    is_invasive_in_florida: plant.is_invasive_in_florida,
    mature_height_min: plant.mature_height_feet?.[0] ?? 4,
    mature_height_max: plant.mature_height_feet?.[1] ?? 10,
    mature_spread_min: plant.mature_spread_feet?.[0] ?? 2,
    mature_spread_max: plant.mature_spread_feet?.[1] ?? 6,
    canvas_radius_feet: plant.canvas_radius_feet ?? 2,
    sunlight: plant.sunlight ?? "Adaptable",
    water_needs: plant.water_needs ?? "Moderate",
    soil_preferences: plant.soil_preferences ?? ["Any"],
    best_planting_seasons: plant.best_planting_seasons ?? ["Year-Round"],
    growth_rate: plant.growth_rate ?? "Moderate",
    care_summary: plant.care_summary ?? "",
    uses: plant.uses ?? [],
    benefits: plant.benefits ?? [],
    companion_plants: plant.companion_plants ?? [],
    avoid_planting_near: plant.avoid_planting_near ?? [],
    tags: plant.tags ?? [],
    data_source: plant.data_source ?? "trefle",
    last_updated: plant.last_updated ?? new Date().toISOString().slice(0, 10),
  };
}

export function plantToSqliteRow(plant: Plant) {
  const r = plantToRow(plant);
  return {
    ...r,
    vegetable: r.vegetable ? 1 : 0,
    synonyms: JSON.stringify(r.synonyms),
    guild_functions: JSON.stringify(r.guild_functions),
    is_florida_native: r.is_florida_native ? 1 : 0,
    is_kitchen_essential: r.is_kitchen_essential ? 1 : 0,
    is_edible: r.is_edible ? 1 : 0,
    florida_hardiness_zones: JSON.stringify(r.florida_hardiness_zones),
    native_states: JSON.stringify(r.native_states),
    grows_in_us: r.grows_in_us ? 1 : 0,
    is_invasive_in_florida: r.is_invasive_in_florida ? 1 : 0,
    soil_preferences: JSON.stringify(r.soil_preferences),
    best_planting_seasons: JSON.stringify(r.best_planting_seasons),
    uses: JSON.stringify(r.uses),
    benefits: JSON.stringify(r.benefits),
    companion_plants: JSON.stringify(r.companion_plants),
    avoid_planting_near: JSON.stringify(r.avoid_planting_near),
    tags: JSON.stringify(r.tags),
  };
}

function mergeGrowingZones(existing: string[], incoming: string[]): string[] {
  return [...new Set([...existing, ...incoming])].sort();
}

export function mergeTrefleIntoCatalogRow(existing: Plant, incoming: Plant): Plant {
  const keepCurated = existing.data_source === "ifas";
  return {
    ...incoming,
    id: existing.id,
    common_name: keepCurated ? existing.common_name : incoming.common_name,
    image_url: existing.image_url ?? incoming.image_url,
    is_florida_native: existing.is_florida_native || incoming.is_florida_native,
    is_kitchen_essential:
      existing.is_kitchen_essential || incoming.is_kitchen_essential,
    is_edible: existing.is_edible || incoming.is_edible,
    florida_hardiness_zones: mergeGrowingZones(
      existing.florida_hardiness_zones,
      incoming.florida_hardiness_zones,
    ),
    native_states: existing.native_states.length
      ? existing.native_states
      : incoming.native_states,
    category: keepCurated ? existing.category : incoming.category,
    canopy_layer: keepCurated ? existing.canopy_layer : incoming.canopy_layer,
    guild_functions: [
      ...new Set([
        ...existing.guild_functions,
        ...incoming.guild_functions,
      ]),
    ],
    tags: [...new Set([...existing.tags, ...incoming.tags])],
    companion_plants: existing.companion_plants.length
      ? existing.companion_plants
      : incoming.companion_plants,
    avoid_planting_near: existing.avoid_planting_near.length
      ? existing.avoid_planting_near
      : incoming.avoid_planting_near,
    data_source: keepCurated ? "ifas" : incoming.data_source,
    trefle_json: incoming.trefle_json ?? existing.trefle_json,
  };
}
