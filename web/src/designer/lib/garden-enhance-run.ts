import type {
  EnhanceExistingPlant,
  EnhancePlantAssignment,
  FoodForestEnhanceRequest,
  FoodForestEnhanceResponse,
} from "@lib/food-forest-enhance";
import type { GardenPreferences, PlantingDensity } from "@lib/food-forest-questionnaire";
import type { DesignerStateCode } from "@lib/designer-states";
import { dedupeOrderedIds, dedupePlantsByName } from "@lib/plant-dedupe";
import type { PlantListItem } from "../types";
import type { CanvasPlant } from "../types";
import type { WorkspaceZone } from "../types/workspace";
import { canvasPlantsInZone } from "./zone-plant-groups";
import { zoneLayoutDimensions } from "./zone-geometry";
import {
  layoutPlantsAroundFixed,
  type FixedCanvasObstacle,
  type HostPlacementHint,
  type LayoutPlacement,
} from "./auto-populate";
import type { RecommendedPlantMeta } from "../types/garden-plan";
import { fetchRecommendedPlants } from "./garden-onboarding-run";

const API = import.meta.env.VITE_API_URL ?? "";

export type EnhanceGuildProfile = {
  name: string;
  description: string;
};

export type EnhanceGuildPlan = {
  result: FoodForestEnhanceResponse;
  profile: EnhanceGuildProfile;
  recommendations: RecommendedPlantMeta[];
  zoneId: string;
  existingTreeCount: number;
  density: PlantingDensity;
};

export async function fetchFoodForestEnhance(
  req: FoodForestEnhanceRequest,
): Promise<FoodForestEnhanceResponse> {
  const res = await fetch(`${API}/api/food-forest-enhance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? "Could not enhance your guild",
    );
  }
  const json = await res.json();
  return (json as { data: FoodForestEnhanceResponse }).data;
}

function buildHostHints(
  assignments: EnhancePlantAssignment[],
  existing: CanvasPlant[],
): Map<string, HostPlacementHint> {
  const byHost = new Map<string, EnhancePlantAssignment[]>();
  for (const a of assignments) {
    const list = byHost.get(a.host_plant_id) ?? [];
    list.push(a);
    byHost.set(a.host_plant_id, list);
  }

  const hints = new Map<string, HostPlacementHint>();
  for (const [hostId, group] of byHost) {
    const host = existing.find((p) => p.plantId === hostId);
    if (!host) continue;
    group.forEach((a, slotIndex) => {
      hints.set(a.plant_id, {
        host_x: host.x,
        host_y: host.y,
        host_radius_feet: host.canvas_radius_feet,
        slot_index: slotIndex,
        total_slots: group.length,
      });
    });
  }
  return hints;
}

function whyForEnhancePlant(
  plant: PlantListItem,
  hostName?: string,
): string {
  if (hostName) {
    return `Companion for your ${hostName} — fills the understory guild.`;
  }
  switch (plant.canopy_layer) {
    case "Groundcover":
      return "Living mulch between your trees — protects soil and suppresses weeds.";
    case "Herbaceous":
      return "Herb layer for harvest, pollinators, and pest confusion.";
    case "Shrub":
      return "Mid-layer shrub to diversify your food forest structure.";
    case "Vine":
      return "Vertical layer — uses fence or shrub support without competing with canopy.";
    default:
      return "Supports your existing trees and completes the guild.";
  }
}

function buildEnhanceRecommendations(
  result: FoodForestEnhanceResponse,
  plants: PlantListItem[],
  existing: CanvasPlant[],
): RecommendedPlantMeta[] {
  const byId = new Map(plants.map((p) => [p.id, p]));
  const hostNameByPlant = new Map<string, string>();
  for (const a of result.assignments) {
    const host = existing.find((p) => p.plantId === a.host_plant_id);
    if (host) hostNameByPlant.set(a.plant_id, host.common_name);
  }

  return dedupeOrderedIds(result.plant_ids)
    .map((id, index) => {
      const plant = byId.get(id);
      if (!plant) return null;
      const hostName = hostNameByPlant.get(id);
      return {
        plant_id: id,
        priority: index + 1,
        why: whyForEnhancePlant(plant, hostName),
        placement_note: hostName
          ? `Placed near your ${hostName} on the companion ring.`
          : "Placed in open ground between your existing trees.",
      };
    })
    .filter((r): r is RecommendedPlantMeta => !!r);
}

export function canvasToEnhanceExisting(
  plants: CanvasPlant[],
  zone: WorkspaceZone,
  zones: WorkspaceZone[],
): EnhanceExistingPlant[] {
  return canvasPlantsInZone(plants, zone, zones).map((p) => ({
    plant_id: p.plantId,
    common_name: p.common_name,
    canopy_layer: p.canopy_layer,
    category: p.category,
    x: p.x,
    y: p.y,
    canvas_radius_feet: p.canvas_radius_feet,
  }));
}

export async function completeEnhanceGuildPlan(input: {
  zone: WorkspaceZone;
  zones: WorkspaceZone[];
  canvasPlants: CanvasPlant[];
  hardinessZone: string;
  designerState: DesignerStateCode;
  preferences: GardenPreferences;
  userNotes?: string;
  treeCount: number;
}): Promise<EnhanceGuildPlan> {
  const { widthFeet, heightFeet } = zoneLayoutDimensions(input.zone);
  const existing_plants = canvasToEnhanceExisting(
    input.canvasPlants,
    input.zone,
    input.zones,
  );

  const result = await fetchFoodForestEnhance({
    hardiness_zone: input.hardinessZone,
    native_state: input.designerState,
    width_feet: widthFeet,
    height_feet: heightFeet,
    preferences: input.preferences,
    existing_plants,
    user_notes: input.userNotes,
  });

  const plants = await fetchRecommendedPlants(
    result.plant_ids,
    input.designerState,
  );
  const recommendations = buildEnhanceRecommendations(
    result,
    plants,
    canvasPlantsInZone(input.canvasPlants, input.zone, input.zones),
  );

  return {
    result: { ...result, plant_ids: recommendations.map((r) => r.plant_id) },
    profile: {
      name: result.guild_name ?? "Complete your guild",
      description:
        result.guild_description ??
        result.message ??
        "Understory plants to round out your food forest.",
    },
    recommendations,
    zoneId: input.zone.id,
    existingTreeCount: input.treeCount,
    density: input.preferences.density ?? "balanced",
  };
}

export async function layoutEnhancePlan(
  plan: EnhanceGuildPlan,
  zone: WorkspaceZone,
  zones: WorkspaceZone[],
  canvasPlants: CanvasPlant[],
  designerState: DesignerStateCode,
): Promise<{ zone: WorkspaceZone; placements: LayoutPlacement[] }> {
  const plants = await fetchRecommendedPlants(
    plan.result.plant_ids,
    designerState,
  );
  const deduped = dedupePlantsByName(plants);
  const existing = canvasPlantsInZone(canvasPlants, zone, zones);
  const fixed: FixedCanvasObstacle[] = existing.map((p) => ({
    x: p.x,
    y: p.y,
    canvas_radius_feet: p.canvas_radius_feet,
    canopy_layer: p.canopy_layer,
    plant_id: p.plantId,
  }));
  const hostHints = buildHostHints(plan.result.assignments, existing);
  const placements = layoutPlantsAroundFixed(
    zone,
    deduped,
    fixed,
    plan.density,
    hostHints,
  );
  return { zone, placements };
}
