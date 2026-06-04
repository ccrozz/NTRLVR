import type {
  CanopyLayer,
  GrowthRate,
  GuildFunction,
  Plant,
  PlantCategory,
  PlantingSeason,
  SoilType,
  SunlightNeeds,
  WaterNeeds,
} from "../schema.js";
import {
  finalizePlantBenefits,
  inferBenefitsFromPlant,
} from "../lib/infer-plant-benefits.js";
import { applyEdibleFlag, inferIsEdibleFromPlant } from "../lib/infer-is-edible.js";
import { enrichPlantNativeOrigin } from "../lib/native-origin.js";
import {
  zonesFromTrefleGrowth,
} from "../lib/infer-hardiness-zones.js";
import {
  growsInUsFromObservations,
  growsInUsFromTrefleDetail,
} from "../lib/us-distribution.js";
import {
  buildCareSummaryFromTrefle,
  inferBenefitsFromTrefle,
} from "../lib/trefle-fields.js";
import type {
  TrefleListPlant,
  TreflePlantDetail,
  TrefleSpecies,
} from "./types.js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function plantIdFromTrefle(slug: string): string {
  return `trefle-${slug}`;
}

function displayName(item: {
  common_name: string | null;
  scientific_name?: string | null;
}): string {
  const sci = item.scientific_name?.trim() ?? "";
  return (
    item.common_name?.trim() ||
    (sci ? sci.split(" ")[0] : "") ||
    sci ||
    "Unknown plant"
  );
}

function cmToFeet(cm: number | null | undefined): number | null {
  if (cm == null || Number.isNaN(cm)) return null;
  return Math.round((cm / 30.48) * 10) / 10;
}

function heightFromSpecies(sp: TrefleSpecies | null): [number, number] {
  const maxCm = sp?.specifications?.maximum_height?.cm;
  const avgCm = sp?.specifications?.average_height?.cm;
  const maxFt = cmToFeet(maxCm ?? undefined);
  const avgFt = cmToFeet(avgCm ?? undefined);
  if (maxFt && avgFt) return [Math.min(avgFt, maxFt), maxFt];
  if (maxFt) return [Math.max(1, maxFt * 0.6), maxFt];
  if (avgFt) return [Math.max(1, avgFt * 0.8), avgFt * 1.2];
  return [4, 10];
}

function spreadFromSpecies(
  sp: TrefleSpecies | null,
  height: [number, number],
): [number, number] {
  const spreadCm = sp?.growth?.spread?.cm;
  const ft = cmToFeet(spreadCm ?? undefined);
  if (ft) return [Math.max(1, ft * 0.7), ft];
  return [height[0] * 0.5, height[1] * 0.6];
}

function inferCanopy(height: [number, number], habit?: string | null): CanopyLayer {
  const h = (height[0] + height[1]) / 2;
  const hab = (habit ?? "").toLowerCase();
  if (hab.includes("vine") || hab.includes("climber")) return "Vine";
  if (hab.includes("herb")) return "Herbaceous";
  if (hab.includes("shrub")) return "Shrub";
  if (hab.includes("ground")) return "Groundcover";
  if (h >= 20) return "Overstory";
  if (h >= 10) return "Understory";
  if (h >= 3) return "Shrub";
  if (h >= 1) return "Herbaceous";
  return "Groundcover";
}

function inferCategory(
  item: TrefleListPlant | TrefleSpecies,
  sp?: TrefleSpecies | null,
): PlantCategory {
  const family = (item.family ?? sp?.family ?? "").toLowerCase();
  const name = displayName(item).toLowerCase();
  const habit = (sp?.specifications?.growth_habit ?? "").toLowerCase();
  const ediblePart = (sp?.edible_part ?? "").toLowerCase();

  const foodPalm =
    /coconut|cocos|date palm|phoenix dactylifera|sabal|serenoa|cabbage palm|peach palm|açaí|acai|pupunha|talipot|areca catechu/i;
  if (
    (family.includes("arecaceae") || name.includes("palm")) &&
    (sp?.edible || foodPalm.test(name))
  ) {
    return "Palm";
  }
  if (family.includes("arecaceae")) {
    return habit.includes("shrub") ? "Native Shrub" : "Herb";
  }
  if (name.includes("citrus") || family.includes("rutaceae")) return "Citrus";
  if (habit.includes("vine") || name.includes("vine")) return "Vine";
  if (sp?.edible && (habit.includes("tree") || ediblePart.includes("fruit"))) {
    return habit.includes("tree") ? "Fruit Tree" : "Tropical Fruit";
  }
  if (sp?.vegetable || ediblePart.includes("leaves") || ediblePart.includes("roots")) {
    return "Vegetable";
  }
  if (family.includes("lamiaceae") || name.includes("herb")) return "Herb";
  if (habit.includes("shrub")) return "Native Shrub";
  if (habit.includes("ground")) return "Ground Cover";
  return "Herb";
}

function mapGrowthRate(value?: string | null): GrowthRate {
  if (!value) return "Moderate";
  const v = value.toLowerCase();
  if (v.includes("slow")) return "Slow";
  if (v.includes("fast") || v.includes("rapid")) return "Fast";
  return "Moderate";
}

function mapSunlight(light?: number | null): SunlightNeeds {
  if (light == null) return "Adaptable";
  if (light <= 3) return "Partial Shade";
  if (light >= 8) return "Full Sun";
  if (light >= 5) return "Full Sun";
  return "Partial Shade";
}

function mapWater(sp: TrefleSpecies | null): WaterNeeds {
  const humidity = sp?.growth?.soil_humidity;
  if (humidity != null && humidity >= 7) return "High";
  if (humidity != null && humidity <= 3) return "Low";
  return "Moderate";
}

function mapSoil(sp: TrefleSpecies | null): SoilType[] {
  const texture = sp?.growth?.soil_texture;
  if (texture == null) return ["Any"];
  if (texture <= 3) return ["Sandy", "Well-Drained"];
  if (texture >= 7) return ["Clay", "Moist"];
  return ["Loamy"];
}

function mapSeasons(sp: TrefleSpecies | null): PlantingSeason[] {
  if (sp?.growth?.growth_months?.length) {
    return ["Year-Round"];
  }
  return ["Spring", "Summer"];
}

function inferGuild(sp: TrefleSpecies | null, edible: boolean): GuildFunction[] {
  const fns: GuildFunction[] = [];
  if (edible) fns.push("Food Producer");
  const fixation = sp?.specifications?.nitrogen_fixation;
  if (fixation && !/none|null/i.test(fixation)) fns.push("Nitrogen Fixer");
  if (!fns.length) fns.push("Wildlife Habitat");
  return fns;
}

function inferUses(sp: TrefleSpecies | null, edible: boolean): string[] {
  const uses: string[] = [];
  if (sp?.edible_part) uses.push(`Edible ${sp.edible_part}`);
  else if (edible) uses.push("Edible");
  if (sp?.vegetable) uses.push("Vegetable crop");
  if (!uses.length) uses.push("Ornamental");
  return uses;
}

function inferTags(
  item: TrefleListPlant,
  sp: TrefleSpecies | null,
): string[] {
  const tags = new Set<string>(["trefle"]);
  if (item.family) tags.add(item.family.toLowerCase());
  if (item.genus) tags.add(item.genus.toLowerCase());
  if (sp?.edible) tags.add("edible");
  if (sp?.vegetable) tags.add("vegetable");
  if (item.vegetable) tags.add("vegetable");
  return [...tags];
}

function inferEdible(
  item: TrefleListPlant,
  sp: TrefleSpecies | null,
  options?: { catalogFilteredEdible?: boolean },
): boolean {
  if (options?.catalogFilteredEdible) return true;
  if (sp?.edible || sp?.vegetable || item.vegetable) return true;
  if (sp?.edible_part) return true;
  return inferIsEdibleFromPlant({
    common_name: displayName(item),
    scientific_name: item.scientific_name,
    uses: [],
    tags: inferTags(item, sp),
  });
}

function floridaNativeFromDistribution(sp: TrefleSpecies | null): boolean {
  const regions = (sp?.distribution?.native ?? []).map((r) => r.toLowerCase());
  return regions.some(
    (r) => r === "florida" || r.includes("florida"),
  );
}

function bestImage(
  item: { image_url?: string | null },
  sp?: TrefleSpecies | null,
): string | null {
  const direct = item.image_url ?? sp?.image_url;
  if (direct) return direct;
  const images = sp?.images;
  if (!images) return null;
  for (const key of ["habit", "fruit", "flower", "leaf", "bark"]) {
    const arr = images[key];
    if (arr?.[0]?.image_url) return arr[0].image_url;
  }
  const other = images.other ?? images[""];
  if (other?.[0]?.image_url) return other[0].image_url;
  return null;
}

export function mapListToPlant(
  item: TrefleListPlant,
  options?: { catalogFilteredEdible?: boolean },
): Plant {
  const height: [number, number] = [4, 10];
  const spread: [number, number] = [2, 6];
  const edible = inferEdible(item, null, options);

  const plant: Plant = {
    id: plantIdFromTrefle(item.slug),
    common_name: displayName(item),
    scientific_name: item.scientific_name,
    image_url: bestImage(item),
    trefle_id: item.id,
    trefle_slug: item.slug,
    family: item.family ?? null,
    genus: item.genus ?? null,
    edible_part: null,
    vegetable: Boolean(item.vegetable),
    observations: item.observations ?? null,
    synonyms: item.synonyms ?? [],
    category: inferCategory(item),
    canopy_layer: "Shrub",
    guild_functions: inferGuild(null, edible),
    is_florida_native: false,
    native_states: [],
    native_origin: null,
    grows_in_us: growsInUsFromObservations(item.observations ?? null),
    is_kitchen_essential: false,
    is_edible: edible,
    florida_hardiness_zones: [],
    is_invasive_in_florida: false,
    mature_height_feet: height,
    mature_spread_feet: spread,
    canvas_radius_feet: (spread[0] + spread[1]) / 4,
    sunlight: "Adaptable",
    water_needs: "Moderate",
    soil_preferences: ["Any"],
    best_planting_seasons: ["Year-Round"],
    growth_rate: "Moderate",
    care_summary: item.observations?.trim() ?? "",
    uses: options?.catalogFilteredEdible ? ["Edible"] : ["Ornamental"],
    benefits: [],
    companion_plants: [],
    avoid_planting_near: [],
    tags: inferTags(item, null),
    data_source: "trefle",
    last_updated: today(),
    trefle_json: null,
  };

  plant.benefits = inferBenefitsFromPlant(plant);
  return applyEdibleFlag(plant);
}

export function mapDetailToPlant(
  detail: TreflePlantDetail,
  options?: { storeJson?: boolean; catalogFilteredEdible?: boolean },
): Plant {
  const sp = detail.main_species ?? null;
  const height = heightFromSpecies(sp);
  const spread = spreadFromSpecies(sp, height);
  const edible = inferEdible(detail, sp, options);
  const hardinessZones = zonesFromTrefleGrowth(sp?.growth);

  const care =
    buildCareSummaryFromTrefle(detail) ||
    detail.observations?.trim() ||
  sp?.observations?.trim() ||
    "";

  const plant: Plant = {
    id: plantIdFromTrefle(detail.slug),
    common_name: displayName(detail),
    scientific_name:
      detail.scientific_name?.trim() ||
      sp?.scientific_name?.trim() ||
      (detail.slug ?? String(detail.id ?? "unknown")).replace(/-/g, " "),
    image_url: bestImage(detail, sp),
    trefle_id: detail.id,
    trefle_slug: detail.slug,
    family: detail.family ?? sp?.family ?? null,
    genus: detail.genus ?? sp?.genus ?? null,
    edible_part: sp?.edible_part ?? null,
    vegetable: Boolean(detail.vegetable ?? sp?.vegetable),
    observations: detail.observations ?? sp?.observations ?? null,
    synonyms: sp?.synonyms ?? [],
    category: inferCategory(detail, sp),
    canopy_layer: inferCanopy(height, sp?.specifications?.growth_habit),
    guild_functions: inferGuild(sp, edible),
    is_florida_native: floridaNativeFromDistribution(sp),
    native_states: [],
    native_origin: null,
    grows_in_us: growsInUsFromTrefleDetail(detail),
    is_kitchen_essential: Boolean(
      edible &&
        /basil|rosemary|thyme|mint|oregano|sage|parsley|cilantro|garlic|onion/i.test(
          displayName(detail),
        ),
    ),
    is_edible: edible,
    florida_hardiness_zones: hardinessZones,
    is_invasive_in_florida: false,
    mature_height_feet: height,
    mature_spread_feet: spread,
    canvas_radius_feet: (spread[0] + spread[1]) / 4,
    sunlight: mapSunlight(sp?.growth?.light),
    water_needs: mapWater(sp),
    soil_preferences: mapSoil(sp),
    best_planting_seasons: mapSeasons(sp),
    growth_rate: mapGrowthRate(sp?.specifications?.growth_rate),
    care_summary: care,
    uses: inferUses(sp, edible),
    benefits: inferBenefitsFromTrefle(detail),
    companion_plants: [],
    avoid_planting_near: [],
    tags: inferTags(detail, sp),
    data_source: "trefle",
    last_updated: today(),
    trefle_json: options?.storeJson !== false ? JSON.stringify(detail) : null,
  };

  plant.benefits = finalizePlantBenefits(plant);
  return enrichPlantNativeOrigin(applyEdibleFlag(plant), {
    trefleDetail: detail,
  });
}
