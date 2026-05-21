import type { DesignerStateCode } from "../designer-states.js";
import { dedupeDiscovered, type DiscoveredSpecies } from "./discovered-species.js";
import { harvestGbifSpeciesForState } from "./gbif-state.js";
import { harvestInaturalistSpeciesForPlace } from "./inaturalist-place.js";
import { harvestUsdaSpeciesForState } from "./usda-state.js";
import { webHarvestConfig } from "./state-config.js";

export type WebHarvestSources = {
  inaturalist: boolean;
  gbif: boolean;
  usda: boolean;
};

export type WebHarvestLimits = {
  inatMax: number;
  gbifMax: number;
};

export type WebHarvestResult = {
  discovered: DiscoveredSpecies[];
  counts: { inaturalist: number; gbif: number; usda: number };
};

/**
 * Aggregate plant species for a state from public web APIs:
 * iNaturalist, GBIF, USDA PLANTS (then enrich via Wikipedia/USDA/iNat per row).
 */
export async function harvestWebSpeciesForState(
  stateCode: DesignerStateCode,
  sources: WebHarvestSources,
  limits: WebHarvestLimits,
  onProgress?: (msg: string) => void,
): Promise<WebHarvestResult> {
  const cfg = webHarvestConfig(stateCode);
  const log = onProgress ?? (() => {});

  const lists: DiscoveredSpecies[][] = [];

  if (sources.inaturalist) {
    log(`── iNaturalist (${cfg.stateName}) ──`);
    const inat = await harvestInaturalistSpeciesForPlace({
      placeId: cfg.inaturalistPlaceId,
      maxSpecies: limits.inatMax,
      onProgress: log,
    });
    lists.push(inat);
    log(`  iNaturalist species: ${inat.length}`);
  }

  if (sources.gbif) {
    log(`── GBIF (${cfg.gbifStateProvince}) ──`);
    const gbif = await harvestGbifSpeciesForState({
      stateProvince: cfg.gbifStateProvince,
      maxSpecies: limits.gbifMax,
      onProgress: log,
    });
    lists.push(gbif);
    log(`  GBIF species: ${gbif.length}`);
  }

  if (sources.usda) {
    log(`── USDA PLANTS (${cfg.stateName}) ──`);
    const usda = await harvestUsdaSpeciesForState({
      stateName: cfg.stateName,
      onProgress: log,
    });
    lists.push(usda);
    log(`  USDA species: ${usda.length}`);
  }

  const discovered = dedupeDiscovered(lists);
  let inatN = 0;
  let gbifN = 0;
  let usdaN = 0;
  let idx = 0;
  if (sources.inaturalist) inatN = lists[idx++]?.length ?? 0;
  if (sources.gbif) gbifN = lists[idx++]?.length ?? 0;
  if (sources.usda) usdaN = lists[idx++]?.length ?? 0;

  return {
    discovered,
    counts: { inaturalist: inatN, gbif: gbifN, usda: usdaN },
  };
}
