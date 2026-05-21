import { sleep, webGet } from "./http.js";
import type { DiscoveredSpecies } from "./discovered-species.js";

const GBIF = "https://api.gbif.org/v1";

type GbifFacetCount = { name: string; count: number };
type GbifSearchResponse = {
  facets?: { field: string; counts: GbifFacetCount[] }[];
};

type GbifSpecies = {
  key: number;
  scientificName: string;
  canonicalName?: string;
  vernacularName?: string;
  kingdom?: string;
  phylum?: string;
  family?: string;
  genus?: string;
  rank?: string;
};

function plantKingdom(sp: GbifSpecies): boolean {
  const k = (sp.kingdom ?? "").toLowerCase();
  const p = (sp.phylum ?? "").toLowerCase();
  if (
    k === "animalia" ||
    k === "fungi" ||
    k === "chromista" ||
    k === "bacteria" ||
    k === "virus"
  ) {
    return false;
  }
  return (
    k === "plantae" ||
    k === "viridiplantae" ||
    k.includes("plant") ||
    p.includes("tracheophyta") ||
    p.includes("magnoliophyta") ||
    p.includes("chlorophyta") ||
    p.includes("bryophyta")
  );
}

async function fetchGbifFacetPage(
  stateProvince: string,
  facetOffset: number,
  facetLimit: number,
): Promise<GbifFacetCount[]> {
  const params = new URLSearchParams({
    country: "US",
    stateProvince,
    kingdom: "Plantae",
    limit: "0",
    facet: "speciesKey",
    facetLimit: String(facetLimit),
    facetOffset: String(facetOffset),
  });

  const json = await webGet<GbifSearchResponse>(
    `${GBIF}/occurrence/search?${params}`,
  );
  const facet = json?.facets?.find(
    (f) => f.field === "SPECIES_KEY" || f.field === "speciesKey",
  );
  return facet?.counts ?? [];
}

async function resolveGbifSpecies(
  key: number,
): Promise<GbifSpecies | null> {
  return webGet<GbifSpecies>(`${GBIF}/species/${key}`);
}

function toScientificName(sp: GbifSpecies): string | null {
  const sci = (
    sp.canonicalName?.trim() ||
    sp.scientificName?.replace(/\s+\([^)]*\)\s*$/, "").trim() ||
    ""
  )
    .split(/\s+/)
    .slice(0, 2)
    .join(" ");
  if (!/^[A-Za-z]+\s+[A-Za-z0-9.-]+/.test(sci)) return null;
  return sci;
}

export type GbifHarvestOptions = {
  stateProvince: string;
  maxSpecies?: number;
  facetPageSize?: number;
  maxFacetOffset?: number;
  delayMs?: number;
  onProgress?: (msg: string) => void;
};

/**
 * GBIF occurrence facets include many animals; we page facets and keep only
 * resolved Plantae / Viridiplantae species.
 */
export async function harvestGbifSpeciesForState(
  options: GbifHarvestOptions,
): Promise<DiscoveredSpecies[]> {
  const max = options.maxSpecies ?? 4000;
  const facetSize = options.facetPageSize ?? 500;
  const maxOffset = options.maxFacetOffset ?? 30_000;
  const delay = options.delayMs ?? 200;
  const out: DiscoveredSpecies[] = [];
  const seen = new Set<string>();
  let offset = 0;
  let scanned = 0;

  while (out.length < max && offset < maxOffset) {
    const counts = await fetchGbifFacetPage(
      options.stateProvince,
      offset,
      facetSize,
    );
    if (!counts.length) break;

    for (const c of counts) {
      scanned++;
      const key = parseInt(c.name, 10);
      if (Number.isNaN(key)) continue;
      const sp = await resolveGbifSpecies(key);
      await sleep(delay);
      if (!sp || !/^species$/i.test(sp.rank ?? "")) continue;
      if (!plantKingdom(sp)) continue;
      const sci = toScientificName(sp);
      if (!sci || seen.has(sci.toLowerCase())) continue;
      seen.add(sci.toLowerCase());
      out.push({
        scientific_name: sci,
        common_name: sp.vernacularName?.trim() || sci.split(" ")[0],
        family: sp.family ?? null,
        genus: sp.genus ?? null,
        external_id: String(key),
        source: "gbif",
        prevalence: c.count,
      });
      if (out.length >= max) break;
    }

    options.onProgress?.(
      `GBIF offset ${offset} — ${out.length} plants (${scanned} keys scanned)`,
    );
    offset += facetSize;
    await sleep(delay);
    if (counts.length < facetSize) break;
  }

  return out;
}
