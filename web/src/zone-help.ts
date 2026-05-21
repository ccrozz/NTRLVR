/** Official USDA interactive map — ZIP code lookup. */
export const USDA_ZONE_LOOKUP_URL =
  "https://planthardiness.ars.usda.gov/";

/** Plain-English hint shown next to a zone in the dropdown (by state). */
const ZONE_HINTS: Record<string, Record<string, string>> = {
  FL: {
    "8a": "Panhandle — coolest winters in FL",
    "8b": "North Florida",
    "9a": "North-central",
    "9b": "Orlando area, central",
    "10a": "South-central",
    "10b": "Tampa Bay, southwest coast",
    "11a": "Miami, southeast coast",
    "11b": "Keys & warmest pockets",
  },
  TN: {
    "6a": "East TN mountains — coolest",
    "6b": "Cumberland Plateau",
    "7a": "Nashville, Chattanooga",
    "7b": "West Tennessee — warmest",
    "8a": "Mississippi River fringe",
  },
  CT: {
    "5b": "Northwest hills — coldest",
    "6a": "Hartford, inland",
    "6b": "Eastern CT",
    "7a": "Long Island Sound coast",
  },
  CA: {
    "5a": "High mountains",
    "5b": "Sierra foothills",
    "6a": "Northern mountains",
    "6b": "Shasta / northern interior",
    "7a": "Northern valleys",
    "7b": "Sacramento region",
    "8a": "Bay Area hills",
    "8b": "Coastal north & central",
    "9a": "Central Valley, LA hills",
    "9b": "Inland & southern coast",
    "10a": "Southern California lowlands",
    "10b": "Warmest SoCal pockets",
    "11a": "Desert low elevations",
  },
  TX: {
    "6b": "Panhandle",
    "7a": "North Texas",
    "7b": "Dallas–Fort Worth area",
    "8a": "Central Texas",
    "8b": "Hill Country, Austin area",
    "9a": "South-central",
    "9b": "San Antonio, Gulf coast",
    "10a": "Rio Grande Valley fringe",
  },
};

/** One-tap regional guesses for states with many zones (sets a single zone). */
export const STATE_ZONE_REGIONS: Record<
  string,
  { label: string; zone: string; hint: string }[]
> = {
  FL: [
    { label: "North FL", zone: "8b", hint: "Tallahassee, Jacksonville" },
    { label: "Central FL", zone: "9b", hint: "Orlando, Gainesville" },
    { label: "South FL", zone: "10b", hint: "Tampa, Fort Myers" },
    { label: "Tropical south", zone: "11a", hint: "Miami, Keys" },
  ],
  CA: [
    { label: "Northern CA", zone: "8b", hint: "Bay Area, north coast" },
    { label: "Central Valley", zone: "9b", hint: "Sacramento, Fresno" },
    { label: "Southern CA", zone: "10a", hint: "LA, San Diego" },
  ],
  TX: [
    { label: "North TX", zone: "7b", hint: "Dallas area" },
    { label: "Central TX", zone: "8b", hint: "Austin, San Antonio" },
    { label: "South TX", zone: "9b", hint: "Houston, coast" },
  ],
  AK: [
    { label: "Southcoast", zone: "6b", hint: "Anchorage area" },
    { label: "Interior", zone: "3a", hint: "Fairbanks" },
    { label: "North", zone: "2a", hint: "Arctic fringe" },
  ],
};

export function zoneSelectLabel(zone: string, stateCode: string): string {
  const hint = ZONE_HINTS[stateCode.toUpperCase()]?.[zone.toLowerCase()];
  return hint ? `Zone ${zone} — ${hint}` : `Zone ${zone}`;
}

export function hasZoneRegions(stateCode: string): boolean {
  return Boolean(STATE_ZONE_REGIONS[stateCode.toUpperCase()]);
}

export function zoneRegionsForState(stateCode: string) {
  return STATE_ZONE_REGIONS[stateCode.toUpperCase()] ?? [];
}
