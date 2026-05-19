import type { TreflePlantDetail, TrefleSpecies } from "../trefle/types.js";

/** Trefle / POWO region strings that indicate presence in the United States. */
const US_REGION_RE =
  /\b(florida|hawaii|alaska|puerto rico|virgin is|u\.?s\.?a|united states|texas|california|oregon|washington|arizona|new mexico|louisiana|georgia|alabama|mississippi|tennessee|carolinas?|virginia|maryland|pennsylvania|new york|new england|midwest|great plains|rocky mountains?|southwest u\.?s|southeast u\.?s|northwest u\.?s|northeast u\.?s|south-central u\.?s|west virginia|oklahoma|arkansas|missouri|illinois|indiana|ohio|michigan|wisconsin|minnesota|iowa|kansas|nebraska|dakotas?|montana|wyoming|colorado|utah|nevada|idaho|maine|vermont|new hampshire|massachusetts|rhode island|connecticut|new jersey|delaware|kentucky|appalachia)\b/i;

const NON_US_ONLY_RE =
  /\b(europe only|africa only|asia only|australia only|new zealand only|endemic to (?!.*united states))\b/i;

export function isUsTrefleRegion(region: string): boolean {
  const r = region.trim();
  if (!r) return false;
  if (US_REGION_RE.test(r)) return true;
  if (/^u\.?s\.?/i.test(r)) return true;
  if (/\b(l48|lower 48)\b/i.test(r)) return true;
  return false;
}

export function growsInUsFromTrefleDistribution(
  distribution?: { native?: string[]; introduced?: string[] } | null,
): boolean {
  if (!distribution) return false;
  const regions = [
    ...(distribution.native ?? []),
    ...(distribution.introduced ?? []),
  ];
  if (!regions.length) return false;
  return regions.some((r) => isUsTrefleRegion(r));
}

export function growsInUsFromTrefleSpecies(sp: TrefleSpecies | null): boolean {
  if (!sp) return false;
  if (growsInUsFromTrefleDistribution(sp.distribution)) return true;
  if (sp.observations && isUsTrefleRegion(sp.observations)) return true;
  return false;
}

export function growsInUsFromTrefleDetail(detail: TreflePlantDetail): boolean {
  const sp = detail.main_species ?? null;
  if (growsInUsFromTrefleSpecies(sp)) return true;
  if (detail.observations && isUsTrefleRegion(detail.observations)) {
    if (!NON_US_ONLY_RE.test(detail.observations)) return true;
  }
  return false;
}

export function growsInUsFromObservations(observations: string | null): boolean {
  if (!observations?.trim()) return false;
  if (NON_US_ONLY_RE.test(observations)) return false;
  return isUsTrefleRegion(observations);
}
