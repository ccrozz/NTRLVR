/**
 * Recompute is_edible for all plants using name/taxonomy heuristics + uses/tags.
 * Run: npm run db:backfill-edible
 */
import { closeDb } from "./client.js";
import { listPlants, upsertPlant } from "./plant-repository-sqlite.js";
import { applyEdibleFlag } from "../lib/infer-is-edible.js";

const PAGE = 200;
let page = 1;
let updated = 0;
let edible = 0;
let total = 0;

for (;;) {
  const result = listPlants({ offset: (page - 1) * PAGE, limit: PAGE });
  total = result.total;
  const plants = result.data;
  if (!plants.length) break;

  for (const plant of plants) {
    const next = applyEdibleFlag(plant);
    if (next.is_edible !== plant.is_edible) {
      upsertPlant(next);
      updated++;
    }
    if (next.is_edible) edible++;
  }

  if (page * PAGE >= total) break;
  page++;
}

console.log(`Backfill complete: ${updated} rows updated, ${edible} edible of ${total} total.`);
closeDb();
