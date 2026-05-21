/**
 * Apply designer panel profiles to curated seed catalogs in SQLite.
 * Usage: npx tsx scripts/backfill-designer-profiles.ts
 *        npx tsx scripts/backfill-designer-profiles.ts --state=CT
 */
import { loadEnv } from "../lib/load-env.js";
import { designerSeedsForState } from "../data/state-seed-catalog.js";
import type { DesignerStateCode } from "../lib/designer-states.js";
import { DESIGNER_STATE_CODES } from "../lib/designer-states.js";
import { countPlants, getPlantById, upsertPlant } from "../db/plant-repository.js";
import { applyDesignerProfile } from "../lib/designer-plant-profiles.js";

loadEnv();

const stateArg = process.argv
  .find((a) => a.startsWith("--state="))
  ?.split("=")[1]
  ?.toUpperCase();

const states: DesignerStateCode[] =
  stateArg && DESIGNER_STATE_CODES.includes(stateArg as DesignerStateCode)
    ? [stateArg as DesignerStateCode]
    : DESIGNER_STATE_CODES;

async function main() {
  const before = countPlants();
  let total = 0;

  for (const stateCode of states) {
    const seeds = designerSeedsForState(stateCode);
    let n = 0;
    for (const plant of seeds) {
      const existing = getPlantById(plant.id);
      const base = existing ? { ...existing, ...plant, id: plant.id } : plant;
      const row = applyDesignerProfile(base);
      if (existing?.image_url?.trim() && !row.image_url?.trim()) {
        row.image_url = existing.image_url;
      }
      upsertPlant(row);
      n++;
      if (n % 100 === 0) console.log(`  ${stateCode} … ${n}/${seeds.length}`);
    }
    console.log(`${stateCode}: ${n} profiles applied`);
    total += n;
  }

  console.log(`\n✅ Designer profiles: ${total} seeds (${before} → ${countPlants()} DB rows)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
