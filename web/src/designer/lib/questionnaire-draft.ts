import type { GardenOnboardingAnswers } from "@lib/garden-onboarding";
import {
  DEFAULT_FLORIDA_REGION,
  hardinessZoneForFloridaRegion,
} from "@lib/florida-onboarding-regions";
import type { GardenStyle } from "@lib/food-forest-questionnaire";
import { defaultDensityForGardenStyle } from "@lib/food-forest-questionnaire";
import type { OnboardingGoal } from "@lib/garden-onboarding";
import type { QuestionnaireDraft } from "../types/garden-plan";

function defaultGoalsForStyle(style: GardenStyle): OnboardingGoal[] {
  switch (style) {
    case "kitchen_garden":
      return ["food_production", "savings"];
    case "pollinator":
      return ["pollinator", "wildlife"];
    case "visual":
      return ["aesthetic"];
    case "easy_care":
      return ["low_maintenance"];
    default:
      return ["food_production", "regenerative"];
  }
}

export function createFreshQuestionnaireDraft(): QuestionnaireDraft {
  const garden_style: GardenStyle = "food_forest";
  const answers: Partial<GardenOnboardingAnswers> = {
    garden_style,
    property_type: "yard",
    space_size: "medium",
    goals: defaultGoalsForStyle(garden_style),
    sunlight: "full",
    maintenance: "moderate",
    water: "hand_water",
    preferences: [],
    experience: "intermediate",
    florida_region: DEFAULT_FLORIDA_REGION,
    hardiness_zone: hardinessZoneForFloridaRegion(DEFAULT_FLORIDA_REGION),
    planting_density: defaultDensityForGardenStyle(garden_style),
  };
  return { qIndex: 0, answers, canvas_zone_id: null };
}
