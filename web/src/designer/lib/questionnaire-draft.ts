import type { GardenOnboardingAnswers } from "@lib/garden-onboarding";
import type { DesignerStateCode } from "@lib/designer-states";
import {
  defaultRegionForDesignerState,
  hardinessZoneForStateRegion,
} from "@lib/state-onboarding-regions";
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

export function createFreshQuestionnaireDraft(
  state: DesignerStateCode = "FL",
): QuestionnaireDraft {
  const garden_style: GardenStyle = "food_forest";
  const region = defaultRegionForDesignerState(state);
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
    designer_state: state,
    state_region: region,
    florida_region: state === "FL" ? (region as GardenOnboardingAnswers["florida_region"]) : undefined,
    hardiness_zone: hardinessZoneForStateRegion(state, region),
    planting_density: defaultDensityForGardenStyle(garden_style),
  };
  return { qIndex: 0, answers, canvas_zone_id: null };
}
