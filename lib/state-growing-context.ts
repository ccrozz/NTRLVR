/**
 * State-relative copy for catalog growing guides — climate band, zone span,
 * regional timing, and filtering care text written for other states.
 */
import {
  assessPlantClimateInState,
  hardinessZoneSummary,
  stateByCode,
  usdaZoneWarmth,
  US_STATES,
  type PlantStateClimateFit,
} from "./us-states.js";

export type StateGrowingContext = {
  stateCode: string;
  stateName: string;
  /** e.g. "3a–8a" for Alaska */
  stateZoneSpan: string;
  climateBand: StateClimateBand;
  zoneSpread: number;
};

export type StateClimateBand =
  | "subarctic"
  | "cold"
  | "cool"
  | "temperate"
  | "warm"
  | "subtropical"
  | "tropical";

function zoneSortKey(zone: string): number {
  return usdaZoneWarmth(zone);
}

function sortZones(zones: string[]): string[] {
  return [...new Set(zones.map((z) => z.trim()).filter(Boolean))].sort(
    (a, b) => zoneSortKey(a) - zoneSortKey(b),
  );
}

export function formatZoneRange(zones: string[]): string | null {
  const sorted = sortZones(zones);
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return first === last ? first : `${first}–${last}`;
}

/** Warmest USDA zone number in the state (e.g. 8 for 8a). */
function warmestZoneNumber(stateCode: string): number {
  const state = stateByCode(stateCode);
  if (!state?.hardiness_zones.length) return 7;
  const warmest = Math.max(...state.hardiness_zones.map(usdaZoneWarmth));
  return Math.floor(warmest / 2);
}

export function stateClimateBand(stateCode: string): StateClimateBand {
  const zn = warmestZoneNumber(stateCode);
  if (zn <= 3) return "subarctic";
  if (zn <= 5) return "cold";
  if (zn <= 7) return "cool";
  if (zn <= 8) return "temperate";
  if (zn <= 9) return "warm";
  if (zn <= 10) return "subtropical";
  return "tropical";
}

function stateZoneSpread(stateCode: string): number {
  const state = stateByCode(stateCode);
  if (!state?.hardiness_zones.length) return 0;
  const warmth = state.hardiness_zones.map(usdaZoneWarmth);
  return Math.max(...warmth) - Math.min(...warmth);
}

/** Curated intra-state timing notes (supplements auto wide-span notes). */
const STATE_REGIONAL_TIMING: Partial<Record<string, string>> = {
  AK: "Southcoast planting windows differ sharply from interior and northern Alaska — use your local zone, not a single statewide date.",
  CA: "Coast, Central Valley, and mountain zones in California can differ by months — match the badge to your garden, not a statewide average.",
  CO: "Front Range vs high country in Colorado can be two zones apart — plant after your local last frost.",
  FL: "North Florida often runs a few weeks later than the peninsula for the same crop — trust your zone badge.",
  HI: "Windward vs leeward and elevation change timing across the islands.",
  TX: "Panhandle frost dates are weeks later than the Gulf Coast for the same calendar month.",
  WA: "Puget Sound, eastern Washington, and mountain gaps have very different frost dates.",
  OR: "Willamette Valley vs high desert vs coast — check your local extension calendar.",
  NY: "Adirondacks vs NYC metro can be a full zone apart for spring planting.",
  NC: "Mountains vs Piedmont vs coast in North Carolina shift planting by weeks.",
};

const REGION_PHRASE_STATES: Record<string, string[]> = {
  "new england": ["CT", "ME", "MA", "NH", "RI", "VT"],
  "pacific northwest": ["WA", "OR", "ID"],
  southeast: [
    "AL",
    "FL",
    "GA",
    "KY",
    "LA",
    "MS",
    "NC",
    "SC",
    "TN",
    "VA",
    "WV",
    "AR",
  ],
  "deep south": ["AL", "GA", "LA", "MS", "SC"],
  southwest: ["AZ", "NM", "NV", "UT"],
};

export function growingContextForState(stateCode: string): StateGrowingContext | null {
  const code = stateCode.trim().toUpperCase();
  if (!code) return null;
  const state = stateByCode(code);
  if (!state) return null;

  return {
    stateCode: code,
    stateName: state.name,
    stateZoneSpan: hardinessZoneSummary(code),
    climateBand: stateClimateBand(code),
    zoneSpread: stateZoneSpread(code),
  };
}

export function careTextIsForAnotherState(
  text: string,
  userStateCode: string,
): boolean {
  const user = userStateCode.trim().toUpperCase();
  if (!user) return false;

  for (const st of US_STATES) {
    if (st.code === user) continue;
    if (new RegExp(`\\b${escapeRegExp(st.name)}\\b`, "i").test(text)) {
      return true;
    }
  }

  for (const [phrase, codes] of Object.entries(REGION_PHRASE_STATES)) {
    if (!new RegExp(`\\b${phrase}\\b`, "i").test(text)) continue;
    if (!codes.includes(user)) return true;
  }

  if (user !== "FL" && /\bflorida\b/i.test(text)) return true;

  return false;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function plantZonesInState(
  plantZones: string[],
  stateCode: string,
): string[] {
  const state = stateByCode(stateCode);
  if (!state?.hardiness_zones.length) return [];
  const allowed = new Set(
    state.hardiness_zones.map((z) => z.toLowerCase()),
  );
  return sortZones(plantZones).filter((z) => allowed.has(z.toLowerCase()));
}

export function stateRegionalTimingNote(ctx: StateGrowingContext): string {
  const curated = STATE_REGIONAL_TIMING[ctx.stateCode];
  if (curated) return curated;

  if (ctx.zoneSpread >= 8) {
    return `${ctx.stateName} spans many USDA zones — use your local zone on the badge, not one statewide planting date.`;
  }
  if (ctx.zoneSpread >= 5) {
    return `In ${ctx.stateName}, planting dates shift with elevation and latitude — check your local last-frost date against zones ${ctx.stateZoneSpan}.`;
  }
  return `In ${ctx.stateName}, match planting time to your USDA zone (typically ${ctx.stateZoneSpan}) and your local last-frost date.`;
}

export function statePlantingTimingSuffix(ctx: StateGrowingContext): string {
  return ` ${stateRegionalTimingNote(ctx)}`;
}

export function stateFrostFreeLead(ctx: StateGrowingContext): string {
  const { stateName, climateBand } = ctx;
  switch (climateBand) {
    case "tropical":
    case "subtropical":
    case "warm":
      return `In the warmest, frost-free parts of ${stateName}`;
    case "temperate":
      return `In mild, frost-free pockets of ${stateName}`;
    case "cool":
      return `Where ${stateName} sees only light frost`;
    case "cold":
    case "subarctic":
      return `In the warmest zones of ${stateName}`;
    default:
      return `In frost-free parts of ${stateName}`;
  }
}

export function stateSoilAmendmentNote(ctx: StateGrowingContext): string {
  const { stateCode, climateBand } = ctx;
  if (stateCode === "FL") {
    return " In sandy soil, mix in compost at planting time.";
  }
  if (["CT", "ME", "NH", "VT", "MA", "RI", "NY", "MI", "WI", "MN"].includes(stateCode)) {
    return " In acidic soils common in the Northeast, test pH before planting acid-loving species.";
  }
  if (["AZ", "NM", "NV", "UT"].includes(stateCode) || climateBand === "warm") {
    return " In alkaline or desert soils, improve organic matter at planting and mulch to hold moisture.";
  }
  if (climateBand === "subarctic" || climateBand === "cold") {
    return " Work compost into the planting hole; raised beds warm faster in short seasons.";
  }
  return " Work in compost at planting if your soil is poor, heavy, or very sandy.";
}

export function stateDefaultPlantingSeason(
  ctx: StateGrowingContext,
  category: string,
): string {
  const { stateName, climateBand } = ctx;
  const cat = category;

  if (cat === "Vegetable" || cat === "Herb") {
    if (climateBand === "subarctic" || climateBand === "cold") {
      return `In ${stateName}, use a short summer window after last frost; some crops need season extension (row cover, greenhouse).`;
    }
    if (climateBand === "cool" || climateBand === "temperate") {
      return `In ${stateName}, plant spring crops after last frost and use fall for a second cool-season crop where summers allow.`;
    }
    return `In ${stateName}, spring and fall are the main planting windows; summer heat limits some herbs and greens.`;
  }

  if (cat === "Native Shrub" || /\bnative\b/i.test(cat)) {
    if (climateBand === "subarctic" || climateBand === "cold") {
      return `In ${stateName}, spring planting after frost works; water through the first growing season.`;
    }
    return `In ${stateName}, fall or early spring planting lets roots establish before summer stress.`;
  }

  if (cat === "Fruit Tree" || cat === "Citrus") {
    return `In ${stateName}, plant bare-root or container trees in late winter to early spring while dormant — before summer heat or, in cold states, while the ground is workable.`;
  }

  if (climateBand === "subarctic" || climateBand === "cold") {
    return `In ${stateName}, plant after your last frost when the ground has thawed — cloudy days or late afternoon reduce transplant shock.`;
  }

  return `In ${stateName}, spring after your last frost is the safest default once nights stay consistently above freezing.`;
}

export function stateFirstYearNote(
  ctx: StateGrowingContext,
  category: string,
  isEdible: boolean,
): string {
  const base =
    category === "Fruit Tree" || category === "Citrus"
      ? "First year focus: keep the root zone moist, skip heavy fertilizer, and don’t expect much fruit yet — you’re building the framework for later harvests."
      : category === "Vegetable" || category === "Herb"
        ? "First season focus: harvest lightly and often to encourage production; replant when heat or frost ends the crop."
        : isEdible
          ? "First season focus: taste-test when fruit or pods look mature; when in doubt, look for color change and a slight softening."
          : "First year focus: steady water and mulch — most perennials put energy into roots before top growth.";

  if (ctx.climateBand === "subarctic" || ctx.climateBand === "cold") {
    return `${base} In ${ctx.stateName}, protect marginally hardy plants through the first winter (mulch, windbreak, or pots you can move).`;
  }
  return base;
}

export function stateHarvestNote(
  ctx: StateGrowingContext,
  category: string,
): string {
  if (category === "Vegetable" || category === "Herb") {
    if (ctx.climateBand === "subarctic" || ctx.climateBand === "cold") {
      return `Pick young and often during ${ctx.stateName}'s short season; harvest before hard frost.`;
    }
    return `Pick young and often for best flavor. Morning harvests usually hold up better in ${ctx.stateName} summer heat than afternoon picks.`;
  }
  if (
    category === "Fruit Tree" ||
    category === "Citrus" ||
    category === "Tropical Fruit" ||
    category === "Berry"
  ) {
    return `Fruit trees and berries often need 2–5 years before serious crops in ${ctx.stateName}. Sample fruit when color and aroma look ripe.`;
  }
  return "When the edible part looks mature and tastes good in a sample bite or slice, you’re there.";
}

export type StateFitNarrative = {
  fit: PlantStateClimateFit;
  plantZoneLabel: string;
  overlapLabel: string | null;
};

export function assessPlantForState(
  plantZones: string[],
  stateCode: string,
): StateFitNarrative {
  const fit = assessPlantClimateInState(plantZones, stateCode);
  const plantZoneLabel =
    formatZoneRange(plantZones) ?? plantZones.join(", ") ?? "";
  const overlap = plantZonesInState(plantZones, stateCode);
  const overlapLabel = overlap.length ? formatZoneRange(overlap) : null;
  return { fit, plantZoneLabel, overlapLabel };
}
