import {
  assessPlantForState,
  careTextIsForAnotherState,
  formatZoneRange,
  growingContextForState,
  stateDefaultPlantingSeason,
  stateFrostFreeLead,
  stateFirstYearNote,
  stateHarvestNote,
  statePlantingTimingSuffix,
  stateSoilAmendmentNote,
  type StateGrowingContext,
} from "@lib/state-growing-context";
import {
  plantIsNativeToState,
  plantQualifiesAsDocumentedNative,
} from "@lib/plant-native-status";
import { sanitizeNativeOriginLabel } from "@lib/native-origin";
import { isWikiDump } from "@lib/wiki-text";
import type { Plant, PlantCategory } from "../types";

export type GuideContext = StateGrowingContext;

export type GuideBlock = {
  title: string;
  body?: string;
  items?: string[];
};

export type CatalogPlantGuide = {
  intro: string;
  blocks: GuideBlock[];
  /** Set when guide is tailored to a catalog state */
  stateName?: string;
  needsState?: boolean;
};

function plantZones(plant: Plant): string[] {
  return plant.florida_hardiness_zones ?? plant.growing_zones ?? [];
}

function isDistributionBlurb(text: string): boolean {
  return /\b(introduced to|native to|observed in|widespread|distribution|naturalized in)\b/i.test(
    text,
  );
}

function formatSeasons(seasons: string[]): string {
  const unique = [...new Set(seasons.filter(Boolean))];
  if (!unique.length) return "";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
}

function pickStateBlock(): GuideBlock {
  return {
    title: "Choose your state",
    body: "Pick your state on the plant catalog page so timing, climate, and native notes match where you actually garden.",
  };
}

function growingInStateBlock(
  plant: Plant,
  ctx: StateGrowingContext,
): GuideBlock | null {
  const zones = plantZones(plant);
  const { fit, plantZoneLabel, overlapLabel } = assessPlantForState(
    zones,
    ctx.stateCode,
  );
  const nativeHere = plantIsNativeToState(plant, ctx.stateCode);
  const documentedNative = plantQualifiesAsDocumentedNative(plant);

  const parts: string[] = [];

  if (nativeHere) {
    parts.push(
      `This species is documented as native to ${ctx.stateName} — a strong fit for habitat-focused plantings in zones ${ctx.stateZoneSpan}.`,
    );
  } else if (fit === "good" && overlapLabel) {
    parts.push(
      `In ${ctx.stateName} (USDA ${ctx.stateZoneSpan}), this plant’s listed zones (${plantZoneLabel}) overlap your area at ${overlapLabel}.`,
    );
  } else if (fit === "marginal" && overlapLabel) {
    parts.push(
      `In ${ctx.stateName}, zones ${overlapLabel} overlap this plant’s range (${plantZoneLabel}) — only the warmest parts of the state are a realistic outdoor bet.`,
    );
  } else if (fit === "unlikely" && plantZoneLabel) {
    parts.push(
      `In ${ctx.stateName} (USDA ${ctx.stateZoneSpan}), this plant is listed for ${plantZoneLabel}, which is warmer than most of the state. Try protected microclimates, containers, or a greenhouse.`,
    );
  } else if (plantZoneLabel) {
    parts.push(
      `In ${ctx.stateName} (USDA ${ctx.stateZoneSpan}), compare the plant’s zones (${plantZoneLabel}) to your garden before committing.`,
    );
  }

  if (
    documentedNative &&
    !nativeHere &&
    sanitizeNativeOriginLabel(plant.native_origin)
  ) {
    parts.push(
      `Not native to ${ctx.stateName}. ${sanitizeNativeOriginLabel(plant.native_origin)}`,
    );
  } else if (documentedNative && !nativeHere) {
    parts.push(
      `Not native to ${ctx.stateName} — confirm range on the badge before restoration plantings.`,
    );
  }

  if (!parts.length) return null;

  return {
    title: `Growing in ${ctx.stateName}`,
    body: parts.join(" "),
  };
}

function whenToPlantNarrative(
  plant: Plant,
  ctx: StateGrowingContext,
): GuideBlock {
  const seasons = plant.best_planting_seasons ?? [];
  const hasYearRound = seasons.some((s) => /year[- ]?round/i.test(s));
  const named = seasons.filter((s) => !/year[- ]?round/i.test(s));

  if (hasYearRound && named.length === 0) {
    return {
      title: "When to plant",
      body: `${stateFrostFreeLead(ctx)} you can usually plant this any time of year. Where frost still happens, wait until after your last frost and plant in the warmer months.`,
    };
  }

  if (named.length > 0) {
    const list = formatSeasons(named);
    let body = `Best planting window: ${list}.${statePlantingTimingSuffix(ctx)}`;
    if (plant.category === "Fruit Tree" || plant.category === "Citrus") {
      body +=
        " For trees, late winter to early spring (while dormant) is ideal so roots establish before summer heat.";
    }
    if (plant.category === "Vegetable" || plant.category === "Herb") {
      body +=
        " For quick crops, you can often start seeds or transplants at the start of each listed season.";
    }
    return { title: "When to plant", body };
  }

  const byCategory: Partial<Record<PlantCategory, string>> = {
    "Fruit Tree":
      "Plant bare-root or container trees in late winter to early spring, before new leaves push. Avoid the hottest, driest weeks if you can — steady moisture helps roots settle.",
    Citrus:
      "Spring is the sweet spot after frost danger passes. Container-grown citrus can go in when nights stay consistently warm.",
    "Tropical Fruit":
      "Wait until frost is unlikely, then plant in spring or early summer so warmth fuels root growth.",
    Berry:
      "Late fall or winter for dormant berries where winters are mild; spring for potted plants everywhere. Mulch well to keep roots cool and moist.",
    Vine: "Spring planting after frost gives vines a full season to climb and establish.",
    Palm: "Warm soil in frost-free zones; in marginal zones, spring and summer are safest.",
  };

  const fallback =
    byCategory[plant.category] ??
    stateDefaultPlantingSeason(ctx, plant.category);

  return { title: "When to plant", body: fallback };
}

function careTipItems(plant: Plant, ctx: StateGrowingContext): string[] {
  const tips: string[] = [];

  const care = plant.care_summary?.trim();
  if (
    care &&
    care.length >= 20 &&
    !isWikiDump(care) &&
    !isDistributionBlurb(care) &&
    !careTextIsForAnotherState(care, ctx.stateCode)
  ) {
    tips.push(care);
  }

  if (plant.sunlight?.trim() && plant.sunlight !== "Adaptable") {
    tips.push(`Light: ${plant.sunlight} — match this as closely as you can for happiest growth.`);
  } else if (plant.sunlight === "Adaptable") {
    const shadeNote =
      ctx.climateBand === "warm" ||
      ctx.climateBand === "subtropical" ||
      ctx.climateBand === "tropical"
        ? "a little afternoon shade can help in the hottest months"
        : "choose the sunniest spot you have for fruit and veggies";
    tips.push(`Light: adaptable — usually full sun; ${shadeNote}.`);
  }

  if (plant.water_needs === "High") {
    tips.push(
      "Water: keep soil consistently moist, especially the first 3–6 months. Mulch 2–3 inches deep (not touching the trunk) to cut evaporation.",
    );
  } else if (plant.water_needs === "Drought Tolerant") {
    tips.push(
      "Water: drought tolerant once established, but still water deeply 1–2 times per week during the first year.",
    );
  } else if (plant.water_needs?.trim()) {
    tips.push(
      `Water: ${plant.water_needs.toLowerCase()} — deep, infrequent soakings beat light daily sprinkles for roots.`,
    );
  }

  if (plant.soil_preferences?.length) {
    const soil = plant.soil_preferences.join(", ").toLowerCase();
    tips.push(`Soil: prefers ${soil}.${stateSoilAmendmentNote(ctx)}`);
  } else if (
    ctx.climateBand === "subarctic" ||
    ctx.climateBand === "cold" ||
    ctx.climateBand === "cool"
  ) {
    tips.push(
      `Soil: in ${ctx.stateName}, improve planting holes with compost; drainage matters where soils stay cold and wet.`,
    );
  }

  const [sMin, sMax] = plant.mature_spread_feet ?? [];
  if (sMin != null && sMax != null && sMax > 0) {
    tips.push(
      `Spacing: allow roughly ${sMin}–${sMax} ft of spread at maturity so air can move between plants.`,
    );
  }

  if (plant.growth_rate === "Fast") {
    tips.push(
      "Growth: fast grower — you may see noticeable change within a season; prune lightly to keep shape.",
    );
  } else if (plant.growth_rate === "Slow") {
    tips.push(
      "Growth: slow and steady — be patient the first year; energy often goes to roots before top growth.",
    );
  }

  if (tips.length === 0) {
    tips.push(
      `Mulch around the base, water deeply when the top inch of soil feels dry, and check leaves weekly — standard care in ${ctx.stateName}.`,
    );
  }

  return [...new Set(tips)].slice(0, 6);
}

function harvestBlock(plant: Plant, ctx: StateGrowingContext): GuideBlock | null {
  if (!plant.is_edible) return null;

  if (plant.edible_part?.trim()) {
    return {
      title: "Harvest",
      body: `Edible part: ${plant.edible_part.trim()}. Harvest when quality is peak — flavor and texture beat size alone.`,
    };
  }

  return {
    title: "Harvest",
    body: stateHarvestNote(ctx, plant.category),
  };
}

function plantKindPhrase(plant: Plant, ctx: StateGrowingContext): string {
  const cat = plant.category ?? "";
  const nativeHere = plantIsNativeToState(plant, ctx.stateCode);

  if (nativeHere && (cat === "Native Shrub" || /\bnative\b/i.test(cat))) {
    return `a ${ctx.stateName} native shrub`;
  }
  if (cat === "Native Shrub") return "a native shrub";
  if (cat === "Fruit Tree") return "a fruit tree";
  if (cat === "Citrus") return "a citrus tree";
  if (cat === "Tropical Fruit") return "a tropical fruit plant";
  if (cat === "Vegetable") return "a vegetable";
  if (cat === "Herb") return "an herb";
  if (cat === "Berry") return "a berry plant";
  if (cat === "Vine") return "a vine";
  if (cat === "Palm") return "a palm";
  if (/\bnative\b/i.test(cat)) {
    const layer = plant.canopy_layer?.toLowerCase() ?? "plant";
    return `a native ${layer}`;
  }
  const layer = plant.canopy_layer?.toLowerCase() ?? "plant";
  return `a ${layer}`;
}

function introSentence(plant: Plant, ctx: StateGrowingContext): string {
  const zones = plantZones(plant);
  const { fit, plantZoneLabel, overlapLabel } = assessPlantForState(
    zones,
    ctx.stateCode,
  );
  const kind = plantKindPhrase(plant, ctx);

  let sentence = `${plant.common_name} is ${kind}. `;

  if (fit === "good" && overlapLabel) {
    sentence += `In ${ctx.stateName}, it lines up with zones ${overlapLabel} (state range ${ctx.stateZoneSpan}; plant listed ${plantZoneLabel}).`;
  } else if (fit === "unlikely" && plantZoneLabel) {
    sentence += `Listed for ${plantZoneLabel}, which is a stretch in most of ${ctx.stateName} (${ctx.stateZoneSpan}).`;
  } else if (overlapLabel) {
    sentence += `In ${ctx.stateName}, overlapping zones are ${overlapLabel} (plant ${plantZoneLabel}; state ${ctx.stateZoneSpan}).`;
  } else if (plantZoneLabel) {
    sentence += `Listed for USDA zones ${plantZoneLabel}; ${ctx.stateName} spans ${ctx.stateZoneSpan}.`;
  } else {
    sentence += `Growing zones depend on your spot in ${ctx.stateName} (${ctx.stateZoneSpan}).`;
  }

  const originNote = sanitizeNativeOriginLabel(plant.native_origin);
  if (originNote && !plantIsNativeToState(plant, ctx.stateCode)) {
    sentence += ` ${originNote}`;
  }

  if (plant.is_kitchen_essential) {
    sentence += ` Popular in ${ctx.stateName} kitchen gardens where the climate matches.`;
  }

  return sentence;
}

function introWithoutState(plant: Plant): string {
  const zones = formatZoneRange(plantZones(plant)) ?? "various zones";
  const cat = plant.category?.toLowerCase() ?? "plant";
  let sentence = `${plant.common_name} is a ${plant.canopy_layer?.toLowerCase() ?? "plant"} (${cat}) listed for USDA zones ${zones}.`;
  const originNote = sanitizeNativeOriginLabel(plant.native_origin);
  if (originNote) {
    sentence += ` ${originNote}`;
  }
  sentence +=
    " Choose your state on the catalog to see timing and care for where you garden.";
  return sentence;
}

/** Novice-friendly growing guide tailored to the user's catalog state. */
export function buildCatalogPlantGuide(
  plant: Plant,
  ctx: StateGrowingContext | null = null,
): CatalogPlantGuide {
  if (!ctx) {
    return {
      intro: introWithoutState(plant),
      blocks: [pickStateBlock()],
      needsState: true,
    };
  }

  const blocks: GuideBlock[] = [];
  const region = growingInStateBlock(plant, ctx);
  if (region) blocks.push(region);

  blocks.push(
    whenToPlantNarrative(plant, ctx),
    {
      title: "Day-to-day care",
      items: careTipItems(plant, ctx),
    },
    {
      title: "Your first year",
      body: stateFirstYearNote(ctx, plant.category, plant.is_edible),
    },
  );

  const harvest = harvestBlock(plant, ctx);
  if (harvest) blocks.push(harvest);

  if (plant.avoid_planting_near?.length) {
    blocks.push({
      title: "Plant away from",
      body: `Give space from ${plant.avoid_planting_near.slice(0, 4).join(", ")}${plant.avoid_planting_near.length > 4 ? ", and others listed below" : ""} when possible.`,
    });
  }

  return {
    intro: introSentence(plant, ctx),
    blocks,
    stateName: ctx.stateName,
  };
}

export function guideContextForStateCode(
  stateCode: string,
): StateGrowingContext | null {
  return growingContextForState(stateCode);
}
