/** US states + DC for filters and native-range lookups. */

export type UsState = {
  code: string;
  name: string;
  /** Typical USDA hardiness subzones for overlap checks */
  hardiness_zones: string[];
};

export const US_STATES: UsState[] = [
  { code: "AL", name: "Alabama", hardiness_zones: ["7a", "7b", "8a", "8b", "9a"] },
  { code: "AK", name: "Alaska", hardiness_zones: ["1a", "1b", "2a", "2b", "3a", "3b", "4a", "4b", "5a", "5b", "6a", "6b", "7a", "7b", "8a"] },
  { code: "AZ", name: "Arizona", hardiness_zones: ["5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a"] },
  { code: "AR", name: "Arkansas", hardiness_zones: ["6a", "6b", "7a", "7b", "8a", "8b"] },
  { code: "CA", name: "California", hardiness_zones: ["5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a", "10b", "11a"] },
  { code: "CO", name: "Colorado", hardiness_zones: ["3a", "3b", "4a", "4b", "5a", "5b", "6a", "6b", "7a"] },
  { code: "CT", name: "Connecticut", hardiness_zones: ["5b", "6a", "6b", "7a"] },
  { code: "DE", name: "Delaware", hardiness_zones: ["6b", "7a", "7b", "8a"] },
  { code: "DC", name: "District of Columbia", hardiness_zones: ["7a", "7b", "8a"] },
  { code: "FL", name: "Florida", hardiness_zones: ["8a", "8b", "9a", "9b", "10a", "10b", "11a", "11b"] },
  { code: "GA", name: "Georgia", hardiness_zones: ["6b", "7a", "7b", "8a", "8b", "9a"] },
  { code: "HI", name: "Hawaii", hardiness_zones: ["9a", "9b", "10a", "10b", "11a", "11b", "12a", "12b", "13a"] },
  { code: "ID", name: "Idaho", hardiness_zones: ["3a", "3b", "4a", "4b", "5a", "5b", "6a", "6b", "7a"] },
  { code: "IL", name: "Illinois", hardiness_zones: ["5a", "5b", "6a", "6b", "7a"] },
  { code: "IN", name: "Indiana", hardiness_zones: ["5b", "6a", "6b", "7a"] },
  { code: "IA", name: "Iowa", hardiness_zones: ["4b", "5a", "5b", "6a"] },
  { code: "KS", name: "Kansas", hardiness_zones: ["5b", "6a", "6b", "7a"] },
  { code: "KY", name: "Kentucky", hardiness_zones: ["6a", "6b", "7a", "7b"] },
  { code: "LA", name: "Louisiana", hardiness_zones: ["8a", "8b", "9a", "9b", "10a"] },
  { code: "ME", name: "Maine", hardiness_zones: ["3b", "4a", "4b", "5a", "5b", "6a"] },
  { code: "MD", name: "Maryland", hardiness_zones: ["6b", "7a", "7b", "8a"] },
  { code: "MA", name: "Massachusetts", hardiness_zones: ["5b", "6a", "6b", "7a"] },
  { code: "MI", name: "Michigan", hardiness_zones: ["4a", "4b", "5a", "5b", "6a"] },
  { code: "MN", name: "Minnesota", hardiness_zones: ["3a", "3b", "4a", "4b", "5a"] },
  { code: "MS", name: "Mississippi", hardiness_zones: ["7b", "8a", "8b", "9a"] },
  { code: "MO", name: "Missouri", hardiness_zones: ["5b", "6a", "6b", "7a"] },
  { code: "MT", name: "Montana", hardiness_zones: ["3a", "3b", "4a", "4b", "5a", "5b", "6a"] },
  { code: "NE", name: "Nebraska", hardiness_zones: ["4b", "5a", "5b", "6a"] },
  { code: "NV", name: "Nevada", hardiness_zones: ["4a", "5a", "5b", "6a", "6b", "7a", "8a", "9a"] },
  { code: "NH", name: "New Hampshire", hardiness_zones: ["3b", "4b", "5a", "5b", "6a"] },
  { code: "NJ", name: "New Jersey", hardiness_zones: ["6a", "6b", "7a"] },
  { code: "NM", name: "New Mexico", hardiness_zones: ["4b", "5a", "5b", "6a", "6b", "7a", "8a", "9a"] },
  { code: "NY", name: "New York", hardiness_zones: ["3b", "4b", "5a", "5b", "6a", "6b", "7a"] },
  { code: "NC", name: "North Carolina", hardiness_zones: ["6b", "7a", "7b", "8a", "8b"] },
  { code: "ND", name: "North Dakota", hardiness_zones: ["3a", "3b", "4a", "4b", "5a"] },
  { code: "OH", name: "Ohio", hardiness_zones: ["5b", "6a", "6b", "7a"] },
  { code: "OK", name: "Oklahoma", hardiness_zones: ["6a", "6b", "7a", "7b", "8a"] },
  { code: "OR", name: "Oregon", hardiness_zones: ["4b", "5a", "5b", "6a", "6b", "7a", "8a", "9a"] },
  { code: "PA", name: "Pennsylvania", hardiness_zones: ["5a", "5b", "6a", "6b", "7a"] },
  { code: "RI", name: "Rhode Island", hardiness_zones: ["6a", "6b", "7a"] },
  { code: "SC", name: "South Carolina", hardiness_zones: ["7b", "8a", "8b", "9a"] },
  { code: "SD", name: "South Dakota", hardiness_zones: ["3b", "4a", "4b", "5a", "5b"] },
  { code: "TN", name: "Tennessee", hardiness_zones: ["6a", "6b", "7a", "7b", "8a"] },
  { code: "TX", name: "Texas", hardiness_zones: ["6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a"] },
  { code: "UT", name: "Utah", hardiness_zones: ["4a", "5a", "5b", "6a", "6b", "7a", "8a", "9a"] },
  { code: "VT", name: "Vermont", hardiness_zones: ["3b", "4a", "4b", "5a", "5b"] },
  { code: "VA", name: "Virginia", hardiness_zones: ["6a", "6b", "7a", "7b", "8a"] },
  { code: "WA", name: "Washington", hardiness_zones: ["4a", "5a", "5b", "6a", "6b", "7a", "8a", "9a"] },
  { code: "WV", name: "West Virginia", hardiness_zones: ["5b", "6a", "6b", "7a"] },
  { code: "WI", name: "Wisconsin", hardiness_zones: ["3b", "4a", "4b", "5a", "5b"] },
  { code: "WY", name: "Wyoming", hardiness_zones: ["3a", "4a", "4b", "5a", "5b", "6a"] },
];

export const US_STATE_CODES = US_STATES.map((s) => s.code);

const L48_CODES = US_STATE_CODES.filter(
  (c) => !["AK", "HI", "PR", "VI"].includes(c),
);

export function stateByCode(code: string): UsState | undefined {
  return US_STATES.find((s) => s.code === code.toUpperCase());
}

export function stateByName(name: string): UsState | undefined {
  const n = name.trim().toLowerCase();
  return US_STATES.find((s) => s.name.toLowerCase() === n);
}

export function statesForUsdaRegion(region: string): string[] {
  switch (region) {
    case "HI":
      return ["HI"];
    case "AK":
      return ["AK"];
    case "PR":
      return ["PR"];
    case "VI":
      return ["VI"];
    case "L48":
      return [...L48_CODES];
    default:
      return [];
  }
}

/** Higher = warmer USDA subzone (8b > 8a > 4b). */
export function usdaZoneWarmth(zone: string): number {
  const m = /^(\d+)([ab])$/i.exec(zone.trim());
  if (!m) return -1;
  return parseInt(m[1], 10) * 2 + (m[2].toLowerCase() === "b" ? 1 : 0);
}

export type PlantStateClimateFit = "unknown" | "good" | "marginal" | "unlikely";

/** Whether the plant's listed zones are realistically achievable in the state. */
export function assessPlantClimateInState(
  plantZones: string[],
  stateCode: string,
): PlantStateClimateFit {
  if (!plantZones.length || !stateCode.trim()) return "unknown";
  const state = stateByCode(stateCode);
  if (!state?.hardiness_zones.length) return "unknown";

  const plantMins = plantZones
    .map(usdaZoneWarmth)
    .filter((w) => w >= 0);
  if (!plantMins.length) return "unknown";

  const stateWarmest = Math.max(
    ...state.hardiness_zones.map(usdaZoneWarmth),
  );
  const plantMinRequired = Math.min(...plantMins);

  if (stateWarmest < plantMinRequired) return "unlikely";
  if (stateWarmest === plantMinRequired) return "marginal";
  return "good";
}

export function plantZonesOverlapState(
  plantZones: string[],
  stateCode: string,
): boolean {
  if (!plantZones.length) return false;
  const state = stateByCode(stateCode);
  if (!state) return false;
  return plantZones.some((z) => state.hardiness_zones.includes(z));
}

/** Typical representative zone for a state (middle of range). */
export function primaryHardinessZone(stateCode: string): string {
  const state = stateByCode(stateCode);
  if (!state?.hardiness_zones.length) return "";
  const mid = Math.floor(state.hardiness_zones.length / 2);
  return state.hardiness_zones[mid] ?? "";
}

/** Human-readable zone span, e.g. "6a–9b". */
export function hardinessZoneSummary(stateCode: string): string {
  const state = stateByCode(stateCode);
  if (!state?.hardiness_zones.length) return "";
  const zones = state.hardiness_zones;
  if (zones.length === 1) return zones[0];
  return `${zones[0]}–${zones[zones.length - 1]}`;
}

export const DEFAULT_STATE_CODE = "";
