import type { CanopyLayer, GuildFunction, PlantCategory } from "../schema.js";
import type { CompanionReasonPlant } from "./companion-reason.js";

const LAYER_PHRASE: Record<CanopyLayer, string> = {
  Overstory: "tall canopy",
  Understory: "mid-story",
  Shrub: "shrub layer",
  Herbaceous: "herbaceous layer",
  Groundcover: "ground-hugging cover",
  Root: "root-zone crop",
  Vine: "climbing vine",
};

const CATEGORY_PHRASE: Record<PlantCategory, string> = {
  "Fruit Tree": "fruit tree",
  Citrus: "citrus",
  "Tropical Fruit": "tropical fruit",
  Berry: "berry",
  Herb: "herb",
  Vegetable: "vegetable",
  "Ground Cover": "ground cover",
  "Support Species": "support plant",
  Vine: "vine",
  Palm: "palm",
  "Native Shrub": "native shrub",
  "Edible Flower": "flowering edible",
};

function hasFn(p: CompanionReasonPlant, fn: GuildFunction): boolean {
  return p.guild_functions.includes(fn);
}

function layerGap(a: CanopyLayer, b: CanopyLayer): number {
  const order: CanopyLayer[] = [
    "Overstory",
    "Understory",
    "Shrub",
    "Herbaceous",
    "Groundcover",
    "Root",
    "Vine",
  ];
  return Math.abs(order.indexOf(a) - order.indexOf(b));
}

type PairRule = {
  match: (host: CompanionReasonPlant, comp: CompanionReasonPlant) => boolean;
  build: (host: CompanionReasonPlant, comp: CompanionReasonPlant) => string;
};

const COMPANION_RULES: PairRule[] = [
  {
    match: (h, c) => hasFn(c, "Nitrogen Fixer") && (hasFn(h, "Food Producer") || /fruit|citrus|berry/i.test(h.category)),
    build: (h, c) =>
      `${c.common_name} fixes nitrogen in the soil around your ${h.common_name}, so this ${CATEGORY_PHRASE[h.category]} gets steady nutrition without extra fertilizer. Chop ${c.common_name} back from time to time and the leaves become a slow-release mulch right at the ${LAYER_PHRASE[h.canopy_layer]} root zone.`,
  },
  {
    match: (h, c) => hasFn(c, "Dynamic Accumulator"),
    build: (h, c) =>
      `${c.common_name} mines minerals from deep soil and concentrates them in leaves you can chop-and-drop onto ${h.common_name}. That feeds a hungry ${CATEGORY_PHRASE[h.category]} in Florida sand while ${c.common_name} stays in the ${LAYER_PHRASE[c.canopy_layer]} without competing for the same root space.`,
  },
  {
    match: (h, c) => hasFn(c, "Pest Repellent") && (h.category === "Vegetable" || h.category === "Fruit Tree" || h.category === "Citrus"),
    build: (h, c) =>
      `The aromatic oils in ${c.common_name} confuse pests that bother ${h.common_name}, so your ${CATEGORY_PHRASE[h.category]} sees less chewing damage without sprays. Plant ${c.common_name} at the edge of the ${LAYER_PHRASE[h.canopy_layer]} drip line where scent drifts through the bed.`,
  },
  {
    match: (h, c) => hasFn(c, "Pollinator Attractor") && hasFn(h, "Food Producer"),
    build: (h, c) =>
      `${c.common_name} pulls bees and butterflies that also visit ${h.common_name}'s flowers, which often means better fruit set in Florida's heat. Keep ${c.common_name} in the ${LAYER_PHRASE[c.canopy_layer]} so blooms stagger across the season.`,
  },
  {
    match: (h, c) => hasFn(c, "Groundcover/Mulch") || c.canopy_layer === "Groundcover",
    build: (h, c) =>
      `${c.common_name} carpets the ground under ${h.common_name}, shading soil from Florida sun and holding moisture where feeder roots spread. That living mulch means less weeding and cooler roots for your ${CATEGORY_PHRASE[h.category]} through summer.`,
  },
  {
    match: (h, c) => hasFn(c, "Wind Break") || hasFn(h, "Wind Break"),
    build: (h, c) =>
      `${c.common_name} slows wind that can dry out and stress ${h.common_name}, especially during spring storms and hurricane season. Tuck ${c.common_name} on the prevailing-wind side of your ${LAYER_PHRASE[h.canopy_layer]} planting.`,
  },
  {
    match: (h, c) =>
      h.canopy_layer === "Overstory" &&
      (c.canopy_layer === "Herbaceous" || c.canopy_layer === "Shrub" || c.canopy_layer === "Understory"),
    build: (h, c) =>
      `${h.common_name} builds the ${LAYER_PHRASE[h.canopy_layer]} while ${c.common_name} works the ${LAYER_PHRASE[c.canopy_layer]} below — classic food-forest stacking. ${c.common_name} gets filtered light instead of brutal midday sun, and ${h.common_name} does not compete for the same low root zone.`,
  },
  {
    match: (h, c) =>
      c.canopy_layer === "Overstory" &&
      (h.canopy_layer === "Herbaceous" || h.canopy_layer === "Shrub"),
    build: (h, c) =>
      `Your ${h.common_name} fills the ${LAYER_PHRASE[h.canopy_layer]} under ${c.common_name}'s ${LAYER_PHRASE[c.canopy_layer]}, harvesting light that would otherwise be wasted. ${c.common_name} offers structure and shade while ${h.common_name} handles the understory harvest.`,
  },
  {
    match: (h, c) => c.category === "Herb" && (h.category === "Vegetable" || h.category === "Fruit Tree"),
    build: (h, c) =>
      `${c.common_name} is a compact ${CATEGORY_PHRASE[c.category]} that fits along ${h.common_name}'s bed edge without shading the crop. Harvest herbs often for kitchen use while their roots and scent support the ${LAYER_PHRASE[h.canopy_layer]} guild.`,
  },
  {
    match: (h, c) => c.category === "Support Species",
    build: (h, c) =>
      `${c.common_name} is a support species that strengthens ${h.common_name} instead of competing for the main harvest. Use it for chop-and-drop, nitrogen, or pollinators while your ${CATEGORY_PHRASE[h.category]} stays the centerpiece.`,
  },
  {
    match: (h, c) => h.category === "Vegetable" && c.category === "Vegetable",
    build: (h, c) =>
      `${h.common_name} and ${c.common_name} share the ${LAYER_PHRASE[h.canopy_layer]} but fill different harvest windows and root depths when spaced correctly. Stagger planting so one peaks while the other is getting established.`,
  },
  {
    match: (h, c) => /Solanaceae|solanum|capsicum/i.test(`${h.scientific_name} ${c.scientific_name}`),
    build: (h, c) =>
      `These nightshade-family neighbors share cultural needs — sun, fertile soil, steady moisture — so one management rhythm covers both. Keep them spaced for airflow in humid Florida summers to reduce fungal issues.`,
  },
];

function layerStackFallback(
  host: CompanionReasonPlant,
  comp: CompanionReasonPlant,
): string {
  const gap = layerGap(host.canopy_layer, comp.canopy_layer);
  if (gap >= 2) {
    return `${comp.common_name} (${LAYER_PHRASE[comp.canopy_layer]}) works below your ${host.common_name} (${LAYER_PHRASE[host.canopy_layer]}), so each plant occupies a different height in the guild. That vertical spacing is how Florida food forests produce more food per square foot without crowding roots.`;
  }
  if (gap === 1) {
    return `${comp.common_name} sits one layer ${comp.canopy_layer === "Shrub" || comp.canopy_layer === "Herbaceous" ? "under" : "beside"} your ${host.common_name}, sharing the site but splitting light and root zones. In Florida's long growing season, that pairing keeps harvests staggered instead of competitive.`;
  }
  return `${comp.common_name} and ${host.common_name} are both ${LAYER_PHRASE[comp.canopy_layer]} plants — give them enough spacing for mature spread and root zones. Pair them because they complement ${comp.guild_functions[0] ?? "growth"} with ${host.guild_functions[0] ?? "production"} in the same bed.`;
}

function guildComplementFallback(
  host: CompanionReasonPlant,
  comp: CompanionReasonPlant,
): string {
  const compPrimary = comp.guild_functions[0];
  const hostPrimary = host.guild_functions[0];
  if (compPrimary && hostPrimary && compPrimary !== hostPrimary) {
    return `${comp.common_name} brings ${compPrimary.toLowerCase()} to your ${host.common_name} (${hostPrimary.toLowerCase()}), so each plant covers a different job in the guild. That division of labor is the core idea behind planting them side by side in Florida.`;
  }
  return layerStackFallback(host, comp);
}

export function buildEducationalCompanionReason(
  host: CompanionReasonPlant,
  companion: CompanionReasonPlant,
): string {
  for (const rule of COMPANION_RULES) {
    if (rule.match(host, companion)) {
      return rule.build(host, companion);
    }
  }
  return guildComplementFallback(host, companion);
}

export function buildEducationalAvoidReason(
  host: CompanionReasonPlant,
  other: CompanionReasonPlant,
): string {
  if (
    host.canopy_layer === other.canopy_layer &&
    layerGap(host.canopy_layer, other.canopy_layer) === 0 &&
    (host.category === other.category || /fruit tree|citrus/i.test(host.category + other.category))
  ) {
    return `${host.common_name} and ${other.common_name} both want the same sun, water, and root zone as mature ${LAYER_PHRASE[host.canopy_layer]} plants. In Florida, that usually means one outgrows the other or both struggle in summer drought without heavy irrigation.`;
  }
  if (/walnut|juglans|fennel|foeniculum/i.test(other.scientific_name + other.common_name)) {
    return `${other.common_name} can release compounds that slow ${host.common_name}'s growth when roots overlap. Keep them separated by at least the mature spread listed for each plant.`;
  }
  if (/corn|zea mays/i.test(other.scientific_name + other.common_name) && host.category === "Vegetable") {
    return `${other.common_name} shades smaller crops and attracts caterpillars that also hit tomatoes and peppers. Plant corn on the north edge of the site, not mixed through a Florida vegetable guild.`;
  }
  return `${host.common_name} and ${other.common_name} compete for the same niche in a Florida garden — light, nutrients, or soil moisture. Spacing them apart reduces stress and often improves yields on both.`;
}
