/** Connecticut sub-regions for Build For Me — each maps to a primary USDA zone. */
export type ConnecticutRegionId =
  | "northwest"
  | "central"
  | "coast"
  | "southeast";

export type ConnecticutOnboardingRegion = {
  id: ConnecticutRegionId;
  label: string;
  subtitle: string;
  hardiness_zone: string;
};

export const CONNECTICUT_ONBOARDING_REGIONS: ConnecticutOnboardingRegion[] = [
  {
    id: "northwest",
    label: "Northwest hills",
    subtitle: "Litchfield, Torrington — coldest",
    hardiness_zone: "5b",
  },
  {
    id: "central",
    label: "Central Connecticut",
    subtitle: "Hartford, New Britain",
    hardiness_zone: "6a",
  },
  {
    id: "coast",
    label: "Long Island Sound coast",
    subtitle: "New Haven, Stamford, Bridgeport",
    hardiness_zone: "7a",
  },
  {
    id: "southeast",
    label: "Southeast",
    subtitle: "Norwich, Mystic",
    hardiness_zone: "6b",
  },
];

export const DEFAULT_CONNECTICUT_REGION: ConnecticutRegionId = "central";

export function isConnecticutRegionId(
  value: string,
): value is ConnecticutRegionId {
  return CONNECTICUT_ONBOARDING_REGIONS.some((r) => r.id === value);
}

export function hardinessZoneForConnecticutRegion(
  id: ConnecticutRegionId,
): string {
  return (
    CONNECTICUT_ONBOARDING_REGIONS.find((r) => r.id === id)?.hardiness_zone ??
    "6b"
  );
}

export function connecticutRegionById(
  id: ConnecticutRegionId,
): ConnecticutOnboardingRegion | undefined {
  return CONNECTICUT_ONBOARDING_REGIONS.find((r) => r.id === id);
}
