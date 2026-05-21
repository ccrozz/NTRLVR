import { HORTICULTURE_GENERA } from "../../data/horticulture-genera.js";
import { sleep, webGet } from "./http.js";
import type { DiscoveredSpecies } from "./discovered-species.js";

const USDA = "https://plantsservices.sc.egov.usda.gov/api";

type UsdaHit = {
  Plant?: {
    Symbol?: string;
    ScientificName?: string;
    CommonName?: string;
    Rank?: string;
  };
};

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function parseScientific(html: string): string | null {
  const plain = stripHtml(html);
  if (!plain || plain.includes(" spp.")) return null;
  const m = plain.match(/^([A-Z][a-z]+(?:\s+[a-z0-9.-]+)+)/);
  return m ? m[1] : null;
}

export type UsdaHarvestOptions = {
  stateName: string;
  genera?: string[];
  delayMs?: number;
  onProgress?: (msg: string) => void;
};

/** USDA PLANTS search per genus filtered to plants recorded in the state. */
export async function harvestUsdaSpeciesForState(
  options: UsdaHarvestOptions,
): Promise<DiscoveredSpecies[]> {
  const genera = options.genera ?? HORTICULTURE_GENERA;
  const delay = options.delayMs ?? 450;
  const out: DiscoveredSpecies[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < genera.length; i++) {
    const genus = genera[i];
    const params = new URLSearchParams({
      searchText: genus,
      stateProvince: options.stateName,
    });
    const hits = await webGet<UsdaHit[]>(
      `${USDA}/PlantSearch?${params}`,
    );

    for (const hit of hits ?? []) {
      if (hit.Plant?.Rank !== "Species") continue;
      const sci = parseScientific(hit.Plant.ScientificName ?? "");
      if (!sci) continue;
      const key = sci.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const common = stripHtml(hit.Plant.CommonName ?? "") || sci.split(" ")[0];
      out.push({
        scientific_name: sci,
        common_name: common,
        external_id: hit.Plant.Symbol,
        source: "usda",
      });
    }

    if (i % 10 === 0) {
      options.onProgress?.(
        `USDA ${options.stateName} — genus ${i + 1}/${genera.length}, ${out.length} species`,
      );
    }
    await sleep(delay);
  }

  return out;
}
