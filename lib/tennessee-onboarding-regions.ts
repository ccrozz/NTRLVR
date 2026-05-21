/** Tennessee sub-regions for Build For Me — each maps to a primary USDA zone. */
export type TennesseeRegionId =
  | "east_mountains"
  | "plateau"
  | "middle"
  | "chattanooga"
  | "west";

export type TennesseeOnboardingRegion = {
  id: TennesseeRegionId;
  label: string;
  subtitle: string;
  hardiness_zone: string;
};

export const TENNESSEE_ONBOARDING_REGIONS: TennesseeOnboardingRegion[] = [
  {
    id: "east_mountains",
    label: "East Tennessee mountains",
    subtitle: "Knoxville, Gatlinburg — coolest winters",
    hardiness_zone: "6a",
  },
  {
    id: "plateau",
    label: "Cumberland Plateau",
    subtitle: "Crossville, Cookeville",
    hardiness_zone: "6b",
  },
  {
    id: "middle",
    label: "Middle Tennessee",
    subtitle: "Nashville, Murfreesboro",
    hardiness_zone: "7a",
  },
  {
    id: "chattanooga",
    label: "Chattanooga area",
    subtitle: "Chattanooga, Cleveland",
    hardiness_zone: "7a",
  },
  {
    id: "west",
    label: "West Tennessee",
    subtitle: "Memphis, Jackson — warmest in state",
    hardiness_zone: "7b",
  },
];

export const DEFAULT_TENNESSEE_REGION: TennesseeRegionId = "middle";

export function isTennesseeRegionId(value: string): value is TennesseeRegionId {
  return TENNESSEE_ONBOARDING_REGIONS.some((r) => r.id === value);
}

export function hardinessZoneForTennesseeRegion(id: TennesseeRegionId): string {
  return (
    TENNESSEE_ONBOARDING_REGIONS.find((r) => r.id === id)?.hardiness_zone ?? "7a"
  );
}

export function tennesseeRegionById(
  id: TennesseeRegionId,
): TennesseeOnboardingRegion | undefined {
  return TENNESSEE_ONBOARDING_REGIONS.find((r) => r.id === id);
}
