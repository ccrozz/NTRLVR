import type { GuildFunction, Plant } from "../schema.js";
import { effectiveIsFloridaNative } from "./plant-native-status.js";
import { isWikiDump } from "./wiki-text.js";
import { sanitizeNativeOriginLabel } from "./native-origin.js";

const PLACEHOLDER_BENEFIT_RE =
  /^(learn more|see also|read more|https?:\/\/|wikipedia\.org)/i;

const NITROGEN_FIXER_FAMILY =
  /fabaceae|leguminosae|caesalpiniaceae|mimosaceae/i;
const NITROGEN_FIXER_NAME =
  /\b(pea|bean|clover|alfalfa|pigeon pea|moringa|cajanus|leucaena|sunn hemp|vetch|lupine)\b/i;
const ACCUMULATOR_NAME =
  /\b(comfrey|yarrow|borage|nettle|dock|chickweed)\b/i;

/** Pre-rewrite guild boilerplate that made every edible fruit page look identical. */
const GENERIC_GUILD_BOILERPLATE = new Set(
  [
    "Produces food for your kitchen and household",
    "Pulls minerals from deep soil; leaves make excellent chop-and-drop mulch",
    "Attracts bees and pollinators that improve fruit set on neighbors",
    "Aromatic oils help repel pests from nearby crops",
    "Shelters tender understory plants from wind damage",
    "Living groundcover suppresses weeds and keeps soil cool and moist",
    "Traditional medicinal uses for home remedies",
    "Provides shelter and forage for birds, butterflies, and beneficial insects",
    "Fixes nitrogen in the soil — supports heavy-feeding fruit trees nearby",
    "Edible fruit — vitamins and minerals for fresh eating",
    "Edible leaves or shoots — adds nutrients to meals",
    "Edible roots or rhizomes — starchy or flavorful harvest",
    "Edible — harvest for the kitchen",
    "Support species that strengthens the whole guild",
    "Canopy shade cools the understory and protects soil",
    "Groundcover protects soil from erosion and drying out",
    "Adds biodiversity and structure to your food forest",
    "High-value calories and flavor for the household",
    "Creates a layered canopy in the food forest",
    "Attracts birds and pollinators when flowering",
    "Long-term harvest for decades once established",
    "Canopy shade protects understory crops",
    "Deep roots stabilize soil and draw moisture",
  ].map((s) => s.toLowerCase()),
);

export function sanitizeBenefits(benefits: string[]): string[] {
  return benefits
    .map((b) => b.trim())
    .filter(
      (b) =>
        b.length > 8 &&
        b.length < 220 &&
        !isWikiDump(b) &&
        !PLACEHOLDER_BENEFIT_RE.test(b) &&
        !/^table\)?\.?$/i.test(b) &&
        !GENERIC_GUILD_BOILERPLATE.has(b.toLowerCase()),
    );
}

export function hasMeaningfulBenefits(benefits: string[]): boolean {
  return sanitizeBenefits(benefits).length > 0;
}

function displayName(plant: Plant): string {
  // Prefer the short common name without cultivar parentheticals for benefit copy.
  const raw = plant.common_name.trim();
  const withoutParen = raw.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  return withoutParen || raw;
}

function feetSpan(range?: [number, number]): string | null {
  if (!range) return null;
  const [lo, hi] = range;
  if (!lo && !hi) return null;
  const a = Math.round(lo);
  const b = Math.round(hi);
  return a === b ? `${a} ft` : `${a}–${b} ft`;
}

function looksFruitish(plant: Plant): boolean {
  const blob = `${plant.common_name} ${plant.scientific_name} ${plant.uses.join(" ")} ${plant.edible_part ?? ""}`.toLowerCase();
  return (
    plant.category === "Fruit Tree" ||
    plant.category === "Tropical Fruit" ||
    plant.category === "Citrus" ||
    plant.category === "Berry" ||
    /fruit|berry|nut|mango|papaya|citrus|avocado|banana|sapote|guava|cherry|apple|plum|peach|pear|fig|persimmon|pomegranate|olive|date/.test(
      blob,
    )
  );
}

function harvestBenefit(plant: Plant): string {
  const name = displayName(plant);
  const part = (plant.edible_part ?? "").toLowerCase().trim();
  const uses = plant.uses.join(" ").toLowerCase();
  const blob = `${name} ${part} ${uses}`.toLowerCase();

  if (/nut|seed|kernel|macadamia|pecan|cashew|almond/.test(blob)) {
    return `${name} yields edible nuts or seeds — a calorie-dense harvest once the tree is mature`;
  }
  if (/leaf|leaves|greens|herb|culinary|seasoning|tea/.test(blob) && !looksFruitish(plant)) {
    return `${name} leaves or shoots are kitchen staples — snip often to keep growth tender`;
  }
  if (/root|tuber|rhizome|ginger|turmeric|potato|cassava|taro/.test(blob)) {
    return `${name} produces edible roots or rhizomes — starchy or aromatic harvest from the soil`;
  }
  if (/flower|petal|bloom/.test(blob) && plant.category === "Edible Flower") {
    return `${name} offers edible blooms for salads, teas, and garnishes`;
  }
  if (plant.category === "Citrus" || /citrus|lemon|lime|orange|grapefruit|kumquat|mandarin/.test(blob)) {
    return `${name} bears vitamin-rich citrus — juice, zest, and fresh fruit through the cool season`;
  }
  if (plant.category === "Berry" || /berry|berries/.test(blob)) {
    return `${name} fruits pack antioxidants on a small footprint — pick fresh for snacks and preserves`;
  }
  if (looksFruitish(plant)) {
    if (plant.category === "Tropical Fruit") {
      return `${name} fruit is a tropical kitchen harvest — eat fresh when ripe for peak flavor`;
    }
    return `${name} fruit is grown for fresh eating — a long-term harvest once the tree is established`;
  }
  if (plant.category === "Vegetable" || plant.vegetable) {
    return `${name} is a productive vegetable for Florida beds — multiple plantings fill the herbaceous layer`;
  }
  if (part) {
    return `${name} is edible (${part}) — harvest for the kitchen when the plant is ready`;
  }
  return `${name} is an edible plant for the household kitchen`;
}

function guildBenefitLine(role: GuildFunction, plant: Plant): string | null {
  const name = displayName(plant);
  switch (role) {
    case "Food Producer":
      return harvestBenefit(plant);
    case "Nitrogen Fixer":
      return `${name} fixes nitrogen in the soil — supports heavy-feeding fruit trees nearby`;
    case "Dynamic Accumulator":
      return `${name} pulls minerals from deep soil; leaves make excellent chop-and-drop mulch`;
    case "Pollinator Attractor":
      return `${name} flowers draw bees and pollinators that improve fruit set on neighbors`;
    case "Pest Repellent":
      return `${name} aromatic oils help confuse or repel pests around nearby crops`;
    case "Wind Break":
      return `${name} shelters tender understory plants from wind damage`;
    case "Groundcover/Mulch":
      return `${name} spreads as living groundcover — suppresses weeds and keeps soil cool`;
    case "Medicinal":
      return `${name} has traditional medicinal uses for home remedies`;
    case "Wildlife Habitat":
      return `${name} feeds and shelters birds, butterflies, and beneficial insects`;
    default:
      return null;
  }
}

function sizeBenefit(plant: Plant): string | null {
  const height = feetSpan(plant.mature_height_feet);
  const spread = feetSpan(plant.mature_spread_feet);
  if (!height) return null;
  const name = displayName(plant);
  const layer = plant.canopy_layer.toLowerCase();
  if (spread) {
    return `${name} typically reaches ${height} tall with a ${spread} spread as a ${layer} plant`;
  }
  return `${name} typically reaches ${height} tall in the ${layer} layer`;
}

function canopyBenefit(plant: Plant): string | null {
  const name = displayName(plant);
  switch (plant.canopy_layer) {
    case "Overstory":
      return `${name} canopy cools the understory and protects soil as the tree matures`;
    case "Understory":
      return `${name} fits under taller fruit trees — fills the mid-canopy food-forest layer`;
    case "Shrub":
      return `${name} adds a productive shrub layer between trees and groundcovers`;
    case "Groundcover":
      return `${name} protects soil from erosion and drying out as living mulch`;
    case "Herbaceous":
      return `${name} fills the herbaceous layer with fast turnover between woody plants`;
    case "Vine":
      return `${name} climbs for vertical harvest without claiming bed footprint`;
    case "Root":
      return `${name} works below ground — harvest roots while the top growth feeds soil life`;
    default:
      return null;
  }
}

function growthBenefit(plant: Plant): string | null {
  const name = displayName(plant);
  if (plant.growth_rate === "Fast") {
    return `${name} grows quickly — useful when you want canopy or harvest sooner`;
  }
  if (plant.growth_rate === "Slow") {
    return `${name} is a slower grower — plant early and give it permanent space`;
  }
  return null;
}

function waterSunBenefit(plant: Plant): string | null {
  const name = displayName(plant);
  if (plant.water_needs === "Drought Tolerant") {
    return `${name} is drought tolerant once established — lower irrigation needs`;
  }
  if (plant.sunlight === "Full Shade" || plant.sunlight === "Partial Shade") {
    return `${name} tolerates ${plant.sunlight.toLowerCase()} — useful under existing canopy`;
  }
  return null;
}

function specificUseBenefits(plant: Plant): string[] {
  const name = displayName(plant);
  const out: string[] = [];
  const seen = new Set<string>();

  for (const use of plant.uses ?? []) {
    const u = use.trim();
    if (u.length < 4 || u.length > 48) continue;
    // Skip ultra-generic category uses that every tropical fruit shares
    if (
      /^(fresh (tropical )?fruit|fresh eating|kitchen (use|staples)|shade|wildlife food)$/i.test(
        u,
      )
    ) {
      continue;
    }
    const line = `${name} is used for ${u.toLowerCase()}`;
    if (seen.has(line.toLowerCase())) continue;
    seen.add(line.toLowerCase());
    out.push(line);
    if (out.length >= 2) break;
  }
  return out;
}

/** True when two benefit lines are basically the same idea. */
function isNearDuplicate(candidate: string, existing: string[]): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const topicKey = (s: string): string | null => {
    const t = norm(s);
    if (/nitrogen/.test(t)) return "nitrogen";
    if (/pollinat|bee/.test(t)) return "pollinator";
    if (/wildlife|bird|butterfly|habitat/.test(t)) return "wildlife";
    if (/drought/.test(t)) return "drought";
    if (/typically reaches|mature.*tall|ft tall/.test(t)) return "size";
    if (/chop.?and.?drop|dynamic accumulator|minerals from deep/.test(t))
      return "accumulator";
    if (/custard|flesh|pulp|fruit is|edible fruit|eat fresh|harvest/.test(t))
      return "harvest";
    if (/canopy|shade|understory/.test(t) && /cool|protect|cast|deep/.test(t))
      return "canopy";
    return null;
  };

  const c = norm(candidate);
  const cTopic = topicKey(candidate);
  const cTokens = new Set(c.split(" ").filter((t) => t.length > 3));
  for (const line of existing) {
    const e = norm(line);
    if (e === c) return true;
    if (e.includes(c) || c.includes(e)) return true;
    if (cTopic && cTopic === topicKey(line)) return true;
    const eTokens = e.split(" ").filter((t) => t.length > 3);
    if (!eTokens.length || !cTokens.size) continue;
    const overlap = eTokens.filter((t) => cTokens.has(t)).length;
    if (overlap / Math.min(eTokens.length, cTokens.size) >= 0.65) return true;
  }
  return false;
}

/**
 * Derive plant-specific benefits from guild role, edibility, size, and taxonomy.
 * Lines name the plant so every species page does not read identically.
 */
export function inferBenefitsFromPlant(plant: Plant): string[] {
  const benefits: string[] = [];
  const push = (line: string | null | undefined) => {
    if (!line) return;
    if (isNearDuplicate(line, benefits)) return;
    benefits.push(line);
  };

  const name = displayName(plant);
  const nameBlob =
    `${plant.common_name} ${plant.scientific_name}`.toLowerCase();
  const familyHint =
    plant.tags.find((t) => t.length > 3)?.toLowerCase() ?? "";

  // When curated/API benefits already describe the plant, only fill complementary facts.
  const existing = sanitizeBenefits(plant.benefits);
  const hasCuratedHarvest = existing.some((b) =>
    /fruit|flesh|pulp|harvest|edible|vitamin|eat|juice|berry|nut|leaf|rhizome|pod/i.test(
      b,
    ),
  );
  const curatedHeavy = existing.length >= 3;

  const guilds = [...plant.guild_functions];
  if (
    !guilds.includes("Nitrogen Fixer") &&
    (NITROGEN_FIXER_FAMILY.test(familyHint) ||
      NITROGEN_FIXER_NAME.test(nameBlob))
  ) {
    guilds.push("Nitrogen Fixer");
  }
  if (
    !guilds.includes("Dynamic Accumulator") &&
    ACCUMULATOR_NAME.test(nameBlob)
  ) {
    guilds.push("Dynamic Accumulator");
  }

  if (!curatedHeavy) {
    if (
      (plant.is_edible || guilds.includes("Food Producer")) &&
      !hasCuratedHarvest
    ) {
      push(harvestBenefit(plant));
    }

    for (const role of guilds) {
      if (role === "Food Producer") continue;
      // Skip generic wildlife/pollinator fillers when curated text already covers ecology
      if (
        hasCuratedHarvest &&
        (role === "Wildlife Habitat" || role === "Pollinator Attractor")
      ) {
        continue;
      }
      push(guildBenefitLine(role, plant));
    }

    for (const useLine of specificUseBenefits(plant)) {
      push(useLine);
    }
  } else {
    // Still surface distinctive guild roles that curated text may omit
    for (const role of guilds) {
      if (
        role === "Nitrogen Fixer" ||
        role === "Dynamic Accumulator" ||
        role === "Pest Repellent"
      ) {
        push(guildBenefitLine(role, plant));
      }
    }
  }

  push(sizeBenefit(plant));
  if (!curatedHeavy) {
    push(canopyBenefit(plant));
  }
  push(growthBenefit(plant));
  push(waterSunBenefit(plant));

  const originLabel = sanitizeNativeOriginLabel(plant.native_origin);
  if (originLabel) {
    push(originLabel);
  } else if (effectiveIsFloridaNative(plant)) {
    push(`${name} is native to Florida — adapted to local climate`);
  }

  if (plant.category === "Support Species") {
    push(`${name} is a support species that strengthens the whole guild`);
  }

  if (
    plant.guild_functions.length === 1 &&
    plant.guild_functions[0] === "Wildlife Habitat" &&
    !plant.is_edible
  ) {
    push(`${name} adds biodiversity and structure to your food forest`);
  }

  return benefits.slice(0, 8);
}

/**
 * Merge stored/curated benefits with inferred ones.
 * Curated and API lines win; inference only fills gaps with non-duplicate copy.
 */
export function finalizePlantBenefits(plant: Plant): string[] {
  const fromPlant = sanitizeBenefits(plant.benefits);
  const inferred = inferBenefitsFromPlant(plant);
  const merged = [...fromPlant];
  for (const line of inferred) {
    if (merged.length >= 8) break;
    if (isNearDuplicate(line, merged)) continue;
    merged.push(line);
  }
  return merged.slice(0, 8);
}
