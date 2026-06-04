import type { GuildFunction, Plant } from "../schema.js";
import { effectiveIsFloridaNative } from "./plant-native-status.js";
import { isWikiDump } from "./wiki-text.js";
import { sanitizeNativeOriginLabel } from "./native-origin.js";

const PLACEHOLDER_BENEFIT_RE =
  /^(learn more|see also|read more|https?:\/\/|wikipedia\.org)/i;

const GUILD_BENEFITS: Record<GuildFunction, string> = {
  "Nitrogen Fixer":
    "Fixes nitrogen in the soil — supports heavy-feeding fruit trees nearby",
  "Dynamic Accumulator":
    "Pulls minerals from deep soil; leaves make excellent chop-and-drop mulch",
  "Pollinator Attractor":
    "Attracts bees and pollinators that improve fruit set on neighbors",
  "Pest Repellent":
    "Aromatic oils help repel pests from nearby crops",
  "Wind Break": "Shelters tender understory plants from wind damage",
  "Groundcover/Mulch":
    "Living groundcover suppresses weeds and keeps soil cool and moist",
  "Food Producer": "Produces food for your kitchen and household",
  Medicinal: "Traditional medicinal uses for home remedies",
  "Wildlife Habitat":
    "Provides shelter and forage for birds, butterflies, and beneficial insects",
};

const NITROGEN_FIXER_FAMILY =
  /fabaceae|leguminosae|caesalpiniaceae|mimosaceae/i;
const NITROGEN_FIXER_NAME =
  /\b(pea|bean|clover|alfalfa|pigeon pea|moringa|cajanus|leucaena|sunn hemp|vetch|lupine)\b/i;
const ACCUMULATOR_NAME =
  /\b(comfrey|yarrow|borage|nettle|dock|chickweed)\b/i;

export function sanitizeBenefits(benefits: string[]): string[] {
  return benefits
    .map((b) => b.trim())
    .filter(
      (b) =>
        b.length > 8 &&
        b.length < 220 &&
        !isWikiDump(b) &&
        !PLACEHOLDER_BENEFIT_RE.test(b) &&
        !/^table\)?\.?$/i.test(b),
    );
}

export function hasMeaningfulBenefits(benefits: string[]): boolean {
  return sanitizeBenefits(benefits).length > 0;
}

/** Derive human-readable benefits from guild role, edibility, and taxonomy. */
export function inferBenefitsFromPlant(plant: Plant): string[] {
  const benefits: string[] = [];
  const name = `${plant.common_name} ${plant.scientific_name}`.toLowerCase();
  const family = plant.tags.find((t) => t.length > 3)?.toLowerCase() ?? "";

  for (const role of plant.guild_functions) {
    const line = GUILD_BENEFITS[role];
    if (line) benefits.push(line);
  }

  if (
    !plant.guild_functions.includes("Nitrogen Fixer") &&
    (NITROGEN_FIXER_FAMILY.test(family) || NITROGEN_FIXER_NAME.test(name))
  ) {
    benefits.push(GUILD_BENEFITS["Nitrogen Fixer"]);
  }

  if (
    !plant.guild_functions.includes("Dynamic Accumulator") &&
    ACCUMULATOR_NAME.test(name)
  ) {
    benefits.push(GUILD_BENEFITS["Dynamic Accumulator"]);
  }

  if (plant.is_edible) {
    const uses = plant.uses.join(" ").toLowerCase();
    if (/fruit|berry|nut/.test(uses) || /fruit|berry|mango|papaya|citrus|avocado|banana/i.test(name)) {
      benefits.push("Edible fruit — vitamins and minerals for fresh eating");
    } else if (/leaf|green|herb|vegetable/.test(uses) || plant.category === "Herb" || plant.category === "Vegetable") {
      benefits.push("Edible leaves or shoots — adds nutrients to meals");
    } else if (/tuber|root|rhizome|ginger|turmeric|potato/.test(uses + name)) {
      benefits.push("Edible roots or rhizomes — starchy or flavorful harvest");
    } else {
      benefits.push("Edible — harvest for the kitchen");
    }
  }

  if (plant.category === "Support Species") {
    benefits.push("Support species that strengthens the whole guild");
  }

  const originLabel = sanitizeNativeOriginLabel(plant.native_origin);
  if (originLabel) {
    benefits.push(originLabel);
  } else if (effectiveIsFloridaNative(plant)) {
    benefits.push("Native to Florida — adapted to local climate");
  }

  if (plant.water_needs === "Drought Tolerant") {
    benefits.push("Drought tolerant once established — lower irrigation needs");
  }

  if (plant.canopy_layer === "Overstory" || plant.canopy_layer === "Understory") {
    benefits.push("Canopy shade cools the understory and protects soil");
  }

  if (plant.canopy_layer === "Groundcover") {
    benefits.push("Groundcover protects soil from erosion and drying out");
  }

  if (
    plant.guild_functions.length === 1 &&
    plant.guild_functions[0] === "Wildlife Habitat" &&
    !plant.is_edible
  ) {
    benefits.push("Adds biodiversity and structure to your food forest");
  }

  return [...new Set(benefits)].slice(0, 8);
}

export function finalizePlantBenefits(plant: Plant): string[] {
  const fromApis = sanitizeBenefits(plant.benefits);
  const inferred = inferBenefitsFromPlant(plant);
  const merged = [...new Set([...fromApis, ...inferred])];
  return merged.slice(0, 10);
}
