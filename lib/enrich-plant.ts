import type { Plant } from "../schema.js";
import { loadEnv } from "./load-env.js";
import {
  mergeZoneLists,
  parseHardinessZonesFromText,
  zonesFromNativeStates,
  zonesFromTrefleGrowth,
} from "./infer-hardiness-zones.js";
import {
  applyFinalBenefits,
  mergeEnrichedPlant,
  needsHardinessEnrichment,
  needsNativeStateEnrichment,
  needsRelationEnrichment,
  needsUsScopeEnrichment,
  plantNeedsEnrichment,
  plantNeedsAnyEnrichment,
  type EnrichmentResult,
} from "./plant-enrichment.js";
import { fetchUsdaPlantFacts } from "./usda-plants.js";
import {
  growsInUsFromObservations,
  growsInUsFromTrefleDetail,
} from "./us-distribution.js";
import { curatedPatchForPlant } from "./curated-plant-knowledge.js";
import { parseWikipediaExtract } from "./wiki-parse.js";
import { fetchBestPlantImage } from "./plant-images.js";
import { fetchWikipediaForPlant } from "./wikipedia.js";
import { TrefleClient } from "../trefle/client.js";
import { mapDetailToPlant } from "../trefle/map-plant.js";
import { TrefleRateLimitError } from "../trefle/errors.js";
import type { TreflePlantDetail } from "../trefle/types.js";

loadEnv();

function normalizeCompanionEntries(names: string[]): string[] {
  return names
    .map((n) =>
      n
        .replace(/\s+/g, " ")
        .replace(/^(the|a|an)\s+/i, "")
        .trim(),
    )
    .filter((n) => n.length > 2 && n.length < 80)
    .slice(0, 8);
}

function collectHardinessZones(
  plant: Plant,
  detail: TreflePlantDetail | null,
  wikiText: string | null,
): string[] {
  const sp = detail?.main_species ?? null;
  return mergeZoneLists(
    plant.florida_hardiness_zones,
    zonesFromTrefleGrowth(sp?.growth),
    parseHardinessZonesFromText(wikiText ?? ""),
    parseHardinessZonesFromText(plant.care_summary),
    zonesFromNativeStates(plant.native_states),
  );
}

/**
 * Fetch and merge data from Trefle, Wikipedia, and USDA.
 * Caller should upsert the returned plant so the next load is instant.
 */
export async function enrichPlantFromWeb(plant: Plant): Promise<EnrichmentResult> {
  if (!plantNeedsAnyEnrichment(plant)) {
    return { plant, sources: [], enriched: false };
  }

  const sources: string[] = [];
  let current = plant;
  let trefleDetail: TreflePlantDetail | null = null;

  const token = process.env.TREFLE_API_TOKEN;
  if (token && plant.trefle_slug) {
    try {
      const client = new TrefleClient(token, 0);
      const { data } = await client.fetchPlantBySlug(plant.trefle_slug);
      trefleDetail = data;
      const fromApi = mapDetailToPlant(data, { storeJson: true });
      current = mergeEnrichedPlant(current, fromApi, "trefle");
      if (!sources.includes("Trefle")) sources.push("Trefle");
    } catch (err) {
      if (err instanceof TrefleRateLimitError) {
        sources.push("Trefle (rate limited)");
      }
    }
  } else if (plant.trefle_json) {
    try {
      trefleDetail = JSON.parse(plant.trefle_json) as TreflePlantDetail;
    } catch {
      /* ignore */
    }
  }

  if (trefleDetail && growsInUsFromTrefleDetail(trefleDetail)) {
    current = mergeEnrichedPlant(current, { grows_in_us: true }, "trefle");
  } else if (growsInUsFromObservations(current.observations)) {
    current = mergeEnrichedPlant(current, { grows_in_us: true }, "trefle");
  }

  if (!current.image_url) {
    try {
      const img = await fetchBestPlantImage(
        current.common_name,
        current.scientific_name,
      );
      if (img) {
        current = mergeEnrichedPlant(
          current,
          { image_url: img.image_url },
          img.source,
        );
        const label =
          img.source.charAt(0).toUpperCase() + img.source.slice(1);
        if (!sources.includes(label)) sources.push(label);
      }
    } catch {
      /* best-effort */
    }
  }

  const needsWiki =
    plantNeedsEnrichment(current) || needsRelationEnrichment(current);
  let wikiFullText: string | null = null;

  if (needsWiki) {
    const wiki = await fetchWikipediaForPlant(
      plant.scientific_name,
      plant.common_name,
    );
    wikiFullText = wiki.full_extract;

    const patch: Partial<Plant> = {};

    if (plantNeedsEnrichment(current) && wiki.care_summary) {
      patch.care_summary = wiki.care_summary;
      if (!current.image_url && wiki.image_url) {
        patch.image_url = wiki.image_url;
      }
    }

    if (wiki.full_extract) {
      const parsed = parseWikipediaExtract(wiki.full_extract);
      if (parsed.benefits.length) patch.benefits = parsed.benefits;
      if (parsed.companion_plants.length) {
        patch.companion_plants = normalizeCompanionEntries(
          parsed.companion_plants,
        );
      }
      if (parsed.avoid_planting_near.length) {
        patch.avoid_planting_near = normalizeCompanionEntries(
          parsed.avoid_planting_near,
        );
      }
    }

    if (
      patch.care_summary ||
      patch.benefits?.length ||
      patch.companion_plants?.length ||
      patch.avoid_planting_near?.length
    ) {
      current = mergeEnrichedPlant(current, patch, "wikipedia");
      if (!sources.some((s) => s.startsWith("Wikipedia"))) {
        sources.push(
          wiki.title ? `Wikipedia (${wiki.title})` : "Wikipedia",
        );
      }
    }
  }

  if (needsRelationEnrichment(current)) {
    const curated = curatedPatchForPlant(current.scientific_name);
    if (
      curated.benefits?.length ||
      curated.companion_plants?.length ||
      curated.avoid_planting_near?.length
    ) {
      current = mergeEnrichedPlant(current, curated, "curated");
      if (!sources.includes("Florida food forest guide")) {
        sources.push("Florida food forest guide");
      }
    }
  }

  if (
    needsNativeStateEnrichment(current) ||
    needsUsScopeEnrichment(current) ||
    needsHardinessEnrichment(current)
  ) {
    try {
      const zones = collectHardinessZones(current, trefleDetail, wikiFullText);
      const usda = await fetchUsdaPlantFacts(
        current.scientific_name,
        zones.length ? zones : current.florida_hardiness_zones,
      );

      const usdaPatch: Partial<Plant> = {};

      if (usda.grows_in_us) usdaPatch.grows_in_us = true;
      if (usda.native_states.length) {
        usdaPatch.native_states = usda.native_states;
        usdaPatch.is_florida_native = usda.native_states.includes("FL");
      }

      const mergedZones = mergeZoneLists(
        zones,
        zonesFromNativeStates(usda.native_states),
      );
      if (mergedZones.length) {
        usdaPatch.florida_hardiness_zones = mergedZones;
      }

      if (Object.keys(usdaPatch).length) {
        current = mergeEnrichedPlant(current, usdaPatch, "usda");
        if (!sources.includes("USDA PLANTS")) sources.push("USDA PLANTS");
      }
    } catch {
      /* best-effort */
    }
  }

  if (needsHardinessEnrichment(current)) {
    const zones = collectHardinessZones(current, trefleDetail, wikiFullText);
    if (zones.length) {
      current = mergeEnrichedPlant(
        current,
        { florida_hardiness_zones: zones },
        "zones",
      );
      if (!sources.includes("Hardiness zones")) {
        sources.push("Hardiness zones");
      }
    }
  }

  const benefitsBefore = JSON.stringify(current.benefits);
  current = applyFinalBenefits(current);
  if (JSON.stringify(current.benefits) !== benefitsBefore) {
    if (!sources.includes("Plant profile")) sources.push("Plant profile");
  }

  return {
    plant: current,
    sources,
    enriched: sources.length > 0,
  };
}
