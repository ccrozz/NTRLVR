import type { DesignerStateCode } from "../designer-states.js";
import type { Plant } from "../../schema.js";
import { enrichPlantFromWeb } from "../enrich-plant.js";
import { fetchBestPlantImage } from "../plant-images.js";
import { getPlantById, upsertPlant } from "../../db/plant-repository-sqlite.js";
import { tagPlantForState } from "../state-plant-import.js";
import { discoveredSpeciesToPlant } from "./species-to-plant.js";
import type { DiscoveredSpecies } from "./discovered-species.js";
import { sleep } from "./http.js";

export type ImportDiscoveredOptions = {
  stateCode: DesignerStateCode;
  enrich: boolean;
  images: boolean;
  edibleOnly: boolean;
  maxRows?: number;
  enrichDelayMs?: number;
  imageDelayMs?: number;
  onProgress?: (msg: string) => void;
};

export type ImportDiscoveredResult = {
  upserted: number;
  enriched: number;
  imagesAdded: number;
  skippedEdible: number;
};

export async function importDiscoveredSpecies(
  species: DiscoveredSpecies[],
  options: ImportDiscoveredOptions,
): Promise<ImportDiscoveredResult> {
  const log = options.onProgress ?? (() => {});
  const max = options.maxRows ?? species.length;
  const enrichDelay = options.enrichDelayMs ?? 400;
  const imageDelay = options.imageDelayMs ?? 500;
  let upserted = 0;
  let enriched = 0;
  let imagesAdded = 0;
  let skippedEdible = 0;

  const queue = species.slice(0, max);

  for (let i = 0; i < queue.length; i++) {
    const row = queue[i];
    let plant = tagPlantForState(
      discoveredSpeciesToPlant(row, options.stateCode),
      options.stateCode,
    );

    if (options.edibleOnly && !plant.is_edible) {
      skippedEdible++;
      continue;
    }

    const existing = getPlantById(plant.id);
    if (existing?.image_url?.trim() && !plant.image_url?.trim()) {
      plant = { ...plant, image_url: existing.image_url };
    }

    if (options.enrich) {
      try {
        const result = await enrichPlantFromWeb(plant);
        plant = tagPlantForState(result.plant, options.stateCode);
        if (result.enriched) enriched++;
        await sleep(enrichDelay);
      } catch {
        /* best-effort */
      }
    } else if (options.images && !plant.image_url?.trim()) {
      try {
        const img = await fetchBestPlantImage(
          plant.common_name,
          plant.scientific_name,
        );
        await sleep(imageDelay);
        if (img) {
          plant = { ...plant, image_url: img.image_url };
          imagesAdded++;
        }
      } catch {
        /* skip */
      }
    }

    upsertPlant(plant);
    upserted++;

    if ((i + 1) % 25 === 0) {
      log(`  imported ${i + 1}/${queue.length}…`);
    }
  }

  return { upserted, enriched, imagesAdded, skippedEdible };
}
