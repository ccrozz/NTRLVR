import { sleep, webGet } from "./http.js";
import type { DiscoveredSpecies } from "./discovered-species.js";

const INAT = "https://api.inaturalist.org/v1";

type InatSpeciesCount = {
  count: number;
  taxon: {
    id: number;
    name: string;
    rank: string;
    preferred_common_name?: string;
    default_photo?: { url?: string; medium_url?: string };
    wikipedia_url?: string;
  };
};

type InatSpeciesCountsResponse = {
  total_results: number;
  page: number;
  per_page: number;
  results: InatSpeciesCount[];
};

export type InatHarvestOptions = {
  placeId: number;
  maxSpecies?: number;
  delayMs?: number;
  onProgress?: (msg: string) => void;
};

/** Research-grade plant observations aggregated per species in a US state. */
export async function harvestInaturalistSpeciesForPlace(
  options: InatHarvestOptions,
): Promise<DiscoveredSpecies[]> {
  const max = options.maxSpecies ?? 5000;
  const perPage = 200;
  const delay = options.delayMs ?? 400;
  const out: DiscoveredSpecies[] = [];
  let page = 1;

  while (out.length < max) {
    const params = new URLSearchParams({
      place_id: String(options.placeId),
      verifiable: "true",
      quality_grade: "research",
      iconic_taxa: "Plantae",
      per_page: String(perPage),
      page: String(page),
    });

    const json = await webGet<InatSpeciesCountsResponse>(
      `${INAT}/observations/species_counts?${params}`,
    );
    if (!json?.results?.length) break;

    for (const row of json.results) {
      const taxon = row.taxon;
      if (taxon.rank !== "species" && taxon.rank !== "subspecies") continue;
      if (!/^[A-Za-z]+\s+/.test(taxon.name)) continue;
      out.push({
        scientific_name: taxon.name,
        common_name:
          taxon.preferred_common_name?.trim() ||
          taxon.name.split(" ")[0],
        image_url:
          taxon.default_photo?.medium_url ??
          taxon.default_photo?.url ??
          null,
        external_id: String(taxon.id),
        source: "inaturalist",
        prevalence: row.count,
      });
      if (out.length >= max) break;
    }

    options.onProgress?.(
      `iNaturalist page ${page} — ${out.length} species`,
    );

    if (page * perPage >= (json.total_results ?? 0)) break;
    page++;
    await sleep(delay);
  }

  return out;
}
