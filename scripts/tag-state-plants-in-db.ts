/**
 * Tag existing SQLite plants that grow in TN or CT (zone overlap or state native).
 *
 *   npx tsx scripts/tag-state-plants-in-db.ts
 *   npx tsx scripts/tag-state-plants-in-db.ts --state=TN
 */
import { loadEnv } from "../lib/load-env.js";
import type { DesignerStateCode } from "../lib/designer-states.js";
import { getDb } from "../db/client.js";
import { countPlants, rowToPlant, upsertPlant } from "../db/plant-repository-sqlite.js";
import {
  plantGrowsInState,
  tagPlantForState,
} from "../lib/state-plant-import.js";

loadEnv();

const stateArg = process.argv
  .find((a) => a.startsWith("--state="))
  ?.split("=")[1]
  ?.toUpperCase();
const states: DesignerStateCode[] =
  stateArg === "TN" || stateArg === "CT"
    ? [stateArg]
    : ["TN", "CT"];

function main() {
  const rows = getDb()
    .prepare("SELECT * FROM plants ORDER BY common_name")
    .all() as Parameters<typeof rowToPlant>[0][];

  const before = countPlants();
  let tagged = 0;

  for (const row of rows) {
    const plant = rowToPlant(row);
    for (const stateCode of states) {
      if (!plantGrowsInState(plant, stateCode)) continue;
      const next = tagPlantForState(plant, stateCode);
      if (JSON.stringify(next.tags) !== JSON.stringify(plant.tags)) {
        upsertPlant(next);
        tagged++;
      }
      break;
    }
  }

  console.log(
    `Tagged ${tagged} plants for ${states.join(", ")} (${before} → ${countPlants()} rows)`,
  );
}

main();
