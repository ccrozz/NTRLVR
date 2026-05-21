import type { DesignerStateCode } from "./designer-states.js";
import { designerStateConfig } from "./designer-states.js";
import { plantZonesOverlapState } from "./us-states.js";
import type { Plant } from "../schema.js";
import {
  mergeZoneLists,
  parseHardinessZonesFromText,
  zonesFromTrefleGrowth,
} from "./infer-hardiness-zones.js";
import { TrefleClient } from "../trefle/client.js";
import { TrefleRateLimitError } from "../trefle/errors.js";
import {
  mapDetailToPlant,
  mapListToPlant,
} from "../trefle/map-plant.js";
import type { TrefleListPlant } from "../trefle/types.js";
import { upsertPlant, getPlantById } from "../db/plant-repository.js";
import { enrichPlantFromWeb } from "./enrich-plant.js";
import { fetchBestPlantImage } from "./plant-images.js";
import { mergeLocalWithTrefle, searchTrefleByScientificName } from "./trefle-api.js";

export function stateTag(stateCode: DesignerStateCode): string {
  return stateCode.toLowerCase();
}

export function plantGrowsInState(plant: Plant, stateCode: DesignerStateCode): boolean {
  const zones = plant.florida_hardiness_zones ?? [];
  if (zones.length && plantZonesOverlapState(zones, stateCode)) return true;
  const st = stateCode.toUpperCase();
  if (plant.native_states.some((s) => s.toUpperCase() === st)) return true;
  if (
    st === "FL" &&
    plant.is_florida_native &&
    plant.native_states.length === 0
  ) {
    return true;
  }
  return false;
}

export function tagPlantForState(
  plant: Plant,
  stateCode: DesignerStateCode,
): Plant {
  const tag = stateTag(stateCode);
  const tags = new Set(plant.tags ?? []);
  tags.add("food-forest");
  tags.add(tag);
  const native = new Set(plant.native_states ?? []);
  if (plant.is_florida_native && stateCode === "FL") native.add("FL");
  return {
    ...plant,
    tags: [...tags],
    native_states: native.size ? [...native] : [stateCode],
    grows_in_us: true,
    is_florida_native:
      stateCode === "FL"
        ? plant.is_florida_native ||
          plant.native_states.includes("FL")
        : false,
  };
}

export function listOverlapsStateZones(
  zones: string[],
  stateCode: DesignerStateCode,
): boolean {
  if (!zones.length) return false;
  return plantZonesOverlapState(zones, stateCode);
}

export type TrefleImportOptions = {
  stateCode: DesignerStateCode;
  maxRequests: number;
  fetchDetails: boolean;
  edibleOnly: boolean;
  hasImageOnly: boolean;
  startPage?: number;
  onProgress?: (msg: string) => void;
};

export type TrefleImportResult = {
  scanned: number;
  imported: number;
  skippedNoZone: number;
  requestsUsed: number;
  rateLimited: boolean;
};

export async function importTrefleCatalogForState(
  token: string,
  options: TrefleImportOptions,
): Promise<TrefleImportResult> {
  const client = new TrefleClient(token);
  const filters: Record<string, string> = {};
  if (options.edibleOnly) {
    filters["filter[edible]"] = "true";
  }
  if (options.hasImageOnly) {
    filters["filter_not[image_url]"] = "null";
  }

  let page = options.startPage ?? 1;
  let lastPage: number | null = null;
  let requests = 0;
  let scanned = 0;
  let imported = 0;
  let skippedNoZone = 0;
  let rateLimited = false;
  const log = options.onProgress ?? (() => {});

  while (requests < options.maxRequests) {
    if (lastPage !== null && page > lastPage) break;

    if (lastPage !== null && page > lastPage) break;

    let listRes;
    try {
      listRes = await client.fetchPlantsPage(page, filters);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (lastPage !== null && page > lastPage) break;
      if (/expected :page|got \d+/.test(msg) && lastPage !== null) break;
      throw e;
    }
    requests++;
    lastPage = listRes.meta.last_page;
    const items = listRes.data ?? [];
    log(`Page ${page}/${lastPage ?? "?"} — ${items.length} rows`);

    for (const item of items) {
      scanned++;
      try {
        let plant: Plant;
        if (options.fetchDetails && requests < options.maxRequests) {
          const detail = await client.fetchPlantBySlug(item.slug);
          requests++;
          plant = mapDetailToPlant(detail, {
            catalogFilteredEdible: options.edibleOnly,
          });
        } else {
          plant = mapListToPlant(item, {
            catalogFilteredEdible: options.edibleOnly,
          });
          const growthZones = zonesFromTrefleGrowth(
            (item as TrefleListPlant & { growth?: unknown }).growth as never,
          );
          if (growthZones.length) {
            plant = {
              ...plant,
              florida_hardiness_zones: growthZones,
            };
          }
        }

        if (!plant.florida_hardiness_zones.length) {
          const inferred = mergeZoneLists(
            parseHardinessZonesFromText(
              [plant.care_summary, plant.observations ?? ""].join(" "),
            ),
          );
          if (inferred.length) {
            plant = { ...plant, florida_hardiness_zones: inferred };
          }
        }

        if (!listOverlapsStateZones(plant.florida_hardiness_zones, options.stateCode)) {
          skippedNoZone++;
          continue;
        }

        plant = tagPlantForState(plant, options.stateCode);
        const existing = getPlantById(plant.id);
        if (existing?.image_url?.trim() && !plant.image_url?.trim()) {
          plant = { ...plant, image_url: existing.image_url };
        }
        upsertPlant(plant);
        imported++;
      } catch (e) {
        if (e instanceof TrefleRateLimitError) {
          rateLimited = true;
          break;
        }
        log(
          `  skip ${item.slug}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    if (rateLimited) break;
    page++;
  }

  return {
    scanned,
    imported,
    skippedNoZone,
    requestsUsed: requests,
    rateLimited,
  };
}

export async function enrichStatePlantRow(
  plant: Plant,
  delayMs = 300,
): Promise<Plant> {
  const result = await enrichPlantFromWeb(plant);
  let next = result.plant;
  if (result.plant.data_source !== "trefle" && process.env.TREFLE_API_TOKEN) {
    try {
      const detail = await searchTrefleByScientificName(plant.scientific_name);
      if (detail) {
        next = mergeLocalWithTrefle(next, {
          ...mapDetailToPlant(detail),
          id: next.id,
        });
      }
    } catch {
      /* optional */
    }
  }
  await sleep(delayMs);
  return next;
}

export async function fetchImageForPlant(
  plant: Plant,
  delayMs = 500,
): Promise<Plant> {
  if (plant.image_url?.trim()) return plant;
  const img = await fetchBestPlantImage(
    plant.common_name,
    plant.scientific_name,
  );
  await sleep(delayMs);
  if (!img) return plant;
  return { ...plant, image_url: img.image_url };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function summarizeStateImport(stateCode: DesignerStateCode): string {
  const cfg = designerStateConfig(stateCode);
  return `${cfg?.name ?? stateCode} (zones ${cfg?.minCatalogZone}–${cfg?.defaultZone})`;
}
