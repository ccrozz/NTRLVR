import type { Plant, PlantFilters, PlantSummary } from "../schema.js";
import {
  isFoodForestGroup,
  plantMatchesFoodForestGroup,
} from "./food-forest-groups.js";
import { SEED_BY_ID, SEED_PLANTS } from "../data/plants.seed.js";
import { designerSeedsForState } from "../data/state-seed-catalog.js";
import {
  listPlants,
  plantToSummary,
  getPlantById,
  getPlantsByIds,
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
import {
  DEFAULT_DESIGNER_STATE,
  isDesignerStateCode,
  type DesignerStateCode,
} from "./designer-states.js";
import { plantMatchesEdibleFilter } from "./infer-is-edible.js";
import {
  plantIsNativeToState,
} from "./plant-native-status.js";
import { plantMatchesCatalogForState } from "./plant-state-filter.js";
import {
  dedupeCatalogPlants,
  dedupePlantsByName,
  findCatalogDuplicate,
  preferCatalogPlant,
  registerCatalogKeys,
} from "./plant-dedupe.js";
import { listPlantsByCommonNames as resolvePlantsByCommonNames } from "./companion-catalog-lookup.js";
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
  if (filters.edible_only && !plantMatchesEdibleFilter(plant)) return false;
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
    if (!plantIsNativeToState(plant, filters.native_state)) return false;
  }

  if (filters.for_my_area && filters.native_state) {
    if (!plantMatchesCatalogForState(plant, filters.native_state)) return false;
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

function catalogSeedPool(stateCode?: string): Plant[] {
  const st = stateCode?.trim().toUpperCase();
  if (st && isDesignerStateCode(st)) {
    return designerSeedsForState(st);
  }
  // FL curated seeds only apply to Florida catalog browse.
  if (st === "FL") return SEED_PLANTS;
  return [];
}

function plantListItemForStateFilter(item: PlantListItem): Plant {
  const zones =
    item.growing_zones ??
    (item as PlantListItem & { florida_hardiness_zones?: string[] })
      .florida_hardiness_zones ??
    [];
  return {
    ...item,
    florida_hardiness_zones: zones,
    native_states: item.native_states ?? [],
    tags: item.tags ?? [],
    guild_functions: item.guild_functions ?? [],
    soil_preferences: [],
    best_planting_seasons: [],
    uses: [],
    benefits: [],
    companion_plants: [],
    avoid_planting_near: [],
    synonyms: [],
    last_updated: "",
  } as Plant;
}

type CatalogAccumulator = {
  items: PlantListItem[];
  seenIds: Set<string>;
  byKey: Map<string, PlantListItem>;
};

function createCatalogAccumulator(): CatalogAccumulator {
  return { items: [], seenIds: new Set(), byKey: new Map() };
}

function tryAddCatalogItem(
  acc: CatalogAccumulator,
  candidate: PlantListItem,
  stateCode?: string,
  requireStateMatch = false,
): boolean {
  if (
    requireStateMatch &&
    stateCode &&
    !plantMatchesCatalogForState(plantListItemForStateFilter(candidate), stateCode)
  ) {
    return false;
  }
  if (acc.seenIds.has(candidate.id)) return false;

  const prev = findCatalogDuplicate(acc.byKey, candidate);
  if (prev) {
    const pick = preferCatalogPlant(prev, candidate, stateCode);
    if (pick.id !== prev.id) {
      const idx = acc.items.findIndex((i) => i.id === prev.id);
      if (idx >= 0) acc.items[idx] = pick;
      acc.seenIds.delete(prev.id);
      acc.seenIds.add(pick.id);
    }
    registerCatalogKeys(acc.byKey, pick);
    return false;
  }

  acc.seenIds.add(candidate.id);
  registerCatalogKeys(acc.byKey, candidate);
  acc.items.push(candidate);
  return true;
}

async function collectCatalogItems(
  filters: PlantFilters,
  opts: {
    stateCode?: string;
    requireState: boolean;
    stopWhen: number;
    seeds?: PlantListItem[];
    dbFilters?: PlantFilters;
  },
): Promise<{ items: PlantListItem[]; exhausted: boolean }> {
  const acc = createCatalogAccumulator();
  const seeds =
    opts.seeds ??
    dedupeCatalogPlants(
      await listSeedSummaries(filters),
      opts.stateCode,
    );
  const dbFilters = opts.dbFilters ?? filters;

  for (const seed of seeds) {
    tryAddCatalogItem(acc, seed, opts.stateCode, opts.requireState);
    if (acc.items.length >= opts.stopWhen) {
      return { items: acc.items, exhausted: false };
    }
  }

  const BATCH = 96;
  let scanOffset = 0;
  while (acc.items.length < opts.stopWhen) {
    const { data: local } = await listLocalSummaries({
      ...dbFilters,
      limit: BATCH,
      offset: scanOffset,
    });
    if (!local.length) {
      return { items: acc.items, exhausted: true };
    }
    for (const p of local) {
      tryAddCatalogItem(
        acc,
        summaryFromLocal({
          ...p,
          is_invasive_in_florida: p.is_invasive_in_florida ?? false,
        }),
        opts.stateCode,
        opts.requireState,
      );
      if (acc.items.length >= opts.stopWhen) {
        return { items: acc.items, exhausted: false };
      }
    }
    scanOffset += BATCH;
    if (local.length < BATCH) {
      return { items: acc.items, exhausted: true };
    }
  }

  return { items: acc.items, exhausted: false };
}

async function listSeedSummaries(filters: PlantFilters): Promise<PlantListItem[]> {
  const stateCode = filters.native_state;
  const seeds = catalogSeedPool(stateCode).filter((p) =>
    seedMatchesFilters(p, filters),
  );
  const storedById = new Map(
    (await getPlantsByIds(seeds.map((s) => s.id))).map((p) => [p.id, p]),
  );
  return seeds.map((seed) => {
    const stored = storedById.get(seed.id);
    const plant: Plant = stored
      ? {
          ...seed,
          ...stored,
          image_url: coalesceImageUrl(stored.image_url, seed.image_url),
        }
      : seed;
    return summaryFromLocal({
      ...plantToSummary(plant),
      is_invasive_in_florida: plant.is_invasive_in_florida,
    });
  });
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

/** Batch lookup by id (designer companions). */
export async function listPlantsByIds(ids: string[]): Promise<PlantListItem[]> {
  const keys = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  const stored = await getPlantsByIds(keys);
  const storedById = new Map(stored.map((p) => [p.id, p]));
  const out: PlantListItem[] = [];
  for (const key of keys) {
    const plant =
      storedById.get(key) ??
      (await resolvePlantRecord(key));
    if (plant) out.push(plantToListItem(plant));
  }
  return dedupePlantsByName(out);
}

/** Batch lookup by display name (companion_plants strings). */
export async function listPlantsByCommonNames(
  names: string[],
  stateCode?: DesignerStateCode,
): Promise<PlantListItem[]> {
  const plants = await resolvePlantsByCommonNames(names, stateCode);
  return plants.map((p) => plantToListItem(p));
}

/**
 * Garden designer only — curated FL/TN/CT seeds + vetted DB rows (`listStateDesignerPlants`).
 * Never use for public catalog browse.
 */
export async function listDesignerPlants(
  filters: PlantFilters,
  opts: { search?: string } = {},
): Promise<{ data: PlantListItem[]; total: number }> {
  const search = opts.search?.trim() ?? filters.search?.trim();
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 100;

  if (filters.ids?.length) {
    const data = await listPlantsByIds(filters.ids);
    return { data, total: data.length };
  }

  if (filters.names?.length) {
    const state =
      filters.native_state && isDesignerStateCode(filters.native_state)
        ? (filters.native_state as DesignerStateCode)
        : DEFAULT_DESIGNER_STATE;
    const data = await listPlantsByCommonNames(filters.names, state);
    return { data, total: data.length };
  }

  const state =
    filters.native_state && isDesignerStateCode(filters.native_state)
      ? filters.native_state
      : DEFAULT_DESIGNER_STATE;
  const mergedFilters: PlantFilters = {
    ...filters,
    food_forest_only: undefined,
    food_forest_group: filters.food_forest_group,
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

const CATALOG_GROUP_POOL = 14_000;

async function listCatalogPlantsByGroup(
  filters: PlantFilters,
): Promise<{ data: PlantListItem[]; total: number }> {
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 100;
  const group = filters.food_forest_group;
  if (!group || !isFoodForestGroup(group)) {
    return { data: [], total: 0 };
  }

  const stateCode = filters.native_state ?? "FL";
  const requireState = Boolean(filters.for_my_area && stateCode);
  const base: PlantFilters = { ...filters, food_forest_group: undefined };

  const acc = createCatalogAccumulator();
  const seeds = dedupeCatalogPlants(
    await listSeedSummaries(filters),
    stateCode,
  );
  for (const seed of seeds) {
    tryAddCatalogItem(acc, seed, stateCode, requireState);
  }

  const { data: rows } = await listPlants({
    ...base,
    limit: CATALOG_GROUP_POOL,
    offset: 0,
  });
  for (const plant of rows) {
    if (!plantMatchesFoodForestGroup(plant, group, stateCode)) continue;
    if (!seedMatchesFilters(plant, filters)) continue;
    tryAddCatalogItem(acc, plantToListItem(plant), stateCode, requireState);
  }

  const items = acc.items.sort((a, b) =>
    a.common_name.localeCompare(b.common_name),
  );
  return {
    data: items.slice(offset, offset + limit),
    total: items.length,
  };
}

/**
 * Public catalog browse — full ingested plant DB (Trefle scrape + FL seeds), not designer curation.
 */
export async function listCatalogPlants(
  filters: PlantFilters,
  opts: { trefleLive?: boolean; search?: string } = {},
): Promise<{ data: PlantListItem[]; total: number }> {
  const search = opts.search?.trim() ?? filters.search?.trim();
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 100;

  if (
    filters.food_forest_group &&
    isFoodForestGroup(filters.food_forest_group)
  ) {
    return listCatalogPlantsByGroup(filters);
  }

  if (filters.ids?.length) {
    const data = await listPlantsByIds(filters.ids);
    return { data, total: data.length };
  }

  if (filters.names?.length) {
    const data = await listPlantsByCommonNames(
      filters.names,
      filters.native_state && isDesignerStateCode(filters.native_state)
        ? (filters.native_state as DesignerStateCode)
        : undefined,
    );
    return { data, total: data.length };
  }

  if (opts.trefleLive && search) {
    const hits = await searchTrefle(search);
    const data = hits.slice(0, filters.limit ?? 50).map(summaryFromTrefle);
    return { data, total: data.length };
  }

  if (search) {
    return listCatalogPlantsSearch(filters, search);
  }

  const stateCode = filters.native_state;
  const requireState = Boolean(filters.for_my_area && stateCode);
  const stopWhen = offset + limit + 1;
  const { items, exhausted } = await collectCatalogItems(filters, {
    stateCode,
    requireState,
    stopWhen,
  });

  return {
    data: items.slice(offset, offset + limit),
    total: exhausted ? items.length : Math.max(items.length, offset + limit + 1),
  };
}

/** Search uses SQL pagination so cultivar-level results are not collapsed by species dedup. */
async function listCatalogPlantsSearch(
  filters: PlantFilters,
  search: string,
): Promise<{ data: PlantListItem[]; total: number }> {
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 100;

  const requireState = Boolean(filters.for_my_area && filters.native_state);
  const stateCode = filters.native_state;
  const stopWhen = offset + limit + 1;
  const searchFilters: PlantFilters = {
    ...filters,
    limit: undefined,
    offset: undefined,
  };
  const { items, exhausted } = await collectCatalogItems(searchFilters, {
    stateCode,
    requireState,
    stopWhen,
    seeds: [],
    dbFilters: searchFilters,
  });

  if (offset === 0 && items.length < 3) {
    const acc = createCatalogAccumulator();
    for (const item of items) {
      tryAddCatalogItem(acc, item, stateCode, requireState);
    }
    const trefleHits = await searchTrefle(search);
    for (const hit of trefleHits) {
      tryAddCatalogItem(
        acc,
        summaryFromTrefle(hit),
        stateCode,
        requireState,
      );
      if (acc.items.length >= stopWhen) break;
    }
    const merged = acc.items;
    return {
      data: merged.slice(offset, offset + limit),
      total: exhausted ? merged.length : Math.max(merged.length, offset + limit + 1),
    };
  }

  return {
    data: items.slice(offset, offset + limit),
    total: exhausted ? items.length : Math.max(items.length, offset + limit + 1),
  };
}

/** @deprecated Use listCatalogPlants or listDesignerPlants */
export async function listPlantsWithTrefle(
  filters: PlantFilters,
  opts: { trefleLive?: boolean; search?: string },
): Promise<{ data: PlantListItem[]; total: number }> {
  if (filters.food_forest_only) {
    return listDesignerPlants(filters, opts);
  }
  return listCatalogPlants(filters, opts);
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
