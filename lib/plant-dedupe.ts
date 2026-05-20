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
