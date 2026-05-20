/**
 * Server-side Trefle.io API — never import from the Vite client bundle.
 */
import type { Plant, PlantSummary } from "../schema.js";
import { applyDesignerProfile } from "./designer-plant-profiles.js";
import { mapDetailToPlant, mapListToPlant, plantIdFromTrefle } from "../trefle/map-plant.js";
import { TrefleClient } from "../trefle/client.js";
import type { TrefleListPlant, TreflePlantDetail } from "../trefle/types.js";

export type TreflePlantSummary = TrefleListPlant;

export {
  normalizeTrefleLight,
  normalizeTrefleWater,
  normalizeTrefleGrowthRate,
  cmToFeet,
} from "./trefle-normalize.js";

function getToken(): string {
  const token =
    process.env.TREFLE_API_KEY?.trim() ||
    process.env.TREFLE_API_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Missing TREFLE_API_KEY or TREFLE_API_TOKEN in environment",
    );
  }
  return token;
}

function client(): TrefleClient {
  return new TrefleClient(getToken(), 600, 100);
}

export async function searchTrefle(query: string): Promise<TrefleListPlant[]> {
  if (!query.trim()) return [];
  const res = await client().searchPlants(query.trim());
  return res.data ?? [];
}

export async function getTreflePlant(trefle_id: number): Promise<TreflePlantDetail> {
  const res = await client().fetchPlantById(trefle_id);
  return res.data;
}

export async function getTreflePlantBySlug(
  slug: string,
): Promise<TreflePlantDetail> {
  const res = await client().fetchPlantBySlug(slug);
  return res.data;
}

export async function searchTrefleByScientificName(
  scientific_name: string,
): Promise<TreflePlantDetail | null> {
  const name = scientific_name.trim();
  if (!name) return null;

  const res = await client().searchPlants(name, {
    "filter[scientific_name]": name,
  });

  const exact =
    res.data.find(
      (p) => p.scientific_name.toLowerCase() === name.toLowerCase(),
    ) ?? res.data[0];

  if (!exact) return null;

  try {
    const detail = await client().fetchPlantById(exact.id);
    return detail.data;
  } catch {
    return null;
  }
}

export async function getFloridaNatives(): Promise<TrefleListPlant[]> {
  const c = client();
  const all: TrefleListPlant[] = [];
  let page = 1;
  let lastPage = 1;

  while (page <= lastPage && page <= 5) {
    const res = await c.fetchDistributionPlantsPage("florida", page);
    all.push(...(res.data ?? []));
    const parsed = TrefleClient.parseLastPage(res.links);
    lastPage = parsed ?? page;
    page++;
  }

  return all;
}

export function mapTrefleListToSummary(item: TrefleListPlant): PlantSummary {
  const plant = mapListToPlant(item);
  return {
    id: plant.id,
    common_name: plant.common_name,
    scientific_name: plant.scientific_name,
    category: plant.category,
    canopy_layer: plant.canopy_layer,
    is_florida_native: plant.is_florida_native,
    is_kitchen_essential: plant.is_kitchen_essential,
    is_edible: plant.is_edible,
    native_states: plant.native_states,
    growing_zones: plant.florida_hardiness_zones,
    canvas_radius_feet: plant.canvas_radius_feet,
    image_url: plant.image_url,
    tags: plant.tags,
    is_invasive_in_florida: plant.is_invasive_in_florida,
  };
}

export function mapTrefleDetailToPlant(detail: TreflePlantDetail): Plant {
  return applyDesignerProfile(mapDetailToPlant(detail, { storeJson: true }));
}

export function mergeLocalWithTrefle(local: Plant, trefle: Plant): Plant {
  return {
    ...trefle,
    id: local.id,
    guild_functions:
      local.guild_functions.length > 0
        ? local.guild_functions
        : trefle.guild_functions,
    companion_plants:
      local.companion_plants.length > 0
        ? local.companion_plants
        : trefle.companion_plants,
    avoid_planting_near:
      local.avoid_planting_near.length > 0
        ? local.avoid_planting_near
        : trefle.avoid_planting_near,
    is_florida_native: local.is_florida_native || trefle.is_florida_native,
    is_invasive_in_florida: local.is_invasive_in_florida,
    is_kitchen_essential: local.is_kitchen_essential,
    florida_hardiness_zones:
      local.florida_hardiness_zones.length > 0
        ? local.florida_hardiness_zones
        : trefle.florida_hardiness_zones,
    care_summary: local.care_summary || trefle.care_summary,
    uses: local.uses.length > 0 ? local.uses : trefle.uses,
    benefits: local.benefits.length > 0 ? local.benefits : trefle.benefits,
    data_source: local.data_source === "manual" ? "manual" : trefle.data_source,
  };
}

export type PlantListItem = PlantSummary & {
  source: "local" | "trefle";
  trefle_id?: number;
  trefle_slug?: string;
  is_invasive_in_florida?: boolean;
};

export function summaryFromLocal(plant: PlantSummary): PlantListItem {
  return { ...plant, source: "local" };
}

export function summaryFromTrefle(item: TrefleListPlant): PlantListItem {
  const s = mapTrefleListToSummary(item);
  return {
    ...s,
    source: "trefle",
    trefle_id: item.id,
    trefle_slug: item.slug,
    id: plantIdFromTrefle(item.slug),
  };
}
