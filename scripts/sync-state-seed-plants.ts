/**
 * Upsert all designer state seed catalogs (FL + TN + CT) into SQLite.
 *
 *   npm run db:sync-state-seeds
 *   TREFLE_API_TOKEN=xxx npm run db:sync-state-seeds -- --enrich
 */
import { loadEnv } from "../lib/load-env.js";
import { DESIGNER_STATE_CODES } from "../lib/designer-states.js";
import { designerSeedsForState } from "../data/state-seed-catalog.js";
import {
  countPlants,
  getPlantById,
  upsertPlant,
} from "../db/plant-repository.js";
import { tagPlantForState } from "../lib/state-plant-import.js";
import {
  mergeLocalWithTrefle,
  searchTrefleByScientificName,
} from "../lib/trefle-api.js";
import { mapDetailToPlant } from "../trefle/map-plant.js";

loadEnv();

const enrich = process.argv.includes("--enrich");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const before = countPlants();
  let total = 0;

  for (const stateCode of DESIGNER_STATE_CODES) {
    const seeds = designerSeedsForState(stateCode);
    let upserted = 0;
    let enriched = 0;

    for (const plant of seeds) {
      let row = tagPlantForState(plant, stateCode);

      if (enrich && process.env.TREFLE_API_TOKEN) {
        await sleep(550);
        try {
          const detail = await searchTrefleByScientificName(
            plant.scientific_name,
          );
          if (detail) {
            row = tagPlantForState(
              mergeLocalWithTrefle(plant, {
                ...mapDetailToPlant(detail),
                id: plant.id,
              }),
              stateCode,
            );
            enriched++;
          }
        } catch {
          /* skip */
        }
      }

      const existing = getPlantById(plant.id);
      if (existing?.image_url?.trim() && !row.image_url?.trim()) {
        row = { ...row, image_url: existing.image_url };
      }
      upsertPlant(row);
      upserted++;
    }

    total += upserted;
    console.log(
      `${stateCode}: ${upserted} seeds${enrich ? ` (${enriched} Trefle-enriched)` : ""}`,
    );
  }

  console.log(`\n✅ Total upserted: ${total}`);
  console.log(`   Database: ${before} → ${countPlants()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
