/** A plant species discovered from a public web/API source (not Trefle). */
export type DiscoveredSpecies = {
  scientific_name: string;
  common_name: string;
  image_url?: string | null;
  family?: string | null;
  genus?: string | null;
  /** iNaturalist taxon id, GBIF species key, USDA symbol, etc. */
  external_id?: string;
  source: "inaturalist" | "gbif" | "usda" | "wikidata";
  /** Observation or record count when known (for prioritization). */
  prevalence?: number;
};

export function speciesKey(scientificName: string): string {
  return scientificName
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function dedupeDiscovered(
  lists: DiscoveredSpecies[][],
): DiscoveredSpecies[] {
  const bySci = new Map<string, DiscoveredSpecies>();
  for (const list of lists) {
    for (const row of list) {
      const sci = row.scientific_name?.trim();
      if (!sci || !/^[A-Za-z]+\s+[A-Za-z0-9.-]+/.test(sci)) continue;
      const key = speciesKey(sci);
      const existing = bySci.get(key);
      if (!existing) {
        bySci.set(key, row);
        continue;
      }
      const better =
        (row.prevalence ?? 0) > (existing.prevalence ?? 0) ||
        (!existing.image_url && row.image_url) ||
        (!existing.common_name && row.common_name);
      if (better) {
        bySci.set(key, {
          ...existing,
          ...row,
          common_name: row.common_name || existing.common_name,
          image_url: row.image_url ?? existing.image_url,
          prevalence: Math.max(
            row.prevalence ?? 0,
            existing.prevalence ?? 0,
          ),
        });
      }
    }
  }
  return [...bySci.values()];
}
