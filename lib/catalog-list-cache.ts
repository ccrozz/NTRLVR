import type { PlantFilters } from "../schema.js";
import type { PlantListItem } from "./trefle-api.js";

const CATALOG_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CATALOG_CACHES = 32;

type CatalogCacheEntry = {
  items: PlantListItem[];
  expiresAt: number;
};

const catalogFullListCache = new Map<string, CatalogCacheEntry>();

/** Stable cache key — ignores pagination. */
export function catalogListCacheKey(
  filters: PlantFilters,
  search?: string,
): string {
  const key: Record<string, unknown> = {
    search: search ?? filters.search,
    category: filters.category,
    canopy_layer: filters.canopy_layer,
    florida_native_only: filters.florida_native_only,
    native_state: filters.native_state,
    native_to_state_only: filters.native_to_state_only,
    for_my_area: filters.for_my_area,
    kitchen_essentials_only: filters.kitchen_essentials_only,
    edible_only: filters.edible_only,
    exclude_invasive: filters.exclude_invasive,
    us_only: filters.us_only,
    food_forest_group: filters.food_forest_group,
    hardiness_zone: filters.hardiness_zone,
    guild_function: filters.guild_function,
  };
  return JSON.stringify(key);
}

function pruneCatalogCache(): void {
  if (catalogFullListCache.size <= MAX_CATALOG_CACHES) return;
  let oldestKey: string | null = null;
  let oldestExpiry = Infinity;
  for (const [k, v] of catalogFullListCache) {
    if (v.expiresAt < oldestExpiry) {
      oldestExpiry = v.expiresAt;
      oldestKey = k;
    }
  }
  if (oldestKey) catalogFullListCache.delete(oldestKey);
}

export function readCachedCatalogList(key: string): PlantListItem[] | null {
  const hit = catalogFullListCache.get(key);
  if (!hit || hit.expiresAt <= Date.now()) {
    if (hit) catalogFullListCache.delete(key);
    return null;
  }
  return hit.items;
}

export function writeCachedCatalogList(
  key: string,
  items: PlantListItem[],
): void {
  catalogFullListCache.set(key, {
    items,
    expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
  });
  pruneCatalogCache();
}
