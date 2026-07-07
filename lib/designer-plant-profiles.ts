/**
 * Designer panel profiles for every curated food-forest plant.
 * Fills care_summary, uses, benefits, companions, avoid lists, and guild roles
 * when seed rows or DB rows are thin (common for VH021 cultivars and new catalog entries).
 */
import type {
  CanopyLayer,
  GuildFunction,
  Plant,
  PlantCategory,
} from "../schema.js";
import {
  connecticutCareFallback,
  connecticutProfilePatches,
  isConnecticutCatalogPlant,
} from "./connecticut-designer-profiles.js";
import {
  isTennesseeCatalogPlant,
  tennesseeCareFallback,
  tennesseeProfilePatches,
} from "./tennessee-designer-profiles.js";
import { reconcileCompanionLists, isGenericCompanionGuild } from "./companion-lists.js";
import { treeCompanionPlants } from "./tree-companion-profiles.js";
import { curatedPatchForPlant } from "./curated-plant-knowledge.js";
import { finalizePlantBenefits } from "./infer-plant-benefits.js";
import { enrichPlantNativeOrigin } from "./native-origin.js";
import { isWikiDump } from "./wiki-text.js";

export type ProfilePatch = {
  care_summary?: string;
  uses?: string[];
  benefits?: string[];
  companion_plants?: string[];
  avoid_planting_near?: string[];
  guild_functions?: GuildFunction[];
};

const VH021_RE = /^UF\/IFAS Florida Vegetable Gardening Guide/i;

function isDistributionBlurb(text: string): boolean {
  return /\b(introduced to|native to|observed in|widespread|distribution|naturalized in|endemic to)\b/i.test(
    text,
  );
}

function normalizeScientific(name: string): string {
  return name
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

function genusKey(scientificName: string): string {
  const parts = normalizeScientific(scientificName).split(" ").filter(Boolean);
  for (const part of parts) {
    const g = part.replace(/[^a-z]/g, "");
    if (g && g !== "x" && g.length > 2) return g;
  }
  return "";
}

function resolveGenusKey(plant: Plant): string {
  const fromSci = genusKey(plant.scientific_name);
  if (fromSci) return fromSci;
  if (plant.genus?.trim()) return genusKey(plant.genus);
  return "";
}

function mergeLists(a: string[] | undefined, b: string[] | undefined): string[] {
  return [...new Set([...(a ?? []), ...(b ?? [])])].filter(Boolean).slice(0, 8);
}

/** Use the most specific companion/avoid list — do not merge category defaults into every tree. */
function pickStringList(...sources: (string[] | undefined)[]): string[] {
  for (const src of sources) {
    const list = (src ?? []).map((s) => s.trim()).filter(Boolean);
    if (list.length > 0) return list.slice(0, 8);
  }
  return [];
}

function mergeGuild(
  a: GuildFunction[] | undefined,
  b: GuildFunction[] | undefined,
): GuildFunction[] {
  return [...new Set([...(a ?? []), ...(b ?? [])])] as GuildFunction[];
}

const CATEGORY_PROFILES: Record<PlantCategory, ProfilePatch> = {
  "Fruit Tree": {
    care_summary:
      "Plant in full sun with well-drained soil. Mulch the root zone, water deeply during establishment, and prune for airflow in humid Florida summers.",
    uses: ["Fresh fruit", "Shade", "Wildlife food"],
    benefits: [
      "Long-term harvest for decades once established",
      "Canopy shade protects understory crops",
      "Deep roots stabilize soil and draw moisture",
    ],
    avoid_planting_near: ["Walnut", "Dense turf grass"],
    guild_functions: ["Food Producer", "Pollinator Attractor", "Wind Break"],
  },
  Citrus: {
    care_summary:
      "Full sun and excellent drainage are essential. Fertilize lightly through the warm season and protect young trees from cold snaps in north Florida.",
    uses: ["Fresh citrus", "Juice", "Zest", "Aromatic leaves"],
    benefits: [
      "Vitamin-rich fruit through the cool season",
      "Evergreen canopy for year-round structure",
      "Flowers feed pollinators in spring",
    ],
    avoid_planting_near: ["Fennel", "Basil (same bed competition)"],
    guild_functions: ["Food Producer", "Pollinator Attractor", "Pest Repellent"],
  },
  "Tropical Fruit": {
    care_summary:
      "Needs frost-free microclimate in Florida. Mulch heavily, water during dry spells, and give space for mature canopy spread.",
    uses: ["Fresh tropical fruit", "Shade", "Kitchen staples"],
    benefits: [
      "High-value calories and flavor for the household",
      "Creates a layered canopy in the food forest",
      "Attracts birds and pollinators when flowering",
    ],
    avoid_planting_near: ["Black walnut"],
    guild_functions: ["Food Producer", "Pollinator Attractor", "Wildlife Habitat"],
  },
  Berry: {
    care_summary:
      "Morning sun with afternoon shade can reduce stress in hot zones. Acidic, organic-rich soil and steady moisture improve berry size.",
    uses: ["Fresh berries", "Jams", "Freezing"],
    benefits: [
      "Antioxidant-rich harvest on a small footprint",
      "Understory layer fills gaps under trees",
      "Pollinator-friendly spring flowers",
    ],
    guild_functions: ["Food Producer", "Pollinator Attractor", "Groundcover/Mulch"],
  },
  Herb: {
    care_summary:
      "Most Florida herbs want sun to part shade and sharp drainage. Harvest regularly to keep plants bushy and delay flowering.",
    uses: ["Culinary seasoning", "Teas", "Aromatherapy", "Pest confusing scents"],
    benefits: [
      "Strong aromas confuse pests on neighboring crops",
      "Pollinator magnet when allowed to bloom",
      "Low footprint — tuck along paths and bed edges",
    ],
    companion_plants: ["Tomato", "Pepper", "Squash", "Marigold", "Sweet Potato"],
    guild_functions: ["Pest Repellent", "Pollinator Attractor", "Food Producer"],
  },
  Vegetable: {
    care_summary:
      "Rotate crops by family, mulch to cool soil, and match planting to Florida's warm season. Water at the root zone in the morning.",
    uses: ["Fresh harvest", "Cooking", "Preserving"],
    benefits: [
      "Fast calories and nutrition from a small bed",
      "Fills herbaceous layer between trees and shrubs",
      "High turnover — multiple plantings per year in south FL",
    ],
    companion_plants: [
      "Genovese Basil",
      "French Marigold",
      "Pigeon Pea",
      "Sweet Potato",
      "Lemongrass",
    ],
    avoid_planting_near: ["Fennel", "Corn (shade and pest)"],
    guild_functions: ["Food Producer", "Pollinator Attractor"],
  },
  "Ground Cover": {
    care_summary:
      "Establish from cuttings or plugs before rainy season. Keep moist until rooted, then let spread to suppress weeds.",
    uses: ["Living mulch", "Erosion control", "Edible leaves or tubers"],
    benefits: [
      "Protects soil from Florida sun and pounding rain",
      "Reduces weeding and watering needs for neighbors",
      "Living mulch feeds soil biology as it grows",
    ],
    companion_plants: ["Moringa", "Pigeon Pea", "Fruit trees", "Sweet Potato"],
    guild_functions: ["Groundcover/Mulch", "Food Producer", "Nitrogen Fixer"],
  },
  "Support Species": {
    care_summary:
      "Position support plants where you can chop and drop leaves onto hungry fruit trees. Cut back regularly to keep size manageable.",
    uses: ["Chop-and-drop mulch", "Nitrogen banking", "Habitat"],
    benefits: [
      "Feeds the guild without competing for fruit",
      "Builds soil faster than mulch alone",
      "Attracts beneficial insects and birds",
    ],
    companion_plants: ["Mango", "Avocado", "Citrus", "Papaya", "Sweet Potato"],
    guild_functions: ["Nitrogen Fixer", "Dynamic Accumulator", "Wildlife Habitat"],
  },
  Vine: {
    care_summary:
      "Give sturdy trellis or let climb a sturdy tree trunk. Prune for airflow to reduce fungal issues in humid Florida.",
    uses: ["Vertical harvest", "Shade on trellis", "Living fence"],
    benefits: [
      "Uses vertical space — more food per square foot",
      "Canopy cover cools paths and soil below",
      "Rapid growth in warm months",
    ],
    companion_plants: ["Corn", "Sunflower", "Marigold", "Basil", "Pigeon Pea"],
    avoid_planting_near: ["Potato", "Fennel"],
    guild_functions: ["Food Producer", "Pollinator Attractor"],
  },
  Palm: {
    care_summary:
      "Palms need drainage and micronutrients — avoid lawn fertilizer. Water deeply but infrequently once established.",
    uses: ["Fruit or heart", "Landscape structure", "Thatch/mulch"],
    benefits: [
      "Hurricane-adapted architecture in coastal Florida",
      "Vertical interest without wide shade spread",
      "Wildlife uses fronds and fruit where applicable",
    ],
    guild_functions: ["Food Producer", "Wildlife Habitat", "Wind Break"],
  },
  "Native Shrub": {
    care_summary:
      "Florida natives need little fertilizer once established. Plant in appropriate sun and allow natural shape — minimal pruning.",
    uses: ["Wildlife habitat", "Native landscaping", "Erosion control"],
    benefits: [
      "Adapted to local rainfall and pests",
      "Supports native pollinators and birds",
      "Low maintenance compared to exotics",
    ],
    guild_functions: ["Wildlife Habitat", "Pollinator Attractor", "Pest Repellent"],
  },
  "Edible Flower": {
    care_summary:
      "Deadhead spent blooms to extend flowering in heat. Full sun and compost-rich soil improve petal and flavor quality.",
    uses: ["Edible petals", "Salad garnish", "Pollinator support"],
    benefits: [
      "Beautiful pollinator bridge between crop seasons",
      "Edible color for salads and drinks",
      "Pest-repelling types protect vegetables nearby",
    ],
    companion_plants: ["Tomato", "Pepper", "Squash", "Basil", "Cucumber"],
    guild_functions: ["Pollinator Attractor", "Pest Repellent", "Food Producer"],
  },
};

/** Genus-level guild patterns (first word of scientific name). */
const GENUS_PROFILES: Record<string, ProfilePatch> = {
  mangifera: {
    companion_plants: ["Moringa", "Lemongrass", "Sweet Potato", "Pigeon Pea"],
    benefits: ["Dense shade for understory guilds", "Mango fiber and vitamins A & C"],
  },
  persea: {
    companion_plants: ["Mango", "Moringa", "Comfrey", "Lemongrass"],
    benefits: ["Healthy fats and potassium from fruit", "Wide canopy cools the site"],
  },
  citrus: {
    companion_plants: ["Comfrey", "Rosemary", "Lemongrass", "Pigeon Pea"],
    avoid_planting_near: ["Fennel"],
  },
  carica: {
    companion_plants: ["Lemongrass", "Sweet Potato", "Comfrey"],
    benefits: ["Fast fruiting within a year on good sites", "Enzyme-rich papaya for digestion"],
  },
  solanum: {
    companion_plants: [
      "Genovese Basil",
      "French Marigold",
      "Pigeon Pea",
      "Sweet Potato",
      "Lemongrass",
    ],
    avoid_planting_near: ["Fennel", "Corn"],
    guild_functions: ["Food Producer", "Pollinator Attractor"],
  },
  capsicum: {
    companion_plants: ["Genovese Basil", "French Marigold", "Pigeon Pea", "Okra", "Tomato"],
    avoid_planting_near: ["Fennel", "Kohlrabi"],
  },
  cucurbita: {
    companion_plants: ["Corn", "French Marigold", "Nasturtium", "Beans", "Radish"],
    avoid_planting_near: ["Potato"],
  },
  cucumis: {
    companion_plants: ["Beans", "Corn", "Sunflower", "Marigold", "Peas"],
  },
  ocimum: {
    companion_plants: ["Tomato", "Pepper", "Marigold"],
    guild_functions: ["Pest Repellent", "Pollinator Attractor", "Food Producer"],
  },
  zingiber: {
    companion_plants: ["Lemongrass", "Turmeric", "Mango", "Avocado"],
  },
  curcuma: {
    companion_plants: ["Ginger", "Lemongrass", "Avocado", "Mango"],
  },
  cymbopogon: {
    companion_plants: ["Mango", "Papaya", "Ginger"],
    benefits: ["Repels mosquitoes", "Living mulch at bed edges"],
  },
  moringa: {
    companion_plants: ["Mango", "Avocado", "Sweet Potato", "Pigeon Pea"],
    guild_functions: ["Nitrogen Fixer", "Food Producer", "Dynamic Accumulator"],
  },
  cajanus: {
    companion_plants: ["Mango", "Avocado", "Moringa", "Citrus"],
    guild_functions: ["Nitrogen Fixer", "Food Producer", "Wildlife Habitat"],
  },
  ipomoea: {
    companion_plants: ["Mango", "Moringa", "Pigeon Pea"],
    guild_functions: ["Groundcover/Mulch", "Food Producer"],
  },
  symphytum: {
    companion_plants: ["Avocado", "Citrus", "Mango", "Mulberry"],
    guild_functions: ["Dynamic Accumulator", "Groundcover/Mulch"],
  },
  musa: {
    companion_plants: ["Pigeon Pea", "Sweet Potato", "Lemongrass", "Comfrey"],
  },
  annona: {
    guild_functions: ["Food Producer", "Pollinator Attractor"],
  },
  passiflora: {
    companion_plants: ["Pigeon Pea", "Comfrey", "Lemongrass"],
  },
  tagetes: {
    companion_plants: ["Tomato", "Pepper", "Squash", "Basil"],
    guild_functions: ["Pest Repellent", "Pollinator Attractor"],
  },
  helianthus: {
    companion_plants: ["Corn", "Cucumber", "Squash"],
  },
  phaseolus: {
    companion_plants: ["Corn", "Squash", "Marigold", "Cucumber"],
    guild_functions: ["Nitrogen Fixer", "Food Producer"],
  },
  vigna: {
    companion_plants: ["Corn", "Sorghum", "Sweet Potato"],
    guild_functions: ["Nitrogen Fixer", "Food Producer"],
  },
  psophocarpus: {
    companion_plants: ["Corn", "Sunflower", "Marigold", "Sweet Potato", "Pigeon Pea"],
    guild_functions: ["Nitrogen Fixer", "Food Producer"],
  },
  punica: {
    companion_plants: ["Lavender", "Rosemary", "Comfrey", "Chives", "French Marigold"],
  },
  ziziphus: {
    companion_plants: ["Comfrey", "Pigeon Pea", "Sweet Potato", "Lemongrass"],
  },
  olea: {
    companion_plants: ["Lavender", "Rosemary", "Comfrey", "Garden Sage"],
  },
  carya: {
    companion_plants: ["Comfrey", "Pigeon Pea", "Sweet Potato", "Beans"],
    avoid_planting_near: ["Walnut", "Dense turf at trunk"],
  },
  prunus: {
    companion_plants: ["Comfrey", "Chives", "French Marigold", "Nasturtium"],
    avoid_planting_near: ["Walnut", "Brambles crowding trunk"],
  },
  malus: {
    companion_plants: ["Comfrey", "French Marigold", "Nasturtium", "Chives", "Garden Sage"],
    avoid_planting_near: ["Walnut"],
  },
  pyrus: {
    companion_plants: ["Comfrey", "French Marigold", "Nasturtium", "Chives"],
    avoid_planting_near: ["Walnut"],
  },
  crataegus: {
    companion_plants: ["Comfrey", "Pigeon Pea", "Firebush", "Sweet Potato"],
  },
  cydonia: {
    companion_plants: ["Comfrey", "Lavender", "Nasturtium", "Chives"],
  },
  pouteria: {
    companion_plants: ["Moringa", "Comfrey", "Lemongrass", "Sweet Potato", "Pigeon Pea"],
  },
  casimiroa: {
    companion_plants: ["Comfrey", "Avocado", "Mango", "Lemongrass"],
  },
  chrysophyllum: {
    companion_plants: ["Moringa", "Comfrey", "Sweet Potato", "Pigeon Pea"],
  },
  nephelium: {
    companion_plants: ["Moringa", "Comfrey", "Lemongrass", "Banana"],
  },
  durio: {
    companion_plants: ["Moringa", "Comfrey", "Banana", "Pigeon Pea"],
  },
  garcinia: {
    companion_plants: ["Moringa", "Comfrey", "Lemongrass", "Sweet Potato"],
  },
  artocarpus: {
    companion_plants: ["Moringa", "Pigeon Pea", "Comfrey", "Sweet Potato"],
  },
  brosimum: {
    companion_plants: ["Moringa", "Comfrey", "Pigeon Pea", "Sweet Potato"],
  },
  inga: {
    companion_plants: ["Mango", "Avocado", "Sweet Potato", "Comfrey"],
    guild_functions: ["Nitrogen Fixer", "Food Producer"],
  },
  bunchosia: {
    companion_plants: ["Comfrey", "Lemongrass", "Moringa", "Sweet Potato"],
  },
  synsepalum: {
    companion_plants: ["Comfrey", "Lemongrass", "Sweet Potato", "Moringa"],
  },
  syzygium: {
    companion_plants: ["Moringa", "Comfrey", "Lemongrass", "Pigeon Pea"],
  },
  cananga: {
    companion_plants: ["Moringa", "Comfrey", "Lemongrass", "Firebush"],
  },
  eugenia: {
    companion_plants: ["Comfrey", "Lemongrass", "Pigeon Pea", "Sweet Potato"],
  },
  plinia: {
    companion_plants: ["Comfrey", "Sweet Potato", "Lemongrass", "Moringa"],
  },
  rollinia: {
    companion_plants: ["Comfrey", "Pigeon Pea", "Lemongrass", "Sweet Potato"],
  },
  phoenix: {
    companion_plants: ["Comfrey", "Lavender", "Rosemary", "Pigeon Pea"],
  },
  butia: {
    companion_plants: ["Comfrey", "Rosemary", "Sweet Potato", "Firebush"],
  },
  macadamia: {
    companion_plants: ["Comfrey", "Pigeon Pea", "Sweet Potato", "Lemongrass"],
  },
  hylocereus: {
    companion_plants: ["Comfrey", "Pigeon Pea", "Sweet Potato", "French Marigold"],
  },
  ananas: {
    companion_plants: ["Comfrey", "French Marigold", "Sweet Potato", "Lemongrass"],
  },
  monstera: {
    guild_functions: ["Food Producer", "Pollinator Attractor"],
  },
  morus: {
    guild_functions: ["Food Producer", "Pollinator Attractor", "Wildlife Habitat"],
  },
  amelanchier: {
    companion_plants: ["Comfrey", "Firebush", "Sweet Potato", "Gayfeather"],
  },
  fortunella: {
    companion_plants: ["Comfrey", "Rosemary", "Lemongrass", "French Marigold"],
    avoid_planting_near: ["Fennel"],
  },
  coccoloba: {
    companion_plants: ["Coontie", "Firebush", "American Beautyberry", "Sweet Potato"],
  },
  chrysobalanus: {
    companion_plants: ["Coontie", "Firebush", "American Beautyberry"],
  },
  opuntia: {
    companion_plants: ["Comfrey", "Lemongrass", "Rosemary"],
  },
  liatris: {
    companion_plants: ["Coontie", "Firebush", "American Beautyberry"],
    guild_functions: ["Pollinator Attractor", "Wildlife Habitat"],
  },
  lysiloma: {
    companion_plants: ["Comfrey", "Firebush", "Sweet Potato", "Pigeon Pea"],
    guild_functions: ["Nitrogen Fixer", "Wildlife Habitat"],
  },
  geobalanus: {
    companion_plants: ["Coontie", "Sabal Palm", "Firebush"],
  },
  psidium: {
    companion_plants: ["Comfrey", "Lemongrass", "Moringa", "Sweet Potato"],
  },
  ficus: {
    companion_plants: ["Comfrey", "Lemongrass", "Sweet Potato", "French Marigold"],
  },
  litchi: {
    companion_plants: ["Moringa", "Comfrey", "Lemongrass", "Pigeon Pea"],
  },
  dimocarpus: {
    companion_plants: ["Moringa", "Pigeon Pea", "Sweet Potato", "Lemongrass"],
  },
  eriobotrya: {
    companion_plants: ["Comfrey", "French Marigold", "Lemongrass", "Pigeon Pea"],
  },
  carissa: {
    companion_plants: ["Comfrey", "Lemongrass", "Sweet Potato", "Firebush"],
  },
  asimina: {
    companion_plants: ["Comfrey", "Pigeon Pea", "Serviceberry (Juneberry)", "Sweet Potato"],
    avoid_planting_near: ["Walnut"],
  },
  averrhoa: {
    companion_plants: ["Moringa", "Comfrey", "Lemongrass", "Pigeon Pea"],
  },
  acca: {
    companion_plants: ["Comfrey", "Lavender", "Lemongrass", "French Marigold"],
  },
  manilkara: {
    companion_plants: ["Moringa", "Comfrey", "Lemongrass", "Sweet Potato"],
  },
  cocos: {
    guild_functions: ["Food Producer", "Wildlife Habitat", "Wind Break"],
  },
  coffea: {
    companion_plants: ["Comfrey", "Apple Banana", "Lemongrass", "Garden Sage"],
  },
  theobroma: {
    companion_plants: ["Apple Banana", "Comfrey", "Lemongrass", "Ice Cream Bean"],
  },
  fragaria: {
    companion_plants: ["Comfrey", "French Marigold", "Thyme", "Lemongrass"],
  },
  vaccinium: {
    companion_plants: ["Comfrey", "Lemongrass", "Thyme", "Sweet Potato"],
  },
  rubus: {
    companion_plants: ["Comfrey", "French Marigold", "Lemongrass", "Pigeon Pea"],
  },
  malpighia: {
    companion_plants: ["Comfrey", "Lemongrass", "Sweet Potato", "Firebush"],
  },
  sambucus: {
    companion_plants: ["Comfrey", "French Marigold", "Pigeon Pea", "Sweet Potato"],
  },
  citrofortunella: {
    companion_plants: ["Comfrey", "Rosemary", "Lemongrass", "French Marigold"],
    avoid_planting_near: ["Fennel"],
  },
  sabal: {
    companion_plants: ["Coontie", "Firebush", "American Beautyberry", "Sweet Potato"],
  },
  dovyalis: {
    companion_plants: ["Comfrey", "Lemongrass", "Pigeon Pea", "Sweet Potato"],
  },
  lycium: {
    companion_plants: ["Comfrey", "Rosemary", "Lemongrass", "Sweet Potato"],
  },
  elaeagnus: {
    companion_plants: ["Comfrey", "Lemongrass", "Pigeon Pea", "Sweet Potato"],
  },
  viburnum: {
    companion_plants: ["Comfrey", "Firebush", "Sweet Potato", "Gayfeather"],
  },
  serenoa: {
    companion_plants: ["Coontie", "Firebush", "Sweet Potato", "Prickly Pear Cactus"],
  },
};

/** Species-specific overrides (normalized scientific name). */
const SPECIES_PROFILES: Record<string, ProfilePatch> = {
  "solanum lycopersicum": {
    care_summary:
      "Florida warm-season staple: cage or stake vines, mulch roots, and water steadily to prevent blossom-end rot. Choose heat-tolerant cultivars for south Florida; plant after last frost.",
    uses: ["Fresh eating", "Sauces & salsa", "Canning", "Salads"],
    benefits: [
      "Rich in lycopene and vitamin C",
      "Flowers attract pollinators for the whole vegetable bed",
      "Multiple harvests through spring and fall in Florida",
    ],
    companion_plants: [
      "Genovese Basil",
      "French Marigold",
      "Pigeon Pea",
      "Sweet Potato",
      "Everglades Tomato",
    ],
    avoid_planting_near: ["Fennel", "Corn", "Walnut"],
    guild_functions: ["Food Producer", "Pollinator Attractor"],
  },
  "capsicum annuum": {
    care_summary:
      "Peppers love Florida heat — full sun, fertile soil, and even moisture. Avoid excessive nitrogen, which boosts leaves over fruit.",
    uses: ["Fresh peppers", "Drying", "Hot sauce", "Freezing"],
    benefits: [
      "Vitamin C and capsaicin for flavor and preservation",
      "Compact plants fit under tree edges",
      "Long harvest window in frost-free zones",
    ],
    companion_plants: ["Genovese Basil", "French Marigold", "Tomato", "Okra", "Eggplant"],
    avoid_planting_near: ["Fennel", "Kohlrabi"],
  },
  "capsicum chinense": {
    care_summary:
      "Habanero-types need a long warm season. Plant early in south Florida; provide afternoon shade in hottest inland sites if leaves scorch.",
    companion_plants: ["Basil", "Marigold", "Pigeon Pea", "Lemongrass"],
  },
  "cucurbita pepo": {
    care_summary:
      "Summer squash peaks in warm months — harvest young fruit often to keep plants productive. Watch for squash vine borer in Florida.",
    companion_plants: ["Corn", "French Marigold", "Beans", "Nasturtium"],
    avoid_planting_near: ["Potato"],
  },
  "cucurbita moschata": {
    care_summary:
      "Winter squash and Seminole pumpkin types tolerate Florida humidity better than many cucurbits. Give vines room to run.",
    companion_plants: ["Corn", "Pigeon Pea", "Marigold", "Sweet Potato"],
  },
  "cucumis sativus": {
    care_summary:
      "Cucumbers want trellis, steady water, and morning sun. Plant in waves for continuous harvest through fall.",
    companion_plants: ["Beans", "Corn", "Marigold", "Sunflower"],
  },
  "solanum pimpinellifolium": {
    care_summary:
      "Wild Florida currant tomato — tough, self-sowing, and excellent as a living mulch under trees. Tolerates heat and humidity.",
    benefits: ["Native cherry tomato flavor", "Self-seeds for free replanting"],
    companion_plants: ["Basil", "Marigold", "Sweet Potato"],
  },
  "mangifera indica": {
    benefits: [
      "High in vitamins C and A",
      "Dense canopy shade for understory guilds",
      "Attracts birds when fruiting",
    ],
    companion_plants: ["Moringa", "Lemongrass", "Sweet Potato", "Pigeon Pea"],
  },
  "persea americana": {
    companion_plants: ["Mango", "Moringa", "Comfrey", "Lemongrass"],
  },
  "moringa oleifera": {
    guild_functions: ["Nitrogen Fixer", "Food Producer", "Dynamic Accumulator"],
    companion_plants: ["Mango", "Avocado", "Sweet Potato", "Pigeon Pea"],
  },
  "ipomoea batatas": {
    companion_plants: ["Mango", "Moringa", "Pigeon Pea", "Citrus"],
    guild_functions: ["Groundcover/Mulch", "Food Producer"],
  },
  "diospyros virginiana": {
    companion_plants: [
      "Comfrey",
      "Pigeon Pea",
      "Serviceberry (Juneberry)",
      "Sweet Potato",
    ],
    avoid_planting_near: ["Walnut"],
  },
  "diospyros nigra": {
    companion_plants: ["Mango", "Comfrey", "Lemongrass", "Sweet Potato"],
  },
  "annona squamosa": {
    companion_plants: [
      "Lemongrass",
      "Sweet Potato",
      "French Marigold",
      "Pigeon Pea",
    ],
  },
  "annona muricata": {
    companion_plants: ["Papaya", "Banana", "Lemongrass", "Comfrey"],
  },
  "annona reticulata": {
    companion_plants: [
      "French Marigold",
      "Sweet Potato",
      "Genovese Basil",
      "Pigeon Pea",
    ],
  },
  "annona cherimola": {
    companion_plants: ["Avocado", "Lemongrass", "Comfrey", "Sweet Potato"],
  },
  "annona glabra": {
    companion_plants: [
      "Firebush",
      "Coontie",
      "American Beautyberry",
      "Sweet Potato",
    ],
  },
  "annona x atemoya": {
    companion_plants: ["Sugar Apple", "Mango", "Lemongrass", "Comfrey"],
  },
  "morus rubra": {
    companion_plants: [
      "Comfrey",
      "Pigeon Pea",
      "Serviceberry (Juneberry)",
      "Firebush",
    ],
  },
  "morus nigra": {
    companion_plants: [
      "Comfrey",
      "French Marigold",
      "Nasturtium",
      "Sweet Potato",
    ],
  },
  "cocos nucifera": {
    companion_plants: ["Banana", "Pigeon Pea", "Sweet Potato", "Pineapple"],
  },
  "monstera deliciosa": {
    companion_plants: [
      "Pigeon Pea",
      "French Marigold",
      "Sweet Potato",
      "Ice Cream Bean",
    ],
  },
  "fortunella margarita": {
    companion_plants: ["Comfrey", "Rosemary", "Lemongrass", "French Marigold"],
  },
  "fortunella crassifolia": {
    companion_plants: ["Comfrey", "Rosemary", "Lemongrass", "French Marigold"],
  },
};

const LAYER_GUILD: Partial<Record<CanopyLayer, GuildFunction[]>> = {
  Overstory: ["Food Producer", "Wind Break", "Wildlife Habitat"],
  Understory: ["Food Producer", "Pollinator Attractor"],
  Shrub: ["Food Producer", "Pollinator Attractor", "Pest Repellent"],
  Herbaceous: ["Food Producer", "Pollinator Attractor"],
  Groundcover: ["Groundcover/Mulch", "Food Producer"],
  Root: ["Food Producer", "Dynamic Accumulator"],
  Vine: ["Food Producer", "Pollinator Attractor"],
};

function buildCareSummary(plant: Plant, patches: ProfilePatch[]): string {
  let existing = plant.care_summary?.trim() ?? "";
  if (isWikiDump(existing)) existing = "";
  /** Species/genus overrides come after category in collectPatches — take the most specific. */
  const patchCare = [...patches]
    .reverse()
    .map((p) => p.care_summary?.trim())
    .find(Boolean);

  if (existing && !isDistributionBlurb(existing)) {
    if (VH021_RE.test(existing) && patchCare) {
      return `${patchCare} Listed in the UF/IFAS Florida Vegetable Gardening Guide (VH021).`;
    }
    if (existing.length >= 40) return existing;
    if (patchCare) return `${existing} ${patchCare}`.trim();
    return existing;
  }

  if (patchCare) return patchCare;

  if (existing && !isDistributionBlurb(existing)) return existing;

  if (isTennesseeCatalogPlant(plant)) {
    return tennesseeCareFallback(plant);
  }
  if (isConnecticutCatalogPlant(plant)) {
    return connecticutCareFallback(plant);
  }

  return (
    patches.find((p) => p.care_summary)?.care_summary ??
    `${plant.common_name} grows well in Florida food forests as a ${plant.canopy_layer.toLowerCase()} ${plant.category.toLowerCase()}.`
  );
}

function collectPatches(plant: Plant): ProfilePatch[] {
  const sci = normalizeScientific(plant.scientific_name);
  const genus = resolveGenusKey(plant);
  const curated = curatedPatchForPlant(plant.scientific_name);

  return [
    ...tennesseeProfilePatches(plant),
    ...connecticutProfilePatches(plant),
    CATEGORY_PROFILES[plant.category],
    GENUS_PROFILES[genus],
    SPECIES_PROFILES[sci],
    {
      benefits: curated.benefits,
      companion_plants: curated.companion_plants,
      avoid_planting_near: curated.avoid_planting_near,
    },
  ].filter(Boolean) as ProfilePatch[];
}

function vineLayerPatch(plant: Plant): ProfilePatch | undefined {
  return plant.canopy_layer === "Vine" ? CATEGORY_PROFILES.Vine : undefined;
}

function resolveCompanionPlants(plant: Plant): string[] {
  const sci = normalizeScientific(plant.scientific_name);
  const genus = resolveGenusKey(plant);
  const curated = curatedPatchForPlant(plant.scientific_name);
  const vine = vineLayerPatch(plant);
  const sources: (string[] | undefined)[] = [
    treeCompanionPlants(plant.scientific_name, plant.id),
    SPECIES_PROFILES[sci]?.companion_plants,
    GENUS_PROFILES[genus]?.companion_plants,
    curated.companion_plants,
    vine?.companion_plants,
    CATEGORY_PROFILES[plant.category]?.companion_plants,
  ];

  for (let i = 0; i < sources.length; i++) {
    const list = (sources[i] ?? []).map((s) => s.trim()).filter(Boolean);
    if (!list.length) continue;
    if (i === 2 && isGenericCompanionGuild(list)) continue;
    return list.slice(0, 8);
  }
  return [];
}

function resolveAvoidList(plant: Plant): string[] {
  const sci = normalizeScientific(plant.scientific_name);
  const genus = resolveGenusKey(plant);
  const curated = curatedPatchForPlant(plant.scientific_name);
  const vine = vineLayerPatch(plant);
  return pickStringList(
    SPECIES_PROFILES[sci]?.avoid_planting_near,
    GENUS_PROFILES[genus]?.avoid_planting_near,
    curated.avoid_planting_near,
    vine?.avoid_planting_near,
    CATEGORY_PROFILES[plant.category]?.avoid_planting_near,
  );
}

/** Apply full designer profile to a plant (idempotent). */
export function applyDesignerProfile(plant: Plant): Plant {
  const patches = collectPatches(plant);

  let uses = plant.uses ?? [];
  let benefits = plant.benefits ?? [];
  let guild_functions = plant.guild_functions ?? [];

  for (const p of patches) {
    uses = mergeLists(uses, p.uses);
    benefits = mergeLists(benefits, p.benefits);
    guild_functions = mergeGuild(guild_functions, p.guild_functions);
  }

  const { companion_plants, avoid_planting_near } = reconcileCompanionLists(
    resolveCompanionPlants(plant),
    resolveAvoidList(plant),
  );

  if (!guild_functions.length) {
    guild_functions = mergeGuild(
      LAYER_GUILD[plant.canopy_layer],
      plant.is_edible ? ["Food Producer"] : ["Wildlife Habitat"],
    );
  }

  if (!uses.length && plant.is_edible) {
    uses =
      plant.category === "Herb"
        ? ["Culinary herb", "Teas", "Seasoning"]
        : plant.category === "Vegetable"
          ? ["Fresh harvest", "Cooking"]
          : ["Fresh eating", "Kitchen use"];
  }

  const merged: Plant = {
    ...plant,
    care_summary: buildCareSummary(plant, patches),
    uses,
    companion_plants,
    avoid_planting_near,
    guild_functions,
    benefits: [],
  };

  merged.benefits = finalizePlantBenefits(merged);

  return enrichPlantNativeOrigin(merged);
}
