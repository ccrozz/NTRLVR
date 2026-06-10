import {
  isDesignerStateCode,
  type DesignerStateCode,
} from "./designer-states.js";

/** Keep first occurrence of each id, preserving order. */
export function dedupeOrderedIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function normalizePlantName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Binomial or normalized common name — collapses duplicate catalog rows. */
export function speciesDedupKey(
  common_name: string,
  scientific_name?: string | null,
): string {
  const sci = scientific_name?.trim().toLowerCase();
  if (sci) {
    const parts = sci
      .replace(/[×x]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    if (parts.length === 1) return parts[0]!;
  }
  let name = normalizePlantName(common_name);
  const stripLeading =
    /^(american|southern|northern|eastern|western|florida|mexican|chinese|japanese|african|brazilian|texas|gulf|wild)\s+/;
  while (stripLeading.test(name)) {
    name = name.replace(stripLeading, "").trim();
  }
  return name;
}

/** Prefer curated IFAS ids over auto-imported Trefle duplicates. */
export function preferPlantRecord<T extends { id: string }>(a: T, b: T): T {
  const rank = (id: string) => (id.startsWith("trefle-") ? 0 : 2);
  const ra = rank(a.id);
  const rb = rank(b.id);
  if (rb > ra) return b;
  if (ra > rb) return a;
  return a.id.length <= b.id.length ? a : b;
}

type PlantLike = {
  id: string;
  common_name: string;
  scientific_name?: string | null;
  image_url?: string | null;
};

function mergeBySpecies<T extends PlantLike>(a: T, b: T): T {
  return preferPlantRecord(a, b);
}

/** Drop duplicate ids and duplicate species (first occurrence order preserved). */
export function dedupeOrderedIdsByName(
  ids: string[],
  plantForId: (id: string) => PlantLike | undefined,
): string[] {
  const chosen = new Map<string, string>();
  const out: string[] = [];

  for (const id of ids) {
    if (!id) continue;
    const plant = plantForId(id);
    const speciesKey = plant
      ? speciesDedupKey(plant.common_name, plant.scientific_name)
      : id;
    const prevId = chosen.get(speciesKey);
    if (!prevId) {
      chosen.set(speciesKey, id);
      out.push(id);
      continue;
    }
    const prev = plantForId(prevId);
    if (plant && prev) {
      const pick = preferPlantRecord(prev, plant);
      if (pick.id !== prevId) {
        chosen.set(speciesKey, pick.id);
        const idx = out.indexOf(prevId);
        if (idx >= 0) out[idx] = pick.id;
      }
    }
  }
  return dedupeOrderedIds(out);
}

/** Designer state catalogs: keep every curated id (cultivars share species). */
export function dedupePlantsById<T extends { id: string }>(plants: T[]): T[] {
  const byId = new Map<string, T>();
  for (const p of plants) {
    const prev = byId.get(p.id);
    byId.set(p.id, prev ? preferPlantRecord(prev, p) : p);
  }
  return [...byId.values()];
}

function preferCatalogPresentation<T extends PlantLike>(a: T, b: T): T {
  const hasImage = (p: T) => Boolean(p.image_url?.trim());
  if (hasImage(b) && !hasImage(a)) return b;
  if (hasImage(a) && !hasImage(b)) return a;
  const specificName = (p: T) => {
    const common = normalizePlantName(p.common_name);
    const sci = p.scientific_name?.trim().toLowerCase() ?? "";
    const genus = sci.split(/\s+/)[0] ?? "";
    return genus && common !== genus && common !== normalizePlantName(genus)
      ? 1
      : 0;
  };
  if (specificName(b) > specificName(a)) return b;
  if (specificName(a) > specificName(b)) return a;
  return preferPlantRecord(a, b);
}

/** Prefer state curated ids when collapsing catalog duplicates for that state. */
export function preferCatalogPlant<T extends PlantLike>(
  a: T,
  b: T,
  stateCode?: string,
): T {
  if (stateCode && isDesignerStateCode(stateCode)) {
    return preferDesignerPlantForState(a, b, stateCode);
  }
  return preferCatalogPresentation(a, b);
}

/** Collapse catalog cards that share the same visible title (e.g. genus-only Trefle names). */
export function catalogDisplayDedupKey(common_name: string): string {
  return normalizePlantName(common_name);
}

/** Display title or species binomial — collapses genus-only dupes and cultivar dupes. */
export function catalogDedupKeys(
  common_name: string,
  scientific_name?: string | null,
): string[] {
  const keys = new Set<string>();
  keys.add(`d:${catalogDisplayDedupKey(common_name)}`);
  keys.add(`s:${speciesDedupKey(common_name, scientific_name)}`);
  return [...keys];
}

export function findCatalogDuplicate<T extends PlantLike>(
  byKey: Map<string, T>,
  plant: T,
): T | undefined {
  for (const key of catalogDedupKeys(plant.common_name, plant.scientific_name)) {
    const hit = byKey.get(key);
    if (hit) return hit;
  }
  return undefined;
}

export function registerCatalogKeys<T extends PlantLike>(
  byKey: Map<string, T>,
  plant: T,
): void {
  for (const key of catalogDedupKeys(plant.common_name, plant.scientific_name)) {
    byKey.set(key, plant);
  }
}

/** One row per display name or species for public catalog browse. */
export function dedupeCatalogPlants<T extends PlantLike>(
  plants: T[],
  stateCode?: string,
): T[] {
  const byKey = new Map<string, T>();
  const order: T[] = [];

  for (const p of plants) {
    const prev = findCatalogDuplicate(byKey, p);
    if (!prev) {
      registerCatalogKeys(byKey, p);
      order.push(p);
      continue;
    }
    const pick = preferCatalogPlant(prev, p, stateCode);
    const idx = order.findIndex((row) => row.id === prev.id);
    if (idx >= 0) order[idx] = pick;
    registerCatalogKeys(byKey, pick);
  }

  return order;
}

export function dedupePlantsByName<T extends PlantLike>(plants: T[]): T[] {
  const bySpecies = new Map<string, T>();
  const order: string[] = [];

  for (const p of plants) {
    const key = speciesDedupKey(p.common_name, p.scientific_name);
    const prev = bySpecies.get(key);
    if (!prev) {
      bySpecies.set(key, p);
      order.push(key);
    } else {
      bySpecies.set(key, mergeBySpecies(prev, p));
    }
  }

  return order.map((key) => bySpecies.get(key)!);
}

/** TN/CT curated ids (`tn-`, `ct-`) should not appear in other states' designer lists. */
export function isOtherStateDesignerId(
  id: string,
  stateCode: DesignerStateCode,
): boolean {
  if (stateCode !== "TN" && id.startsWith("tn-")) return true;
  if (stateCode !== "CT" && id.startsWith("ct-")) return true;
  return false;
}

function preferDesignerPlantForState<T extends PlantLike>(
  a: T,
  b: T,
  stateCode: DesignerStateCode,
): T {
  const score = (p: T) => {
    if (isOtherStateDesignerId(p.id, stateCode)) return 0;
    if (stateCode === "TN" && p.id.startsWith("tn-")) return 4;
    if (stateCode === "CT" && p.id.startsWith("ct-")) return 4;
    if (p.id.startsWith("trefle-")) return 1;
    return 3;
  };
  const sa = score(a);
  const sb = score(b);
  if (sb !== sa) return sb > sa ? b : a;
  return preferPlantRecord(a, b);
}

/**
 * Drop duplicate display names from cross-state imports (zone overlap).
 * Keeps distinct cultivars — only collapses rows that share the same common_name.
 */
export function dedupeDesignerCatalogPlants<T extends PlantLike>(
  plants: T[],
  stateCode: DesignerStateCode,
): T[] {
  const byCommon = new Map<string, T[]>();

  for (const p of plants) {
    const key = normalizePlantName(p.common_name);
    const group = byCommon.get(key);
    if (group) group.push(p);
    else byCommon.set(key, [p]);
  }

  const out: T[] = [];
  for (const group of byCommon.values()) {
    if (group.length === 1) {
      out.push(group[0]!);
      continue;
    }
    const inState = group.filter(
      (p) => !isOtherStateDesignerId(p.id, stateCode),
    );
    const pool = inState.length > 0 ? inState : group;
    out.push(
      pool.reduce((best, p) => preferDesignerPlantForState(best, p, stateCode)),
    );
  }

  return out.sort((a, b) => a.common_name.localeCompare(b.common_name));
}
