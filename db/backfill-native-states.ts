/**
 * Look up USDA native states for plants missing native_states.
 * Run: npm run db:backfill-native
 */
import { closeDb } from "./client.js";
import { listPlants, upsertPlant } from "./plant-repository.js";
import { fetchNativeStatesForPlant } from "../lib/usda-plants.js";

const DELAY_MS = 280;
const MAX = parseInt(process.env.BACKFILL_NATIVE_MAX ?? "0", 10) || Infinity;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let page = 1;
const PAGE = 100;
let updated = 0;
let scanned = 0;

for (;;) {
  const { data: plants, total } = listPlants({
    offset: (page - 1) * PAGE,
    limit: PAGE,
  });
  if (!plants.length) break;

  for (const plant of plants) {
    if (scanned >= MAX) break;
    scanned++;

    if (plant.native_states.length > 0) continue;

    const usda = await fetchNativeStatesForPlant(
      plant.scientific_name,
      plant.florida_hardiness_zones,
    );

    if (usda.native_states.length) {
      upsertPlant({
        ...plant,
        native_states: usda.native_states,
        is_florida_native:
          usda.native_states.includes("FL") || plant.is_florida_native,
      });
      updated++;
      console.log(
        `✓ ${plant.common_name}: ${usda.native_states.join(", ")}`,
      );
    }

    await sleep(DELAY_MS);
  }

  if (scanned >= MAX || page * PAGE >= total) break;
  page++;
}

console.log(`\nDone. Updated ${updated} of ${scanned} scanned.`);
closeDb();
