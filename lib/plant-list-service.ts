import type { Plant, PlantFilters, PlantSummary } from "../schema.js";
import {
  isFoodForestGroup,
  plantMatchesFoodForestGroup,
} from "./food-forest-groups.js";
import { SEED_BY_ID, SEED_PLANTS } from "../data/plants.seed.js";
import { stateByCode } from "./us-states.js";
import {
  listPlants,
  plantToSummary,
  getPlantById,
  getPlantByTrefleSlug,
} from "../db/plant-repository.js";
import {
  mapTrefleDetailToPlant,
  mergeLocalWithTrefle,
  searchTrefle,
  summaryFromLocal,
  summaryFromTrefle,
  type PlantListItem,
  getTreflePlant,
  getTreflePlantBySlug,
} from "./trefle-api.js";
import { applyDesignerProfile } from "./designer-plant-profiles.js";
import { listStateDesignerPlants } from "./state-designer-catalog.js";
import { DEFAULT_DESIGNER_STATE, isDesignerStateCode } from "./designer-states.js";
import { dedupePlantsByName } from "./plant-dedupe.js";
export async function listLocalSummaries(filters: PlantFilters): Promise<{
  data: PlantSummary[];
  total: number;
}> {
  const { data, total } = await listPlants(filters);
  return {
    data: data.map((p) => ({
      ...plantToSummary(p),
      is_invasive_in_florida: p.is_invasive_in_florida,
    })),
    total,
  };
}

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
  if (filters.kitchen_essentials_only && !plant.is_kitchen_essential) return false;
  if (filters.edible_only && !plant.is_edible) return false;
  if (filters.exclude_invasive && plant.is_invasive_in_florida) return false;

  if (
    filters.food_forest_group &&
    isFoodForestGroup(filters.food_forest_group) &&
    !plantMatchesFoodForestGroup(
      plant,
      filters.food_forest_group,
      filters.native_state ?? "FL",
    )
  ) {
    return false;
  }

  if (filters.native_to_state_only && filters.native_state) {
    const st = filters.native_state.toUpperCase();
    const native =
      plant.native_states.some((s) => s.toUpperCase() === st) ||
      (st === "FL" &&
        plant.is_florida_native &&
        plant.native_states.length === 0);
    if (!native) return false;
  }

  if (filters.for_my_area && filters.native_state) {
    const st = filters.native_state.toUpperCase();
    const state = stateByCode(st);
    if (state?.hardiness_zones.length) {
      const zones = plant.florida_hardiness_zones.map((z) => z.toLowerCase());
      const inZone = state.hardiness_zones.some((z) =>
        zones.includes(z.toLowerCase()),
      );
      const native =
        plant.native_states.some((s) => s.toUpperCase() === st) ||
        (st === "FL" &&
          plant.is_florida_native &&
          plant.native_states.length === 0);
      if (!inZone && !native) return false;
    }
  }

  if (filters.hardiness_zone) {
    const z = filters.hardiness_zone.trim().toLowerCase();
    const zones = plant.florida_hardiness_zones.map((x) => x.toLowerCase());
    const whole = z.replace(/[ab]$/i, "");
    if (
      !zones.includes(z) &&
      !zones.some((x) => x.startsWith(whole))
    ) {
      return false;
    }
  }

  return true;
}

function coalesceImageUrl(
  ...candidates: (string | null | undefined)[]
): string | null {
  for (const url of candidates) {
    const trimmed = url?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

async function listSeedSummaries(filters: PlantFilters): Promise<PlantListItem[]> {
  const out: PlantListItem[] = [];
  for (const seed of SEED_PLANTS.filter((p) => seedMatchesFilters(p, filters))) {
      const stored = await getPlantById(seed.id);
      const plant: Plant = stored
        ? {
            ...seed,
            ...stored,
            image_url: coalesceImageUrl(stored.image_url, seed.image_url),
          }
        : seed;
    out.push(
      summaryFromLocal({
        ...plantToSummary(plant),
        is_invasive_in_florida: plant.is_invasive_in_florida,
      }),
    );
  }
  return out;
}

function plantToListItem(plant: Plant): PlantListItem {
  return summaryFromLocal({
    ...plantToSummary(plant),
    is_invasive_in_florida: plant.is_invasive_in_florida,
  });
}

async function resolvePlantRecord(id: string): Promise<Plant | null> {
  return (await getPlantById(id)) ?? SEED_BY_ID[id] ?? null;
}

function scoreCommonNameMatch(plantName: string, query: string): number {
  const cn = plantName.trim().toLowerCase();
  const q = query.trim().toLowerCase();
  if (!cn || !q) return 0;
  if (cn === q) return 100;
  if (cn.endsWith(` ${q}`)) return 85;
  const words = cn.split(/\s+/);
  if (words.includes(q)) return 75;
  if (cn.includes(q)) return 65;
  if (q.includes(cn)) return 50;
  return 0;
}

async function findPlantByCommonName(name: string): Promise<Plant | null> {
  const target = name.trim().toLowerCase();
  if (!target) return null;

  let best: Plant | null = null;
  let bestScore = 0;

  const consider = (plant: Plant) => {
    const score = scoreCommonNameMatch(plant.common_name, target);
    if (score > bestScore) {
      bestScore = score;
      best = plant;
    }
  };

  for (const seed of SEED_PLANTS) {
    const stored = await getPlantById(seed.id);
    consider(stored ? { ...seed, ...stored } : seed);
  }

  const { data } = await listPlants({ search: name.trim(), limit: 16 });
  for (const row of data) {
    consider(row);
  }

  return bestScore >= 65 ? best : null;
}

/** Batch lookup by id (designer companions). */
export async function listPlantsByIds(ids: string[]): Promise<PlantListItem[]> {
  const out: PlantListItem[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const key = id.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const plant = await resolvePlantRecord(key);
    if (plant) out.push(plantToListItem(plant));
  }
  return dedupePlantsByName(out);
}

/** Batch lookup by display name (companion_plants strings). */
export async function listPlantsByCommonNames(
  names: string[],
): Promise<PlantListItem[]> {
  const out: PlantListItem[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const key = name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const plant = await findPlantByCommonName(name);
    if (plant) out.push(plantToListItem(plant));
  }
  return out;
}

export async function listPlantsWithTrefle(
  filters: PlantFilters,
  opts: { trefleLive?: boolean; search?: string },
): Promise<{ data: PlantListItem[]; total: number }> {
  const search = opts.search?.trim() ?? filters.search?.trim();
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 100;

  if (filters.ids?.length) {
    const data = await listPlantsByIds(filters.ids);
    return { data, total: data.length };
  }

  if (filters.names?.length) {
    const data = await listPlantsByCommonNames(filters.names);
    return { data, total: data.length };
  }

  /** Designer catalog: curated state seeds + DB plants for that state. */
  if (filters.food_forest_only) {
    const state =
      filters.native_state && isDesignerStateCode(filters.native_state)
        ? filters.native_state
        : DEFAULT_DESIGNER_STATE;
    const mergedFilters: PlantFilters = {
      ...filters,
      exclude_invasive: true,
      search: search ?? filters.search,
      native_state: state,
      for_my_area: filters.for_my_area !== false,
    };
    const all = (await listStateDesignerPlants(mergedFilters)).map((plant) =>
      summaryFromLocal({
        ...plantToSummary(plant),
        is_invasive_in_florida: plant.is_invasive_in_florida,
      }),
    );
    return {
      data: all.slice(offset, offset + limit),
      total: all.length,
    };
  }

  if (opts.trefleLive && search) {
    const hits = await searchTrefle(search);
    const data = hits.slice(0, filters.limit ?? 50).map(summaryFromTrefle);
    return { data, total: data.length };
  }

  const seeds = await listSeedSummaries(filters);
  const seedCount = seeds.length;
  const seen = new Set<string>();
  const items: PlantListItem[] = [];

  let dbTotal = 0;

  if (offset === 0) {
    const dbLimit = Math.max(0, limit - seedCount);
    const { data: local, total } = await listLocalSummaries({
      ...filters,
      limit: dbLimit,
      offset: 0,
    });
    dbTotal = total;
    for (const seed of seeds) {
      seen.add(seed.id);
      items.push(seed);
    }
    for (const p of local) {
      const row = summaryFromLocal({
        ...p,
        is_invasive_in_florida: p.is_invasive_in_florida ?? false,
      });
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      items.push(row);
    }
  } else {
    const dbOffset = Math.max(0, offset - seedCount);
    const { data: local, total } = await listLocalSummaries({
      ...filters,
      limit,
      offset: dbOffset,
    });
    dbTotal = total;
    for (const p of local) {
      const row = summaryFromLocal({
        ...p,
        is_invasive_in_florida: p.is_invasive_in_florida ?? false,
      });
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      items.push(row);
    }
  }

  if (search && items.length < 3) {
    const trefleHits = await searchTrefle(search);
    for (const hit of trefleHits) {
      const row = summaryFromTrefle(hit);
      if (seen.has(row.trefle_slug ?? row.id)) continue;
      seen.add(row.trefle_slug ?? row.id);
      items.push(row);
      if (items.length >= limit) break;
    }
  }

  return { data: items, total: dbTotal + seedCount };
}

export async function resolvePlantById(id: string): Promise<Plant | null> {
  const numeric = /^\d+$/.test(id);
  if (numeric) {
    try {
      const detail = await getTreflePlant(parseInt(id, 10));
      return mapTrefleDetailToPlant(detail);
    } catch {
      return null;
    }
  }

  const local =
    (await getPlantById(id)) ??
    (await getPlantByTrefleSlug(id)) ??
    (id.startsWith("trefle-")
      ? await getPlantByTrefleSlug(id.slice("trefle-".length))
      : null) ??
    SEED_BY_ID[id] ??
    null;

  if (local) {
    if (local.trefle_id) {
      try {
        const detail = await getTreflePlant(local.trefle_id);
        return applyDesignerProfile(
          mergeLocalWithTrefle(local, mapTrefleDetailToPlant(detail)),
        );
      } catch {
        return applyDesignerProfile(local);
      }
    }
    return applyDesignerProfile(local);
  }

  try {
    const detail = await getTreflePlantBySlug(
      id.startsWith("trefle-") ? id.slice("trefle-".length) : id,
    );
    return mapTrefleDetailToPlant(detail);
  } catch {
    return null;
  }
}

export async function enrichSeedPlant(localId: string): Promise<Plant | null> {
  const seed = SEED_BY_ID[localId] ?? (await getPlantById(localId));
  if (!seed) return null;

  const { searchTrefleByScientificName } = await import("./trefle-api.js");
  const detail = await searchTrefleByScientificName(seed.scientific_name);
  if (!detail) return seed;

  const mapped = mapTrefleDetailToPlant(detail);
  return mergeLocalWithTrefle(
    { ...seed, id: localId },
    { ...mapped, id: localId },
  );
}

export function plantSummaryFromPlant(plant: Plant): PlantListItem {
  return summaryFromLocal({
    ...plantToSummary(plant),
    is_invasive_in_florida: plant.is_invasive_in_florida,
  });
}

export function canvasPlantFromSummary(
  item: PlantListItem,
  x: number,
  y: number,
): {
  canvasId: string;
  plantId: string;
  trefle_id?: number;
  common_name: string;
  canopy_layer: Plant["canopy_layer"];
  canvas_radius_feet: number;
  image_url: string | null;
  is_invasive_in_florida: boolean;
  x: number;
  y: number;
} {
  return {
    canvasId: crypto.randomUUID(),
    plantId: item.id,
    trefle_id: item.trefle_id,
    common_name: item.common_name,
    canopy_layer: item.canopy_layer,
    canvas_radius_feet: item.canvas_radius_feet,
    image_url: item.image_url,
    is_invasive_in_florida: item.is_invasive_in_florida ?? false,
    x,
    y,
  };
}
