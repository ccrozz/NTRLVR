/**
 * Resolve companion_plants strings (e.g. "Corn", "Beans") to catalog rows.
 * In-memory seeds first — avoids hundreds of getPlantById calls per name on Vercel.
 */
import type { Plant } from "../schema.js";
import { SEED_PLANTS } from "../data/plants.seed.js";
import { designerSeedsForState } from "../data/state-seed-catalog.js";
import {
  DEFAULT_DESIGNER_STATE,
  DESIGNER_STATE_CODES,
  type DesignerStateCode,
  isDesignerStateCode,
} from "./designer-states.js";
import { applyDesignerProfile } from "./designer-plant-profiles.js";
import { getPlantById, listPlants } from "../db/plant-repository.js";
import { scoreCommonNameMatch } from "./companion-name-match.js";

export { scoreCommonNameMatch } from "./companion-name-match.js";

function companionSeedPool(stateCode?: DesignerStateCode): Plant[] {
  const byId = new Map<string, Plant>();
  const add = (list: Plant[]) => {
    for (const p of list) {
      if (!byId.has(p.id)) byId.set(p.id, applyDesignerProfile(p));
    }
  };
  const code =
    stateCode && isDesignerStateCode(stateCode)
      ? stateCode
      : DEFAULT_DESIGNER_STATE;
  add(designerSeedsForState(code));
  for (const st of DESIGNER_STATE_CODES) {
    if (st !== code) add(designerSeedsForState(st));
  }
  add(SEED_PLANTS);
  return [...byId.values()];
}

function bestNameMatch(
  plants: Plant[],
  target: string,
): { plant: Plant | null; score: number } {
  let plant: Plant | null = null;
  let score = 0;
  for (const p of plants) {
    const s = scoreCommonNameMatch(p.common_name, target);
    if (s > score) {
      score = s;
      plant = p;
    }
  }
  return { plant, score };
}

async function mergeStoredPlant(plant: Plant): Promise<Plant> {
  const stored = await getPlantById(plant.id);
  if (!stored) return plant;
  return {
    ...plant,
    ...stored,
    image_url: stored.image_url ?? plant.image_url,
  };
}

export async function findPlantByCommonName(
  name: string,
  stateCode?: DesignerStateCode,
): Promise<Plant | null> {
  const target = name.trim().toLowerCase();
  if (!target) return null;

  let { plant: best, score: bestScore } = bestNameMatch(
    companionSeedPool(stateCode),
    target,
  );

  if (bestScore >= 75 && best) {
    return mergeStoredPlant(best);
  }

  const st =
    stateCode && isDesignerStateCode(stateCode)
      ? stateCode
      : DEFAULT_DESIGNER_STATE;
  const { data } = await listPlants({
    search: name.trim(),
    native_state: st,
    for_my_area: false,
    limit: 24,
  });
  const fromDb = bestNameMatch(
    data.map((row) => applyDesignerProfile(row)),
    target,
  );
  if (fromDb.score > bestScore) {
    best = fromDb.plant;
    bestScore = fromDb.score;
  }

  if (!best || bestScore < 65) return null;

  return mergeStoredPlant(best);
}

export async function listPlantsByCommonNames(
  names: string[],
  stateCode?: DesignerStateCode,
): Promise<Plant[]> {
  const out: Plant[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const key = name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const plant = await findPlantByCommonName(name, stateCode);
    if (plant) out.push(plant);
  }
  return out;
}
