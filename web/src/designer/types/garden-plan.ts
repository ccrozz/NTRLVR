import type { GardenOnboardingAnswers } from "@lib/garden-onboarding";
import type { GardenGenerateResult } from "@lib/garden-generate";

export type RecommendedPlantMeta = {
  plant_id: string;
  priority: number;
  why: string;
  placement_note: string;
};

export type GardenProfile = {
  name: string;
  description: string;
  philosophy: string;
  planting_sequence: string[];
  first_year_focus: string;
  avoid_mistakes: string[];
};

export type QuestionnaireDraft = {
  answers: Partial<GardenOnboardingAnswers>;
  qIndex: number;
  /** Workspace zone used for bed dimensions during generation (not auto-fill). */
  canvas_zone_id?: string | null;
};

export type GardenPlanPayload = {
  result: GardenGenerateResult;
  profile: GardenProfile;
  recommendations: RecommendedPlantMeta[];
};

/** Saved plant list + plan for one workspace bed (after Place on canvas). */
export type ZoneGardenPlan = GardenPlanPayload & {
  recommendationMeta: Record<string, RecommendedPlantMeta>;
};
