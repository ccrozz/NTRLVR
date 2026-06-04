import type { CanopyLayer, PlantSummary } from "../schema.js";
import { plantToSummary } from "../db/plant-repository.js";
import { listStateDesignerPlants } from "./state-designer-catalog.js";
import {
  DEFAULT_DESIGNER_STATE,
  type DesignerStateCode,
  isDesignerStateCode,
} from "./designer-states.js";
import {
  dedupeOrderedIds,
  dedupeOrderedIdsByName,
  dedupePlantsByName,
} from "./plant-dedupe.js";
import {
  aiPickingRulesForGardenStyle,
  catalogRowMatchesGardenStyle,
  filterCatalogForGardenStyle,
  filterIdsForGardenStyle,
  heuristicMessageForStyle,
  layoutUserPromptForStyle,
  topUpIdsForGardenStyle,
} from "./garden-style-catalog.js";
import {
  buildGardenerProfileText,
  deriveGoalsFromPreferences,
  maxPlantsForCanvas,
  normalizePreferences,
  scoreCatalogRow,
  targetFoodForestTreeCount,
  targetPlantCountFromPreferences,
  type FoodForestLayoutGoal,
  type GardenPreferences,
  type PlantingDensity,
} from "./food-forest-questionnaire.js";

export type { FoodForestLayoutGoal, GardenPreferences };

export type FoodForestLayoutRequest = {
  hardiness_zone: string;
  /** Designer state for catalog (FL, TN, CT). */
  native_state?: string;
  width_feet: number;
  height_feet: number;
  preferences: GardenPreferences;
  /** @deprecated Legacy; derived from preferences when omitted */
  goals?: FoodForestLayoutGoal[];
  target_count?: number;
};

export type FoodForestLayoutResponse = {
  plant_ids: string[];
  source: "ai" | "heuristic";
  target_count: number;
  message?: string;
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

function resolveGoals(req: FoodForestLayoutRequest): FoodForestLayoutGoal[] {
  const prefs = normalizePreferences(req.preferences);
  return req.goals?.length
    ? req.goals
    : deriveGoalsFromPreferences(prefs);
}

async function loadCatalogForZone(
  zone: string,
  stateCode: DesignerStateCode = DEFAULT_DESIGNER_STATE,
  limit = 160,
): Promise<CatalogRow[]> {
  const toRow = (p: Awaited<ReturnType<typeof listStateDesignerPlants>>[number]) => {
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

  let rows = (await listStateDesignerPlants({
    hardiness_zone: zone,
    exclude_invasive: true,
    native_state: stateCode,
    for_my_area: true,
  }))
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

async function callAnthropicLayout(
  req: FoodForestLayoutRequest,
  catalog: CatalogRow[],
  target: number,
): Promise<string[] | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;

  const prefs = normalizePreferences(req.preferences);
  const density = prefs.density ?? "balanced";
  const area = req.width_feet * req.height_feet;
  const goals = resolveGoals(req).join(", ");
  const profile = buildGardenerProfileText(prefs);
  const validIds = new Set(catalog.map((r) => r.id));

  const styleRules = aiPickingRulesForGardenStyle(
    prefs.gardenStyle,
    target,
    density,
  );

  const system = `You are an expert permaculture and edible-landscape designer. Pick plants ONLY from the catalog (first column = id). Return valid JSON only, no markdown:
{"plant_ids":["id1","id2",...],"message":"one short sentence about the guild"}

Rules:
- Pick exactly ${target} different plant ids — each must be placeable on a 2D map.
${styleRules}
- Match USDA zone ${req.hardiness_zone}. Derived tags: ${goals}.
- Bed size ${req.width_feet}×${req.height_feet} ft (${area} sq ft).`;

  const user = `Gardener profile:\n${profile}\n\nCatalog (id, name, layer, category, radius):\n${catalogPromptLines(catalog)}\n\n${layoutUserPromptForStyle(prefs.gardenStyle)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.warn(
      `[food-forest-layout] Anthropic ${res.status}: ${errBody.slice(0, 200)}`,
    );
    return null;
  }

  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = json.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as {
      plant_ids?: string[];
    };
    const ids = dedupeOrderedIds(
      (parsed.plant_ids ?? []).filter((id) => validIds.has(id)),
    );
    return ids.length ? ids : null;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]) as { plant_ids?: string[] };
      return dedupeOrderedIds(
        (parsed.plant_ids ?? []).filter((id) => validIds.has(id)),
      );
    } catch {
      return null;
    }
  }
}

const LAYER_ORDER: CanopyLayer[] = [
  "Overstory",
  "Understory",
  "Shrub",
  "Herbaceous",
  "Groundcover",
  "Vine",
];

function layerTargets(
  target: number,
  goals: FoodForestLayoutGoal[],
  density: PlantingDensity = "balanced",
  gardenStyle?: GardenPreferences["gardenStyle"],
): Record<CanopyLayer, number> {
  const low = goals.includes("low_maintenance");
  const fruit =
    goals.includes("fruit_trees") && gardenStyle !== "kitchen_garden";
  const herbs = goals.includes("herbs_produce");
  const noCanopy =
    gardenStyle === "kitchen_garden" ||
    gardenStyle === "pollinator" ||
    gardenStyle === "visual";

  const ratios: Record<CanopyLayer, number> =
    density === "dense"
      ? {
          Overstory: 0.04,
          Understory: 0.08,
          Shrub: 0.26,
          Herbaceous: 0.42,
          Groundcover: 0.24,
          Vine: 0.06,
          Root: 0,
        }
      : density === "spacious"
        ? {
            Overstory: fruit ? 0.12 : 0.1,
            Understory: fruit ? 0.16 : 0.12,
            Shrub: 0.2,
            Herbaceous: herbs ? 0.32 : 0.28,
            Groundcover: 0.14,
            Vine: 0.03,
            Root: 0,
          }
        : {
            Overstory: fruit ? 0.08 : 0.06,
            Understory: fruit ? 0.14 : 0.1,
            Shrub: 0.22,
            Herbaceous: herbs ? 0.38 : 0.32,
            Groundcover: 0.18,
            Vine: 0.04,
            Root: 0,
          };

  if (goals.includes("pollinators")) {
    ratios.Shrub += 0.04;
    ratios.Herbaceous += 0.04;
  }
  if (low) {
    ratios.Overstory *= 0.5;
    ratios.Understory *= 0.6;
    ratios.Herbaceous *= 0.75;
  }
  if (noCanopy) {
    ratios.Overstory = 0;
    ratios.Understory = 0;
    if (gardenStyle === "kitchen_garden") {
      ratios.Herbaceous = Math.min(0.55, ratios.Herbaceous + 0.12);
      ratios.Shrub = Math.min(0.35, ratios.Shrub + 0.08);
      ratios.Vine = Math.min(0.12, ratios.Vine + 0.04);
    }
    if (gardenStyle === "pollinator" || gardenStyle === "visual") {
      ratios.Herbaceous = Math.min(0.5, ratios.Herbaceous + 0.1);
      ratios.Groundcover = Math.min(0.35, ratios.Groundcover + 0.1);
      ratios.Shrub = Math.min(0.3, ratios.Shrub + 0.06);
    }
  }

  const counts: Record<CanopyLayer, number> = {
    Overstory: 0,
    Understory: 0,
    Shrub: 0,
    Herbaceous: 0,
    Groundcover: 0,
    Vine: 0,
    Root: 0,
  };

  let assigned = 0;
  for (const layer of LAYER_ORDER) {
    const n = Math.floor(target * ratios[layer]);
    counts[layer] = n;
    assigned += n;
  }
  let remain = target - assigned;
  const fillOrder: CanopyLayer[] = [
    "Herbaceous",
    "Groundcover",
    "Shrub",
    "Understory",
  ];
  for (const layer of fillOrder) {
    if (remain <= 0) break;
    counts[layer] += 1;
    remain -= 1;
  }
  return counts;
}

function heuristicPickTreeIds(
  catalog: CatalogRow[],
  req: FoodForestLayoutRequest,
  target: number,
): string[] {
  const prefs = normalizePreferences(req.preferences);
  const stateCode = isDesignerStateCode(req.native_state ?? "")
    ? (req.native_state!.toUpperCase() as DesignerStateCode)
    : DEFAULT_DESIGNER_STATE;

  let pool = catalog.filter((p) =>
    catalogRowMatchesGardenStyle(p, "food_forest", stateCode),
  );
  if (pool.length < 3) {
    pool = catalog.filter((p) => p.canopy_layer === "Overstory" || p.canopy_layer === "Understory");
  }

  const used = new Set<string>();
  const ids: string[] = [];
  const layers: CanopyLayer[] = ["Understory", "Overstory"];
  const perLayer = Math.max(1, Math.ceil(target / layers.length));

  for (const layer of layers) {
    const layerPool = pool
      .filter((p) => p.canopy_layer === layer && !used.has(p.id))
      .sort(
        (a, b) =>
          scoreCatalogRow(b, prefs) - scoreCatalogRow(a, prefs) ||
          b.radius_ft - a.radius_ft,
      );
    for (let i = 0; i < perLayer && ids.length < target && i < layerPool.length; i++) {
      const row = layerPool[i]!;
      used.add(row.id);
      ids.push(row.id);
    }
  }

  const sorted = [...pool]
    .filter((p) => !used.has(p.id))
    .sort(
      (a, b) =>
        scoreCatalogRow(b, prefs) - scoreCatalogRow(a, prefs) ||
        a.radius_ft - b.radius_ft,
    );
  for (const row of sorted) {
    if (ids.length >= target) break;
    used.add(row.id);
    ids.push(row.id);
  }

  return ids;
}

function heuristicPickIds(
  catalog: CatalogRow[],
  req: FoodForestLayoutRequest,
  target: number,
): string[] {
  const prefs = normalizePreferences(req.preferences);
  const stateCode = isDesignerStateCode(req.native_state ?? "")
    ? (req.native_state!.toUpperCase() as DesignerStateCode)
    : DEFAULT_DESIGNER_STATE;
  if (prefs.gardenStyle === "food_forest") {
    return heuristicPickTreeIds(catalog, req, target);
  }

  const goals = resolveGoals(req);
  const nativesOnly =
    goals.includes("natives") &&
    (prefs.priorities.includes("florida_natives") ||
      prefs.uses.includes("native_habitat"));

  let pool = catalog.filter(
    (p) =>
      catalogRowMatchesGardenStyle(p, prefs.gardenStyle, stateCode) &&
      (!nativesOnly || p.native),
  );
  if (pool.length < 10) {
    pool = catalog.filter((p) =>
      catalogRowMatchesGardenStyle(p, prefs.gardenStyle, stateCode),
    );
  }
  if (pool.length < 10) pool = catalog;

  const counts = layerTargets(
    target,
    goals,
    prefs.density ?? "balanced",
    prefs.gardenStyle,
  );
  const used = new Set<string>();
  const ids: string[] = [];

  const byLayer = (layer: CanopyLayer) =>
    pool
      .filter((p) => p.canopy_layer === layer && !used.has(p.id))
      .sort(
        (a, b) =>
          scoreCatalogRow(b, prefs) - scoreCatalogRow(a, prefs) ||
          a.radius_ft - b.radius_ft,
      );

  for (const layer of LAYER_ORDER) {
    const want = counts[layer];
    const layerPool = byLayer(layer);
    for (let i = 0; i < want && i < layerPool.length; i++) {
      const row = layerPool[i]!;
      used.add(row.id);
      ids.push(row.id);
    }
  }

  const sorted = [...pool]
    .filter((p) => !used.has(p.id))
    .sort(
      (a, b) =>
        scoreCatalogRow(b, prefs) - scoreCatalogRow(a, prefs) ||
        a.radius_ft - b.radius_ft,
    );
  for (const row of sorted) {
    if (ids.length >= target) break;
    used.add(row.id);
    ids.push(row.id);
  }

  return ids;
}

export async function generateFoodForestLayout(
  req: FoodForestLayoutRequest,
): Promise<FoodForestLayoutResponse> {
  const prefs = normalizePreferences(req.preferences);
  const area = req.width_feet * req.height_feet;
  const density = prefs.density ?? "balanced";
  const foodForestTreesOnly = prefs.gardenStyle === "food_forest";
  const cap = foodForestTreesOnly
    ? targetFoodForestTreeCount(area, density)
    : maxPlantsForCanvas(area, density);
  const target = Math.min(
    cap,
    req.target_count ??
      (foodForestTreesOnly
        ? targetFoodForestTreeCount(area, density)
        : targetPlantCountFromPreferences(area, prefs)),
  );
  const stateCode = isDesignerStateCode(req.native_state ?? "")
    ? (req.native_state!.toUpperCase() as DesignerStateCode)
    : DEFAULT_DESIGNER_STATE;
  let catalog = await loadCatalogForZone(req.hardiness_zone, stateCode);
  catalog = filterCatalogForGardenStyle(
    catalog,
    prefs.gardenStyle,
    stateCode,
    prefs.gardenStyle === "food_forest" ? 3 : 10,
  );

  if (!catalog.length) {
    throw new Error("No plants in catalog for this zone.");
  }

  const useAi =
    process.env.FOOD_FOREST_LAYOUT_AI !== "false" &&
    Boolean(process.env.ANTHROPIC_API_KEY?.trim());

  let plant_ids: string[] = [];
  let source: "ai" | "heuristic" = "heuristic";
  let message: string | undefined;

  if (useAi) {
    const fromAi = await callAnthropicLayout(req, catalog, target);
    const aiMin = foodForestTreesOnly
      ? Math.min(2, target)
      : density === "dense"
        ? Math.min(target, Math.max(12, Math.floor(target * 0.65)))
        : Math.min(8, target);
    if (fromAi && fromAi.length >= aiMin) {
      plant_ids = fromAi.slice(0, target);
      source = "ai";
      message =
        prefs.gardenStyle === "food_forest"
          ? "AI-selected fruit trees for your food forest."
          : "AI-tailored plant list for your garden style.";
    }
  }

  const heuristicMin = foodForestTreesOnly ? Math.min(2, target) : Math.min(8, target);
  if (plant_ids.length < heuristicMin) {
    plant_ids = heuristicPickIds(catalog, req, target);
    source = "heuristic";
    message = heuristicMessageForStyle(prefs.gardenStyle, plant_ids.length);
  }

  if (prefs.gardenStyle && prefs.gardenStyle !== "easy_care") {
    plant_ids = filterIdsForGardenStyle(
      plant_ids,
      catalog,
      prefs.gardenStyle,
      stateCode,
    );
    plant_ids = topUpIdsForGardenStyle(
      plant_ids,
      catalog,
      target,
      prefs.gardenStyle,
      stateCode,
    );
  } else if (plant_ids.length < target) {
    const used = new Set(plant_ids);
    const extras = catalog
      .filter((p) => !used.has(p.id))
      .sort((a, b) => a.radius_ft - b.radius_ft);
    for (const row of extras) {
      if (plant_ids.length >= target) break;
      plant_ids.push(row.id);
    }
  }

  const rowById = new Map(catalog.map((c) => [c.id, c]));
  plant_ids = dedupeOrderedIdsByName(dedupeOrderedIds(plant_ids), (id) =>
    rowById.get(id),
  );

  return { plant_ids, source, target_count: target, message };
}

export function resolveLayoutPlants(
  ids: string[],
  pool: PlantSummary[],
): PlantSummary[] {
  const byId = new Map(pool.map((p) => [p.id, p]));
  const out: PlantSummary[] = [];
  for (const id of dedupeOrderedIds(ids)) {
    const p = byId.get(id);
    if (p) out.push(p);
  }
  return dedupePlantsByName(out);
}
