import type { GardenOnboardingAnswers } from "@lib/garden-onboarding";
import type { GardenGenerateResult } from "@lib/garden-generate";
import type { PlantListItem } from "../types";
import {
  buildGardenProfile,
  buildRecommendationMeta,
} from "./build-recommendations";
import { layoutPlantsInZone, type LayoutPlacement } from "./auto-populate";
import { createRectangleZone, defaultZoneAnchor } from "../store/workspace-slice";
import type { WorkspaceZone } from "../types/workspace";
import { catalogRowMatchesGardenStyle } from "@lib/garden-style-catalog";
import {
  dedupeOrderedIds,
  dedupePlantsByName,
} from "@lib/plant-dedupe";
import type { GardenPlanPayload } from "../types/garden-plan";

const API = import.meta.env.VITE_API_URL ?? "";

export async function fetchGardenGenerate(
  answers: GardenOnboardingAnswers,
): Promise<GardenGenerateResult> {
  const res = await fetch(`${API}/api/garden/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(answers),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? "Could not generate your garden",
    );
  }
  const json = await res.json();
  return (json as { data: GardenGenerateResult }).data;
}

export async function fetchRecommendedPlants(
  ids: string[],
  stateCode = "FL",
): Promise<PlantListItem[]> {
  const uniqueIds = dedupeOrderedIds(ids);
  if (!uniqueIds.length) return [];
  const p = new URLSearchParams();
  p.set("food_forest_only", "true");
  p.set("exclude_invasive", "true");
  p.set("state", stateCode);
  p.set("for_my_area", "true");
  p.set("limit", String(Math.max(uniqueIds.length, 80)));
  p.set("ids", uniqueIds.join(","));
  const res = await fetch(`${API}/api/designer/plants?${p}`);
  if (!res.ok) throw new Error("Could not load recommended plants");
  const json = await res.json();
  const items = (json.data ?? []) as PlantListItem[];
  const byId = new Map(items.map((x) => [x.id, x]));
  const ordered = uniqueIds
    .map((id) => byId.get(id))
    .filter((x): x is PlantListItem => !!x);
  return dedupePlantsByName(ordered);
}

export async function completeGardenPlan(
  answers: GardenOnboardingAnswers,
): Promise<GardenPlanPayload> {
  const result = await fetchGardenGenerate(answers);
  const plants = await fetchRecommendedPlants(
    result.plant_ids,
    answers.designer_state ?? "FL",
  );
  const byId = new Map(plants.map((p) => [p.id, p]));
  const profile = buildGardenProfile(result);
  const recommendations = buildRecommendationMeta(result, byId);
  const plant_ids = recommendations.map((r) => r.plant_id);
  return {
    result: { ...result, plant_ids },
    profile,
    recommendations,
  };
}

export async function layoutForPlan(
  result: GardenGenerateResult,
  existingZone?: WorkspaceZone,
): Promise<{
  zone: WorkspaceZone;
  placements: LayoutPlacement[];
}> {
  let plants = await fetchRecommendedPlants(
    result.plant_ids,
    result.designer_state ?? "FL",
  );
  const style = result.preferences.gardenStyle;
  if (style && style !== "easy_care") {
    const stateCode = result.designer_state ?? "FL";
    plants = plants.filter((p) =>
      catalogRowMatchesGardenStyle(
        {
          category: p.category,
          canopy_layer: p.canopy_layer,
          edible: p.is_edible,
          tags: p.tags,
          is_kitchen_essential: p.is_kitchen_essential,
          native: p.is_florida_native,
        },
        style,
        stateCode,
      ),
    );
  }
  if (existingZone) {
    const placements = layoutPlantsInZone(
      existingZone,
      plants,
      result.preferences.density,
    );
    return { zone: existingZone, placements };
  }
  const zone = createRectangleZone(
    result.width_feet,
    result.height_feet,
    defaultZoneAnchor(result.width_feet, result.height_feet),
    "Your space",
  );
  const placements = layoutPlantsInZone(
    zone,
    plants,
    result.preferences.density,
  );
  return { zone, placements };
}
