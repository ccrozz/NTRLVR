/**
 * Upsert all curated seed plants into SQLite.
 * Usage: npx tsx scripts/sync-seed-plants.ts
 * Optional: TREFLE_API_KEY=xxx npx tsx scripts/sync-seed-plants.ts --enrich
 */
import { SEED_PLANTS } from "../data/plants.seed.js";
import {
  getPlantById,
  upsertPlant,
  countPlants,
} from "../db/plant-repository.js";
import { searchTrefleByScientificName, mapTrefleDetailToPlant } from "../lib/trefle-api.js";
import { mergeLocalWithTrefle } from "../lib/trefle-api.js";

const enrich = process.argv.includes("--enrich");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const before = countPlants();
  let upserted = 0;
  let enriched = 0;

  for (const plant of SEED_PLANTS) {
    let row = plant;

    if (enrich && process.env.TREFLE_API_KEY) {
      await sleep(550);
      try {
        const detail = await searchTrefleByScientificName(plant.scientific_name);
        if (detail) {
          const mapped = mapTrefleDetailToPlant(detail);
          row = mergeLocalWithTrefle(plant, { ...mapped, id: plant.id });
          enriched++;
        }
      } catch (e) {
        console.warn(
          `  enrich skip ${plant.id}: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    const existing = getPlantById(plant.id);
    if (existing?.image_url?.trim() && !row.image_url?.trim()) {
      row = { ...row, image_url: existing.image_url };
    }
    upsertPlant(row);
    upserted++;
    if (upserted % 25 === 0) {
      console.log(`  … ${upserted}/${SEED_PLANTS.length}`);
    }
  }

  const after = countPlants();
  console.log(`\n✅ Upserted ${upserted} curated plants (${SEED_PLANTS.length} in catalog)`);
  if (enrich) console.log(`   Trefle-enriched: ${enriched}`);
  console.log(`   Database plant rows: ${before} → ${after}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
