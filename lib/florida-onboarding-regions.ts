/** Florida sub-regions for Build For Me — each maps to a primary USDA zone. */
export type FloridaRegionId =
  | "panhandle"
  | "north"
  | "northeast"
  | "central"
  | "tampa_bay"
  | "southwest"
  | "southeast"
  | "keys";

export type FloridaOnboardingRegion = {
  id: FloridaRegionId;
  label: string;
  subtitle: string;
  hardiness_zone: string;
};

export const FLORIDA_ONBOARDING_REGIONS: FloridaOnboardingRegion[] = [
  {
    id: "panhandle",
    label: "Panhandle",
    subtitle: "Pensacola, Tallahassee — coolest winters",
    hardiness_zone: "8b",
  },
  {
    id: "north",
    label: "North Florida",
    subtitle: "Jacksonville, Gainesville",
    hardiness_zone: "9a",
  },
  {
    id: "northeast",
    label: "Northeast coast",
    subtitle: "St. Augustine, Daytona",
    hardiness_zone: "9a",
  },
  {
    id: "central",
    label: "Central Florida",
    subtitle: "Orlando, Ocala",
    hardiness_zone: "9b",
  },
  {
    id: "tampa_bay",
    label: "Tampa Bay",
    subtitle: "Tampa, St. Petersburg, Sarasota",
    hardiness_zone: "10a",
  },
  {
    id: "southwest",
    label: "Southwest",
    subtitle: "Fort Myers, Naples",
    hardiness_zone: "10a",
  },
  {
    id: "southeast",
    label: "Southeast",
    subtitle: "Miami, Fort Lauderdale, West Palm",
    hardiness_zone: "10b",
  },
  {
    id: "keys",
    label: "Florida Keys",
    subtitle: "Key West, Marathon — warmest",
    hardiness_zone: "11a",
  },
];

export const DEFAULT_FLORIDA_REGION: FloridaRegionId = "central";

export function isFloridaRegionId(value: string): value is FloridaRegionId {
  return FLORIDA_ONBOARDING_REGIONS.some((r) => r.id === value);
}

export function hardinessZoneForFloridaRegion(
  id: FloridaRegionId,
): string {
  return (
    FLORIDA_ONBOARDING_REGIONS.find((r) => r.id === id)?.hardiness_zone ??
    "10a"
  );
}

export function floridaRegionLabel(id: FloridaRegionId): string {
  return (
    FLORIDA_ONBOARDING_REGIONS.find((r) => r.id === id)?.label ?? "Florida"
  );
}

export function floridaRegionById(
  id: FloridaRegionId,
): FloridaOnboardingRegion | undefined {
  return FLORIDA_ONBOARDING_REGIONS.find((r) => r.id === id);
}
