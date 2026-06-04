import type { Plant } from "../schema.js";
import type { TreflePlantDetail, TrefleSpecies } from "../trefle/types.js";
import { effectiveNativeStates } from "./plant-native-status.js";
import { finalizePlantBenefits, sanitizeBenefits } from "./infer-plant-benefits.js";
import { stateByCode } from "./us-states.js";
import {
  CURATED_NATIVE_ORIGIN_BY_ID,
  CURATED_NATIVE_ORIGIN_BY_SCIENTIFIC,
} from "./native-origin-curated.js";
import { isWikiDump } from "./wiki-text.js";

const MAX_NATIVE_ORIGIN_LEN = 120;

const FALSE_FL_BENEFIT_RE =
  /florida native|native to florida|adapted to local climate/i;

/** Trefle ecozone / region slug → readable place name */
const REGION_LABELS: Record<string, string> = {
  africa: "Africa",
  "northern africa": "North Africa",
  "southern africa": "Southern Africa",
  asia: "Asia",
  "eastern asia": "East Asia",
  "western asia": "West Asia",
  "middle asia": "Central Asia",
  "southeast asia": "Southeast Asia",
  "asia-tropical": "tropical Asia",
  europe: "Europe",
  "northern europe": "Northern Europe",
  "southern europe": "Southern Europe",
  "australia and new zealand": "Australia and New Zealand",
  australasia: "Australasia",
  oceania: "Oceania",
  pacific: "the Pacific islands",
  "northern america": "North America",
  "southern america": "South America",
  "south america": "South America",
  "central america": "Central America",
  caribbean: "the Caribbean",
  brazil: "Brazil",
  amazon: "the Amazon basin",
  "amazon basin": "the Amazon basin",
  "amazonia": "the Amazon basin",
  mexico: "Mexico",
  florida: "Florida",
  india: "India",
  china: "China",
  indochina: "Indochina",
  malaysia: "Malaysia",
  indonesia: "Indonesia",
  philippines: "the Philippines",
  "new guinea": "New Guinea",
  madagascar: "Madagascar",
};

function normalizeScientific(name: string): string {
  return name
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

function labelRegion(raw: string): string {
  const key = raw.toLowerCase().replace(/_/g, " ").trim();
  return REGION_LABELS[key] ?? raw.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Prefer non-US native range when Trefle lists both (e.g. tropical fruit). */
function pickNativeRegions(regions: string[]): string[] {
  const labels = regions.map((r) => r.trim()).filter(Boolean);
  const nonUs = labels.filter(
    (r) =>
      !/northern america|united states|u\.s\.|lower 48|l48/i.test(r) &&
      r.toLowerCase() !== "florida",
  );
  return nonUs.length > 0 ? nonUs : labels;
}

export function formatRegionsAsOriginPhrase(regions: string[]): string | null {
  const picked = pickNativeRegions(regions);
  if (!picked.length) return null;

  const labels = [...new Set(picked.map(labelRegion))];
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export function nativeOriginSentence(placePhrase: string): string {
  const trimmed = placePhrase.trim();
  if (!trimmed) return "";
  if (/^native to/i.test(trimmed)) return trimmed;
  if (/^the /i.test(trimmed) || /^a /i.test(trimmed)) {
    return `Native to ${trimmed}`;
  }
  return `Native to ${trimmed}`;
}

export function parseNativeOriginFromWikipedia(text: string): string | null {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  const patterns = [
    /\bnative to ([^.]{8,140})/i,
    /\bendemic to ([^.]{8,120})/i,
    /\boriginating in ([^.]{8,120})/i,
    /\boriginally from ([^.]{8,120})/i,
    /\bindigenous to ([^.]{8,120})/i,
  ];

  for (const re of patterns) {
    const m = cleaned.match(re);
    if (!m?.[1]) continue;
    let place = m[1]
      .replace(/\s*,\s*and\s+/i, " and ")
      .replace(/\s{2,}/g, " ")
      .trim();
    const sciCut = place.match(
      /^(.{8,100}?)(?:\s+[A-Z][a-z]+(?:\s+x\s+|\s+)[a-z][a-z-]+|\.|,;\s)/,
    );
    if (sciCut?.[1]) place = sciCut[1].trim();
    if (place.length > 90) {
      place = place.slice(0, 90).replace(/\s+\S*$/, "").trim();
    }
    if (place.length < 8) continue;
    if (/^\d/.test(place)) continue;
    return nativeOriginSentence(place);
  }

  return null;
}

function curatedOrigin(plant: Plant): string | null {
  const byId = CURATED_NATIVE_ORIGIN_BY_ID[plant.id];
  if (byId) return nativeOriginSentence(byId);

  const sci = normalizeScientific(plant.scientific_name);
  const bySci = CURATED_NATIVE_ORIGIN_BY_SCIENTIFIC[sci];
  if (bySci) return nativeOriginSentence(bySci);

  const genus = sci.split(" ")[0];
  const genusEntry = CURATED_NATIVE_ORIGIN_BY_SCIENTIFIC[genus];
  if (genusEntry) return nativeOriginSentence(genusEntry);

  return null;
}

function trefleNativeRegions(detail: TreflePlantDetail | null): string[] {
  const sp: TrefleSpecies | null = detail?.main_species ?? null;
  return sp?.distribution?.native ?? [];
}

function usStatesOrigin(plant: Plant): string | null {
  const codes = effectiveNativeStates(plant);
  if (!codes.length) return null;

  const names = codes
    .map((c) => stateByCode(c)?.name ?? c)
    .filter(Boolean);
  if (!names.length) return null;

  if (names.length === 1) {
    return nativeOriginSentence(names[0]);
  }
  if (names.length === 2) {
    return nativeOriginSentence(`${names[0]} and ${names[1]}`);
  }
  return nativeOriginSentence(
    `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`,
  );
}

/** Catalog-safe native range line (rejects saved Wikipedia dumps). */
export function sanitizeNativeOriginLabel(
  text: string | null | undefined,
): string | null {
  const t = text?.trim();
  if (!t || isWikiDump(t)) return null;
  if (/^native to florida$/i.test(t) || /^native to your state$/i.test(t)) {
    return null;
  }
  if (t.length > MAX_NATIVE_ORIGIN_LEN) {
    return t.slice(0, MAX_NATIVE_ORIGIN_LEN - 1).replace(/\s+\S*$/, "").trim() + "…";
  }
  return t;
}

export function inferNativeOrigin(
  plant: Plant,
  opts: { trefleDetail?: TreflePlantDetail | null; wikiText?: string | null } = {},
): string | null {
  const existing = sanitizeNativeOriginLabel(plant.native_origin);
  if (existing) return existing;

  const curated = curatedOrigin(plant);
  if (curated) return curated;

  const wiki =
    parseNativeOriginFromWikipedia(opts.wikiText ?? "") ||
    parseNativeOriginFromWikipedia(plant.care_summary ?? "") ||
    parseNativeOriginFromWikipedia(plant.observations ?? "");
  if (wiki) return sanitizeNativeOriginLabel(wiki);

  let regions = trefleNativeRegions(opts.trefleDetail ?? null);
  if (!regions.length && plant.trefle_json) {
    try {
      const parsed = JSON.parse(plant.trefle_json) as TreflePlantDetail;
      regions = trefleNativeRegions(parsed);
    } catch {
      /* ignore */
    }
  }

  const phrase = formatRegionsAsOriginPhrase(regions);
  if (phrase) return nativeOriginSentence(phrase);

  return usStatesOrigin(plant);
}

export function stripFalseFloridaNativeBenefits(benefits: string[]): string[] {
  return sanitizeBenefits(
    benefits.filter((b) => !FALSE_FL_BENEFIT_RE.test(b)),
  );
}

/** Set native_origin and refresh benefits so profiles state real homelands. */
export function enrichPlantNativeOrigin(
  plant: Plant,
  opts: { trefleDetail?: TreflePlantDetail | null; wikiText?: string | null } = {},
): Plant {
  const native_origin = inferNativeOrigin(plant, opts);
  const cleanedBenefits = stripFalseFloridaNativeBenefits(plant.benefits ?? []);
  const merged: Plant = {
    ...plant,
    native_origin,
    benefits: cleanedBenefits,
  };
  merged.benefits = finalizePlantBenefits(merged);
  return merged;
}
