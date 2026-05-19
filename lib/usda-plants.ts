/**
 * USDA PLANTS Database API (official JSON service).
 * https://plantsservices.sc.egov.usda.gov/
 */

import {
  plantZonesOverlapState,
  statesForUsdaRegion,
} from "./us-states.js";

const USDA_BASE = "https://plantsservices.sc.egov.usda.gov/api";
const USER_AGENT =
  "Naturelover/1.0 (food forest plant guide; educational use)";

type UsdaNativeStatus = {
  Region: string;
  Status: string;
  Type: string;
};

type UsdaMapCoordinate = {
  StateAbbr?: string;
};

type UsdaPlantProfile = {
  Symbol: string;
  ScientificName?: string;
  CommonName?: string;
  NativeStatuses?: UsdaNativeStatus[] | null;
  MapCoordinates?: UsdaMapCoordinate[] | null;
};

type UsdaSearchHit = {
  Plant?: {
    Symbol?: string;
    ScientificName?: string;
    CommonName?: string;
    Rank?: string;
  };
};

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function normalizeScientific(name: string): string {
  return name
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

async function usdaGet<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const url = new URL(`${USDA_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function lookupUsdaSymbol(
  scientificName: string,
): Promise<string | null> {
  const hits = await usdaGet<UsdaSearchHit[]>("PlantSearch", {
    searchText: scientificName,
  });
  if (!hits?.length) return null;

  const target = normalizeScientific(scientificName);
  const genus = target.split(" ")[0];

  const species =
    hits.find((h) => {
      const sn = stripHtml(h.Plant?.ScientificName ?? "");
      return normalizeScientific(sn) === target;
    }) ??
    hits.find((h) => {
      const sn = stripHtml(h.Plant?.ScientificName ?? "");
      return (
        h.Plant?.Rank === "Species" &&
        normalizeScientific(sn).startsWith(genus)
      );
    }) ??
    hits[0];

  return species?.Plant?.Symbol ?? null;
}

export async function fetchUsdaProfile(
  symbol: string,
): Promise<UsdaPlantProfile | null> {
  return usdaGet<UsdaPlantProfile>("PlantProfile", { symbol });
}

/** State abbreviations where USDA lists the species as native. */
export function nativeStatesFromProfile(
  profile: UsdaPlantProfile,
  plantHardinessZones: string[],
): string[] {
  const native = new Set<string>();

  for (const row of profile.NativeStatuses ?? []) {
    if (row.Status !== "N") continue;
    const candidates = statesForUsdaRegion(row.Region);
    for (const code of candidates) {
      if (row.Region === "L48") {
        if (!plantHardinessZones.length) continue;
        if (plantZonesOverlapState(plantHardinessZones, code)) {
          native.add(code);
        }
      } else {
        native.add(code);
      }
    }
  }

  return [...native].sort();
}

const US_MAP_ABBRS = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI",
  "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN",
  "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH",
  "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
  "WV", "WI", "WY", "PR", "VI", "GU", "AS", "MP", "L48",
]);

export function growsInUsFromUsdaProfile(profile: UsdaPlantProfile): boolean {
  for (const row of profile.NativeStatuses ?? []) {
    if (row.Region === "L48" || row.Region === "HI" || row.Region === "PR") {
      return true;
    }
  }
  for (const m of profile.MapCoordinates ?? []) {
    const abbr = m.StateAbbr?.toUpperCase();
    if (abbr && US_MAP_ABBRS.has(abbr)) return true;
  }
  return false;
}

export async function fetchUsdaPlantFacts(
  scientificName: string,
  plantHardinessZones: string[],
): Promise<{
  native_states: string[];
  usda_symbol: string | null;
  grows_in_us: boolean;
}> {
  const symbol = await lookupUsdaSymbol(scientificName);
  if (!symbol) {
    return { native_states: [], usda_symbol: null, grows_in_us: false };
  }

  const profile = await fetchUsdaProfile(symbol);
  if (!profile) {
    return { native_states: [], usda_symbol: symbol, grows_in_us: false };
  }

  const grows_in_us = growsInUsFromUsdaProfile(profile);
  const native_states = profile.NativeStatuses?.length
    ? nativeStatesFromProfile(profile, plantHardinessZones)
    : [];

  return {
    native_states,
    usda_symbol: symbol,
    grows_in_us,
  };
}

/** @deprecated Use fetchUsdaPlantFacts */
export async function fetchNativeStatesForPlant(
  scientificName: string,
  plantHardinessZones: string[],
): Promise<{ native_states: string[]; usda_symbol: string | null }> {
  const facts = await fetchUsdaPlantFacts(scientificName, plantHardinessZones);
  return {
    native_states: facts.native_states,
    usda_symbol: facts.usda_symbol,
  };
}
