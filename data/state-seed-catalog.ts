/**
 * Per-state designer seed catalogs (trees, shrubs, herbs, flowers, natives).
 * Florida seeds remain in plants.seed.ts; TN and CT have dedicated modules.
 */
import type { Plant } from "../schema.js";
import type { DesignerStateCode } from "../lib/designer-states.js";
import { CT_FOOD_FOREST_COMPREHENSIVE } from "./ct-food-forest-comprehensive.js";
import { CT_FOOD_FOREST_MASTER } from "./ct-food-forest-master.js";
import { CT_FOOD_FOREST_PLANTS } from "./ct-food-forest-plants.js";
import { TN_FOOD_FOREST_COMPREHENSIVE } from "./tn-food-forest-comprehensive.js";
import { TN_FOOD_FOREST_MASTER } from "./tn-food-forest-master.js";
import { TN_FOOD_FOREST_PLANTS } from "./tn-food-forest-plants.js";
import { SEED_PLANTS } from "./plants.seed.js";

/** Later lists override earlier rows with the same id (master catalog wins). */
function mergeById(...lists: Plant[][]): Plant[] {
  const byId = new Map<string, Plant>();
  for (const list of lists) {
    for (const p of list) {
      byId.set(p.id, p);
    }
  }
  return [...byId.values()];
}

const BY_STATE: Record<DesignerStateCode, Plant[]> = {
  FL: SEED_PLANTS,
  TN: mergeById(
    TN_FOOD_FOREST_PLANTS,
    TN_FOOD_FOREST_COMPREHENSIVE,
    TN_FOOD_FOREST_MASTER,
  ),
  CT: mergeById(
    CT_FOOD_FOREST_PLANTS,
    CT_FOOD_FOREST_COMPREHENSIVE,
    CT_FOOD_FOREST_MASTER,
  ),
};

export function designerSeedsForState(stateCode: string): Plant[] {
  const code = stateCode.toUpperCase() as DesignerStateCode;
  return BY_STATE[code] ?? SEED_PLANTS;
}
