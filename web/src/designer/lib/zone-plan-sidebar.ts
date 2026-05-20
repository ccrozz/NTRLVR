import type { ZoneGardenPlan } from "../types/garden-plan";

export function planToSidebarFields(plan: ZoneGardenPlan) {
  const meta = plan.recommendationMeta;
  return {
    gardenProfile: plan.profile,
    lastGenerateResult: plan.result,
    recommendedPlantIds: plan.result.plant_ids,
    recommendationMeta: meta,
    showingRecommendations: false,
    gardenVision: {
      name: plan.profile.name,
      description: plan.profile.description,
      philosophy: plan.profile.philosophy,
    },
  };
}

export function buildZoneGardenPlan(
  payload: Omit<ZoneGardenPlan, "recommendationMeta"> & {
    recommendations: ZoneGardenPlan["recommendations"];
  },
): ZoneGardenPlan {
  const recommendations = payload.recommendations;
  const plant_ids = recommendations.map((r) => r.plant_id);
  const meta: Record<string, ZoneGardenPlan["recommendationMeta"][string]> =
    {};
  for (const r of recommendations) meta[r.plant_id] = r;
  return {
    ...payload,
    result: { ...payload.result, plant_ids },
    recommendations,
    recommendationMeta: meta,
  };
}
