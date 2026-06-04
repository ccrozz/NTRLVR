/**
 * Clear FL native labels wrongly applied to IFAS cultivars and state-tagged rows.
 * Run: npx tsx scripts/fix-spurious-native-labels.ts
 */
import { closeDb } from "../db/client.js";
import { listPlants, upsertPlant } from "../db/plant-repository-sqlite.js";
import {
  effectiveIsFloridaNative,
  effectiveNativeStates,
  isIfasCultivar,
} from "../lib/plant-native-status.js";

let updated = 0;
let page = 1;
const PAGE = 200;

for (;;) {
  const { data: plants, total } = listPlants({
    offset: (page - 1) * PAGE,
    limit: PAGE,
  });
  if (!plants.length) break;

  for (const plant of plants) {
    const nextNativeStates = effectiveNativeStates(plant);
    const nextFlNative = effectiveIsFloridaNative(plant);
    const shouldClear =
      isIfasCultivar(plant) ||
      (plant.native_states.includes("FL") && !nextFlNative) ||
      (plant.is_florida_native && !nextFlNative);

    if (!shouldClear && nextNativeStates.join() === plant.native_states.join()) {
      continue;
    }

    upsertPlant({
      ...plant,
      native_states: nextNativeStates,
      is_florida_native: nextFlNative,
    });
    updated++;
    console.log(`✓ ${plant.common_name}`);
  }

  if (page * PAGE >= total) break;
  page++;
}

console.log(`\nDone. Updated ${updated} plants.`);
closeDb();
