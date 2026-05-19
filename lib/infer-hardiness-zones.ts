import { subzonesFromUsdaRange } from "./growing-zones.js";
import { US_STATES } from "./us-states.js";
import type { TrefleGrowth } from "../trefle/types.js";

/** Approximate USDA zone from minimum annual temperature (°F). */
export function usdaZoneFromMinTempF(minF: number): number {
  if (minF >= 50) return 11;
  if (minF >= 40) return 10;
  if (minF >= 30) return 9;
  if (minF >= 20) return 8;
  if (minF >= 10) return 7;
  if (minF >= 0) return 6;
  if (minF >= -10) return 5;
  if (minF >= -20) return 4;
  if (minF >= -30) return 3;
  if (minF >= -40) return 2;
  return 1;
}

export function zonesFromTrefleGrowth(
  growth?: TrefleGrowth | null,
): string[] {
  if (!growth) return [];
  const minF = growth.minimum_temperature?.deg_f;
  const maxF = growth.maximum_temperature?.deg_f;
  if (minF == null && maxF == null) return [];

  const lo = usdaZoneFromMinTempF(minF ?? maxF ?? 32);
  const hi = maxF != null ? usdaZoneFromMinTempF(maxF) : lo;
  return subzonesFromUsdaRange(Math.min(lo, hi), Math.max(lo, hi));
}

/** Union of typical zones for documented native US states. */
export function zonesFromNativeStates(stateCodes: string[]): string[] {
  const zones = new Set<string>();
  for (const code of stateCodes) {
    const st = US_STATES.find((s) => s.code === code.toUpperCase());
    if (st) st.hardiness_zones.forEach((z) => zones.add(z));
  }
  return [...zones].sort();
}

const ZONE_TEXT_RE =
  /(?:usda\s+)?(?:plant\s+)?hardiness\s+zones?\s*(?:of\s*)?(\d{1,2})\s*(?:[–—-]|through|to)\s*(\d{1,2})/gi;

const ZONE_LIST_RE =
  /(?:zones?|hardiness)\s*[:\s]+(\d{1,2}[ab]?(?:\s*[,;]\s*\d{1,2}[ab]?)+|\d{1,2}\s*(?:[–—-]|to)\s*\d{1,2})/gi;

const SINGLE_ZONE_RE =
  /\b(?:usda\s+)?zone\s+(\d{1,2})([ab])?\b/gi;

export function parseHardinessZonesFromText(text: string): string[] {
  if (!text?.trim()) return [];
  const zones = new Set<string>();

  for (const m of text.matchAll(ZONE_TEXT_RE)) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      subzonesFromUsdaRange(Math.min(a, b), Math.max(a, b)).forEach((z) =>
        zones.add(z),
      );
    }
  }

  for (const m of text.matchAll(SINGLE_ZONE_RE)) {
    const n = parseInt(m[1], 10);
    const half = m[2]?.toLowerCase();
    if (n >= 1 && n <= 13) {
      if (half === "a" || half === "b") zones.add(`${n}${half}`);
      else subzonesFromUsdaRange(n, n).forEach((z) => zones.add(z));
    }
  }

  const rangeMatch = text.match(
    /hardiness[^.]{0,40}?(\d{1,2})\s*(?:[–—-]|to)\s*(\d{1,2})/i,
  );
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1], 10);
    const b = parseInt(rangeMatch[2], 10);
    if (a >= 1 && b <= 13) {
      subzonesFromUsdaRange(Math.min(a, b), Math.max(a, b)).forEach((z) =>
        zones.add(z),
      );
    }
  }

  return [...zones].sort();
}

export function mergeZoneLists(...lists: string[][]): string[] {
  return [...new Set(lists.flat())].sort();
}
