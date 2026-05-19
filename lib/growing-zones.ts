/** USDA Plant Hardiness Zones for the United States (half-zone precision, 1a–13b). */
function buildSubzones(min: number, max: number): string[] {
  const zones: string[] = [];
  for (let z = min; z <= max; z++) {
    zones.push(`${z}a`, `${z}b`);
  }
  return zones;
}

export const US_GROWING_ZONES = buildSubzones(1, 13);

/** @deprecated Use US_GROWING_ZONES — kept for imports that still reference Florida subset */
export const FLORIDA_GROWING_ZONES = buildSubzones(8, 11);

export type GrowingZone = (typeof US_GROWING_ZONES)[number];

export const ALL_USDA_ZONE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

/** Whole USDA zones (1–13) for filters and display. */
export function subzonesFromUsda(usda: number): string[] {
  return [`${usda}a`, `${usda}b`];
}

export function subzonesFromUsdaRange(min: number, max: number): string[] {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const zones: string[] = [];
  for (let z = lo; z <= hi; z++) {
    zones.push(...subzonesFromUsda(z));
  }
  return zones;
}

/** Match filter "9", "9a", or "10b" against plant zone list. */
export function plantMatchesGrowingZone(
  plantZones: string[],
  filter: string,
): boolean {
  if (!filter || plantZones.length === 0) return false;
  const f = filter.toLowerCase().trim();
  if (/^\d+[ab]$/.test(f)) {
    return plantZones.some((z) => z.toLowerCase() === f);
  }
  if (/^\d+$/.test(f)) {
    return plantZones.some((z) => z.startsWith(f));
  }
  return plantZones.some((z) => z.toLowerCase() === f);
}

export function parseUsdaZoneList(envValue: string | undefined): number[] {
  if (!envValue?.trim()) return [];
  return envValue
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 13);
}

/** @deprecated Use parseUsdaZoneList */
export const parseFloridaZoneList = parseUsdaZoneList;

export const DEFAULT_FLORIDA_USDA_ZONES = [8, 9, 10, 11];

export function usdaNumbersForZonePicker(): number[] {
  return [...ALL_USDA_ZONE_NUMBERS];
}
