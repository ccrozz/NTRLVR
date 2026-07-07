import type { CanopyLayer } from "../schema.js";
import { plantToSummary } from "../db/plant-repository.js";
import { listStateDesignerPlants } from "./state-designer-catalog.js";
import {
  DEFAULT_DESIGNER_STATE,
  type DesignerStateCode,
  isDesignerStateCode,
} from "./designer-states.js";
import { catalogRowIsFoodForestTree } from "./food-forest-groups.js";
import {
  dedupeOrderedIds,
  dedupeOrderedIdsByName,
  dedupePlantsByName,
} from "./plant-dedupe.js";
import {
  buildGardenerProfileText,
  deriveGoalsFromPreferences,
  maxPlantsForCanvas,
  normalizePreferences,
  scoreCatalogRow,
  targetPlantCountFromPreferences,
  type GardenPreferences,
} from "./food-forest-questionnaire.js";
import { treeCompanionPlants } from "./tree-companion-profiles.js";
import { findPlantByCommonName } from "./companion-catalog-lookup.js";
import { scoreCommonNameMatch } from "./companion-name-match.js";

export type EnhanceExistingPlant = {
  plant_id: string;
  common_name: string;
  scientific_name?: string;
  canopy_layer: CanopyLayer;
  category: string;
  x: number;
  y: number;
  canvas_radius_feet: number;
};

export type EnhancePlantAssignment = {
  plant_id: string;
  host_plant_id: string;
};

export type FoodForestEnhanceRequest = {
  hardiness_zone: string;
  native_state?: string;
  width_feet: number;
  height_feet: number;
  preferences: GardenPreferences;
  existing_plants: EnhanceExistingPlant[];
  user_notes?: string;
  target_count?: number;
};

export type FoodForestEnhanceResponse = {
  plant_ids: string[];
  assignments: EnhancePlantAssignment[];
  source: "ai" | "heuristic";
  target_count: number;
  message?: string;
  guild_name?: string;
  guild_description?: string;
};

type CatalogRow = {
  id: string;
  common_name: string;
  scientific_name: string;
  canopy_layer: CanopyLayer;
  category: string;
  radius_ft: number;
  native: boolean;
  edible: boolean;
  tags: string[];
  is_kitchen_essential: boolean;
};

const UNDERSTORY_LAYERS: CanopyLayer[] = [
  "Understory",
  "Shrub",
  "Herbaceous",
  "Groundcover",
  "Vine",
];

function resolveStateCode(native_state?: string): DesignerStateCode {
  return isDesignerStateCode(native_state ?? "")
    ? (native_state!.toUpperCase() as DesignerStateCode)
    : DEFAULT_DESIGNER_STATE;
}

async function loadCatalogForZone(
  zone: string,
  stateCode: DesignerStateCode = DEFAULT_DESIGNER_STATE,
  limit = 180,
): Promise<CatalogRow[]> {
  const toRow = (
    p: Awaited<ReturnType<typeof listStateDesignerPlants>>[number],
  ) => {
    const s = plantToSummary(p);
    return {
      id: s.id,
      common_name: s.common_name,
      scientific_name: s.scientific_name,
      canopy_layer: s.canopy_layer,
      category: s.category,
      radius_ft: s.canvas_radius_feet || 3,
      native: s.is_florida_native,
      edible: s.is_edible,
      tags: p.tags,
      is_kitchen_essential: p.is_kitchen_essential,
    };
  };

  let rows = (
    await listStateDesignerPlants({
      hardiness_zone: zone,
      exclude_invasive: true,
      native_state: stateCode,
      for_my_area: true,
    })
  )
    .slice(0, limit)
    .map(toRow);

  if (rows.length < 50) {
    const seen = new Set(rows.map((r) => r.id));
    for (const p of await listStateDesignerPlants({
      exclude_invasive: true,
      native_state: stateCode,
      for_my_area: true,
    })) {
      const row = toRow(p);
      if (!seen.has(row.id)) {
        seen.add(row.id);
        rows.push(row);
      }
      if (rows.length >= limit) break;
    }
  }

  return rows;
}

function catalogPromptLines(rows: CatalogRow[]): string {
  return rows
    .slice(0, 140)
    .map(
      (r) =>
        `${r.id}\t${r.common_name}\t${r.canopy_layer}\t${r.category}\tr${r.radius_ft}ft${r.native ? "\tnative" : ""}`,
    )
    .join("\n");
}

function isLockedTree(
  plant: EnhanceExistingPlant,
  stateCode: DesignerStateCode,
): boolean {
  return catalogRowIsFoodForestTree(
    { category: plant.category, edible: true },
    stateCode,
  );
}

function isNewOverstoryTree(row: CatalogRow, stateCode: DesignerStateCode): boolean {
  if (row.canopy_layer !== "Overstory" && row.canopy_layer !== "Understory") {
    return false;
  }
  return catalogRowIsFoodForestTree(row, stateCode);
}

export function resolveEnhanceTargetCount(
  areaSqFt: number,
  existingCount: number,
  treeCount: number,
  prefs: GardenPreferences,
): number {
  const density = prefs.density ?? "balanced";
  const fullTarget = targetPlantCountFromPreferences(areaSqFt, {
    ...prefs,
    gardenStyle: "food_forest",
  });
  const cap = maxPlantsForCanvas(areaSqFt, density);
  const budget = Math.max(0, cap - existingCount);
  const ideal = Math.max(6, fullTarget - Math.max(1, treeCount) * 2);
  return Math.min(budget, ideal, 28);
}

function resolveScientificName(
  plant: EnhanceExistingPlant,
  catalog: CatalogRow[],
): string {
  const fromReq = plant.scientific_name?.trim();
  if (fromReq) return fromReq;
  return (
    catalog.find((r) => r.id === plant.plant_id)?.scientific_name ?? ""
  );
}

function resolveCompanionId(
  name: string,
  catalog: CatalogRow[],
  used: Set<string>,
  locked: Set<string>,
): string | null {
  let best: CatalogRow | null = null;
  let bestScore = 0;
  for (const row of catalog) {
    if (used.has(row.id) || locked.has(row.id)) continue;
    if (isNewOverstoryTree(row, DEFAULT_DESIGNER_STATE)) continue;
    const score = scoreCommonNameMatch(row.common_name, name);
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return best && bestScore >= 65 ? best.id : null;
}

async function heuristicEnhancePick(
  req: FoodForestEnhanceRequest,
  catalog: CatalogRow[],
  target: number,
  stateCode: DesignerStateCode,
): Promise<{ ids: string[]; assignments: EnhancePlantAssignment[] }> {
  const prefs = normalizePreferences(req.preferences);
  const locked = new Set(req.existing_plants.map((p) => p.plant_id));
  const used = new Set<string>();
  const ids: string[] = [];
  const assignments: EnhancePlantAssignment[] = [];

  const trees = req.existing_plants.filter((p) => isLockedTree(p, stateCode));

  for (const tree of trees) {
    const sci = resolveScientificName(tree, catalog);
    const companions = treeCompanionPlants(sci, tree.plant_id) ?? [];
    for (const name of companions.slice(0, 3)) {
      const id = resolveCompanionId(name, catalog, used, locked);
      if (!id) continue;
      used.add(id);
      ids.push(id);
      assignments.push({ plant_id: id, host_plant_id: tree.plant_id });
      if (ids.length >= target) {
        return { ids: dedupeOrderedIds(ids), assignments };
      }
    }
  }

  const pool = catalog.filter(
    (row) =>
      !locked.has(row.id) &&
      !used.has(row.id) &&
      !isNewOverstoryTree(row, stateCode) &&
      UNDERSTORY_LAYERS.includes(row.canopy_layer),
  );

  const scored = pool
    .map((row) => ({
      row,
      score: scoreCatalogRow(row, prefs),
    }))
    .sort((a, b) => b.score - a.score);

  for (const { row } of scored) {
    if (ids.length >= target) break;
    if (used.has(row.id)) continue;
    used.add(row.id);
    ids.push(row.id);
  }

  return {
    ids: dedupeOrderedIdsByName(ids, (id) => catalog.find((r) => r.id === id)),
    assignments,
  };
}

async function callAnthropicEnhance(
  req: FoodForestEnhanceRequest,
  catalog: CatalogRow[],
  target: number,
  stateCode: DesignerStateCode,
): Promise<{
  ids: string[];
  message?: string;
  guild_name?: string;
  guild_description?: string;
} | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key || process.env.FOOD_FOREST_LAYOUT_AI === "false") return null;

  const prefs = normalizePreferences(req.preferences);
  const goals = deriveGoalsFromPreferences(prefs).join(", ");
  const profile = buildGardenerProfileText(prefs);
  const validIds = new Set(catalog.map((r) => r.id));
  const locked = req.existing_plants
    .map(
      (p) =>
        `- ${p.common_name} (${p.plant_id}) at layer ${p.canopy_layer}, ~${p.canvas_radius_feet}ft spread`,
    )
    .join("\n");

  const system = `You are an expert permaculture designer completing an existing food forest. Pick plants ONLY from the catalog (first column = id). Return valid JSON only:
{"plant_ids":["id1","id2",...],"message":"one short sentence about the understory guild","guild_name":"short title","guild_description":"2 sentences"}

Rules:
- Pick exactly ${target} different plant ids for UNDERSTORY layers only.
- DO NOT pick new fruit trees, citrus, or canopy trees — those are already planted.
- Allowed layers: Shrub, Herbaceous, Groundcover, Vine, support species, nitrogen fixers, pollinators.
- Match each locked tree with 1–2 companions from the catalog when possible (comfrey, pigeon pea, lemongrass, sweet potato, marigold, etc.).
- Match USDA zone ${req.hardiness_zone}. Goals: ${goals}.
- Bed ${req.width_feet}×${req.height_feet} ft.`;

  const userNotes = req.user_notes?.trim()
    ? `\nGardener notes: ${req.user_notes.trim()}`
    : "";

  const user = `Gardener profile:\n${profile}\n\nLOCKED trees (do not replace or duplicate):\n${locked || "(none)"}${userNotes}\n\nCatalog (id, name, layer, category, radius):\n${catalogPromptLines(catalog)}\n\nComplete the food forest understory around the locked trees.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
      max_tokens: 1400,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) return null;

  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = json.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as {
      plant_ids?: string[];
      message?: string;
      guild_name?: string;
      guild_description?: string;
    };
    const ids = dedupeOrderedIds(
      (parsed.plant_ids ?? []).filter(
        (id) => validIds.has(id) && !req.existing_plants.some((p) => p.plant_id === id),
      ),
    ).filter((id) => {
      const row = catalog.find((r) => r.id === id);
      return row && !isNewOverstoryTree(row, stateCode);
    });
    if (!ids.length) return null;
    return {
      ids,
      message: parsed.message,
      guild_name: parsed.guild_name,
      guild_description: parsed.guild_description,
    };
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]) as {
        plant_ids?: string[];
        message?: string;
        guild_name?: string;
        guild_description?: string;
      };
      const ids = dedupeOrderedIds(
        (parsed.plant_ids ?? []).filter((id) => validIds.has(id)),
      );
      return ids.length
        ? {
            ids,
            message: parsed.message,
            guild_name: parsed.guild_name,
            guild_description: parsed.guild_description,
          }
        : null;
    } catch {
      return null;
    }
  }
}

function buildAssignmentsFromHeuristic(
  ids: string[],
  heuristicAssignments: EnhancePlantAssignment[],
): EnhancePlantAssignment[] {
  const byPlant = new Map(
    heuristicAssignments.map((a) => [a.plant_id, a.host_plant_id]),
  );
  return ids
    .filter((id) => byPlant.has(id))
    .map((plant_id) => ({
      plant_id,
      host_plant_id: byPlant.get(plant_id)!,
    }));
}

export async function generateFoodForestEnhance(
  req: FoodForestEnhanceRequest,
): Promise<FoodForestEnhanceResponse> {
  const prefs = normalizePreferences({
    ...req.preferences,
    gardenStyle: "food_forest",
  });
  const stateCode = resolveStateCode(req.native_state);
  const area = req.width_feet * req.height_feet;
  const treeCount = req.existing_plants.filter((p) =>
    isLockedTree(p, stateCode),
  ).length;
  const target =
    req.target_count ??
    resolveEnhanceTargetCount(
      area,
      req.existing_plants.length,
      treeCount,
      prefs,
    );

  const catalog = await loadCatalogForZone(
    req.hardiness_zone,
    stateCode,
  );

  const heuristic = await heuristicEnhancePick(
    req,
    catalog,
    target,
    stateCode,
  );

  const ai = await callAnthropicEnhance(req, catalog, target, stateCode);

  if (ai && ai.ids.length >= Math.min(4, target)) {
    const heuristicMap = new Map(
      heuristic.assignments.map((a) => [a.plant_id, a]),
    );
    const assignments = ai.ids
      .filter((id) => heuristicMap.has(id))
      .map((id) => heuristicMap.get(id)!);

    return {
      plant_ids: ai.ids.slice(0, target),
      assignments,
      source: "ai",
      target_count: target,
      message: ai.message,
      guild_name: ai.guild_name ?? "Understory guild plan",
      guild_description:
        ai.guild_description ?? ai.message ?? "Understory plants for your food forest.",
    };
  }

  const minIds = Math.min(target, Math.max(4, heuristic.ids.length));
  const ids = heuristic.ids.slice(0, minIds);

  if (!ids.length) {
    for (const name of ["Comfrey", "Pigeon Pea", "Sweet Potato", "Lemongrass"]) {
      const plant = await findPlantByCommonName(name, stateCode);
      if (plant && !req.existing_plants.some((p) => p.plant_id === plant.id)) {
        ids.push(plant.id);
      }
      if (ids.length >= 4) break;
    }
  }

  return {
    plant_ids: dedupeOrderedIds(ids),
    assignments: buildAssignmentsFromHeuristic(ids, heuristic.assignments),
    source: "heuristic",
    target_count: target,
    message:
      treeCount > 0
        ? `Filled understory layers around your ${treeCount} fruit tree${treeCount === 1 ? "" : "s"}.`
        : "Added shrubs, herbs, and groundcovers to build out your bed.",
    guild_name: "Guild completion plan",
    guild_description:
      treeCount > 0
        ? `Understory picks matched to your existing trees — nitrogen fixers, living mulch, and pollinator plants to round out the food forest.`
        : "Layered understory plants to diversify your bed.",
  };
}

export function resolveEnhancePlants(
  catalog: CatalogRow[],
  plantIds: string[],
): CatalogRow[] {
  const byId = new Map(catalog.map((r) => [r.id, r]));
  return dedupePlantsByName(
    plantIds
      .map((id) => byId.get(id))
      .filter((r): r is CatalogRow => !!r),
  );
}
