/**
 * Apply designer panel profiles to every plant row in SQLite.
 * Usage: npx tsx scripts/backfill-designer-profiles.ts
 */
import { SEED_PLANTS } from "../data/plants.seed.js";
import { countPlants, getPlantById, upsertPlant } from "../db/plant-repository.js";
import { applyDesignerProfile } from "../lib/designer-plant-profiles.js";

async function main() {
  const before = countPlants();
  let upserted = 0;

  for (const plant of SEED_PLANTS) {
    const existing = getPlantById(plant.id);
    const base = existing ? { ...existing, ...plant, id: plant.id } : plant;
    const row = applyDesignerProfile(base);
    if (existing?.image_url?.trim() && !row.image_url?.trim()) {
      row.image_url = existing.image_url;
    }
    upsertPlant(row);
    upserted++;
    if (upserted % 50 === 0) {
      console.log(`  … ${upserted}/${SEED_PLANTS.length}`);
    }
  }

  console.log(`\n✅ Designer profiles applied to ${upserted} plants (${before} rows in DB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
