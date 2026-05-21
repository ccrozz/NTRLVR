import {
  CONNECTICUT_ONBOARDING_REGIONS,
  DEFAULT_CONNECTICUT_REGION,
  connecticutRegionById,
  hardinessZoneForConnecticutRegion,
  isConnecticutRegionId,
  type ConnecticutRegionId,
} from "./connecticut-onboarding-regions.js";
import {
  DEFAULT_FLORIDA_REGION,
  FLORIDA_ONBOARDING_REGIONS,
  floridaRegionById,
  hardinessZoneForFloridaRegion,
  isFloridaRegionId,
  type FloridaRegionId,
} from "./florida-onboarding-regions.js";
import {
  DEFAULT_TENNESSEE_REGION,
  TENNESSEE_ONBOARDING_REGIONS,
  hardinessZoneForTennesseeRegion,
  isTennesseeRegionId,
  tennesseeRegionById,
  type TennesseeRegionId,
} from "./tennessee-onboarding-regions.js";
import {
  DEFAULT_DESIGNER_STATE,
  type DesignerStateCode,
  designerStateConfig,
} from "./designer-states.js";

export type StateOnboardingRegion = {
  id: string;
  label: string;
  subtitle: string;
  hardiness_zone: string;
};

export function regionsForDesignerState(
  state: DesignerStateCode,
): StateOnboardingRegion[] {
  switch (state) {
    case "TN":
      return TENNESSEE_ONBOARDING_REGIONS;
    case "CT":
      return CONNECTICUT_ONBOARDING_REGIONS;
    default:
      return FLORIDA_ONBOARDING_REGIONS;
  }
}

export function defaultRegionForDesignerState(
  state: DesignerStateCode,
): string {
  switch (state) {
    case "TN":
      return DEFAULT_TENNESSEE_REGION;
    case "CT":
      return DEFAULT_CONNECTICUT_REGION;
    default:
      return DEFAULT_FLORIDA_REGION;
  }
}

export function regionStepTitle(state: DesignerStateCode): string {
  const name = designerStateConfig(state)?.name ?? "your state";
  return `Where in ${name}?`;
}

export function isStateRegionId(
  state: DesignerStateCode,
  value: string,
): boolean {
  switch (state) {
    case "TN":
      return isTennesseeRegionId(value);
    case "CT":
      return isConnecticutRegionId(value);
    default:
      return isFloridaRegionId(value);
  }
}

export function hardinessZoneForStateRegion(
  state: DesignerStateCode,
  regionId: string,
): string {
  switch (state) {
    case "TN":
      return isTennesseeRegionId(regionId)
        ? hardinessZoneForTennesseeRegion(regionId)
        : hardinessZoneForTennesseeRegion(DEFAULT_TENNESSEE_REGION);
    case "CT":
      return isConnecticutRegionId(regionId)
        ? hardinessZoneForConnecticutRegion(regionId)
        : hardinessZoneForConnecticutRegion(DEFAULT_CONNECTICUT_REGION);
    default:
      return isFloridaRegionId(regionId)
        ? hardinessZoneForFloridaRegion(regionId)
        : hardinessZoneForFloridaRegion(DEFAULT_FLORIDA_REGION);
  }
}

export function stateRegionById(
  state: DesignerStateCode,
  regionId: string,
): StateOnboardingRegion | undefined {
  switch (state) {
    case "TN":
      return isTennesseeRegionId(regionId)
        ? tennesseeRegionById(regionId)
        : undefined;
    case "CT":
      return isConnecticutRegionId(regionId)
        ? connecticutRegionById(regionId)
        : undefined;
    default:
      return isFloridaRegionId(regionId)
        ? floridaRegionById(regionId)
        : undefined;
  }
}

/** Resolve region from onboarding answers (supports legacy florida_region). */
export function resolveOnboardingRegionId(
  state: DesignerStateCode,
  answers: {
    state_region?: string;
    florida_region?: FloridaRegionId;
  },
): string {
  if (answers.state_region && isStateRegionId(state, answers.state_region)) {
    return answers.state_region;
  }
  if (
    state === "FL" &&
    answers.florida_region &&
    isFloridaRegionId(answers.florida_region)
  ) {
    return answers.florida_region;
  }
  return defaultRegionForDesignerState(state);
}

export function resolveOnboardingHardinessZone(
  state: DesignerStateCode,
  answers: {
    hardiness_zone?: string;
    state_region?: string;
    florida_region?: FloridaRegionId;
  },
): string {
  if (answers.hardiness_zone?.trim()) return answers.hardiness_zone.trim();
  const regionId = resolveOnboardingRegionId(state, answers);
  return hardinessZoneForStateRegion(state, regionId);
}

export type { FloridaRegionId, TennesseeRegionId, ConnecticutRegionId };

export {
  DEFAULT_DESIGNER_STATE,
  DEFAULT_FLORIDA_REGION,
  DEFAULT_TENNESSEE_REGION,
  DEFAULT_CONNECTICUT_REGION,
};
