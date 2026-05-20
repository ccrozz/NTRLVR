import type { GuildFunction, Plant } from "../../types";
import { GUILD_FUNCTION_CARDS } from "./guild-function-copy";

/** Trefle/Wikipedia distribution blurbs — not useful as the main garden summary. */
function isDistributionBlurb(text: string): boolean {
  return /\b(introduced to|native to|observed in|widespread|distribution|naturalized in)\b/i.test(
    text,
  );
}

export function plantLeadSummary(plant: Plant): string {
  const care = plant.care_summary?.trim();
  if (care && care.length >= 12 && !isDistributionBlurb(care)) {
    return care;
  }

  if (plant.benefits?.length) {
    return plant.benefits.slice(0, 2).join(" ");
  }

  const fns = (plant.guild_functions ?? []) as GuildFunction[];
  if (fns.length > 0) {
    const parts = fns
      .slice(0, 2)
      .map((fn) => GUILD_FUNCTION_CARDS[fn]?.description)
      .filter(Boolean);
    if (parts.length) return parts.join(" ");
  }

  return `${plant.common_name} is a ${plant.canopy_layer.toLowerCase()} ${plant.category.toLowerCase()} for your Florida food forest.`;
}

export function plantRoleTags(plant: Plant): string[] {
  const fns = (plant.guild_functions ?? []) as GuildFunction[];
  return fns
    .slice(0, 4)
    .map((fn) => GUILD_FUNCTION_CARDS[fn]?.label ?? fn)
    .filter(Boolean);
}

export function hasExtraDetail(plant: Plant): boolean {
  return (
    (plant.uses?.length ?? 0) > 0 ||
    (plant.benefits?.length ?? 0) > 2 ||
    (plant.guild_functions?.length ?? 0) > 0 ||
    (plant.avoid_planting_near?.length ?? 0) > 0
  );
}

export function plantGrowingFacts(plant: Plant): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [];
  const zones =
    (plant.florida_hardiness_zones?.length ?? 0) > 0
      ? plant.florida_hardiness_zones
      : plant.growing_zones;
  if (zones?.length) {
    facts.push({ label: "Hardiness", value: zones.join(", ") });
  }
  const [hMin, hMax] = plant.mature_height_feet ?? [];
  if (hMin != null && hMax != null) {
    facts.push({ label: "Height", value: `${hMin}–${hMax} ft` });
  }
  const [sMin, sMax] = plant.mature_spread_feet ?? [];
  if (sMin != null && sMax != null) {
    facts.push({ label: "Spread", value: `${sMin}–${sMax} ft` });
  }
  if (plant.sunlight?.trim()) {
    facts.push({ label: "Sun", value: plant.sunlight.trim() });
  }
  if (plant.water_needs?.trim()) {
    facts.push({ label: "Water", value: plant.water_needs.trim() });
  }
  if (plant.growth_rate?.trim()) {
    facts.push({ label: "Growth", value: plant.growth_rate.trim() });
  }
  if (plant.best_planting_seasons?.length) {
    facts.push({
      label: "Plant in",
      value: plant.best_planting_seasons.join(", "),
    });
  }
  if (plant.soil_preferences?.length) {
    facts.push({ label: "Soil", value: plant.soil_preferences.join(", ") });
  }
  if (plant.edible_part?.trim()) {
    facts.push({ label: "Harvest", value: plant.edible_part.trim() });
  }
  return facts;
}

export function isPlantDetailSparse(plant: Plant): boolean {
  const lead = plantLeadSummary(plant);
  const generic = lead.startsWith(`${plant.common_name} is a`);
  return (
    generic &&
    !(plant.companion_plants?.length) &&
    !(plant.benefits?.length) &&
    !(plant.uses?.length)
  );
}

/** Match companion string (e.g. "Mango") to catalog row (e.g. "Nam Doc Mai Mango"). */
export function resolveCompanionPlant(
  entry: string,
  catalog: { id: string; common_name: string }[],
): { id: string; common_name: string } | null {
  const key = entry.trim().toLowerCase();
  if (!key) return null;

  const exact = catalog.find((p) => p.common_name.trim().toLowerCase() === key);
  if (exact) return exact;

  const scored = catalog
    .map((p) => ({
      p,
      score: scoreCompanionName(p.common_name, key),
    }))
    .filter((x) => x.score >= 65)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.p ?? null;
}

function scoreCompanionName(plantName: string, query: string): number {
  const cn = plantName.trim().toLowerCase();
  const q = query.trim().toLowerCase();
  if (cn === q) return 100;
  if (cn.endsWith(` ${q}`)) return 85;
  if (cn.split(/\s+/).includes(q)) return 75;
  if (cn.includes(q)) return 65;
  return 0;
}
