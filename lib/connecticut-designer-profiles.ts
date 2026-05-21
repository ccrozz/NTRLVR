/**
 * Connecticut-specific designer profile patches (zones 5b–7a).
 */
import type { Plant, PlantCategory } from "../schema.js";
import type { ProfilePatch } from "./designer-plant-profiles.js";

export function isConnecticutCatalogPlant(plant: Plant): boolean {
  return (
    plant.native_states.includes("CT") ||
    plant.tags.some((t) => t.toLowerCase() === "ct")
  );
}

const CT_CATEGORY: Partial<Record<PlantCategory, ProfilePatch>> = {
  "Fruit Tree": {
    care_summary:
      "Choose cold-hardy cultivars for Connecticut zones 5b–7a. Plant in full sun with well-drained soil, mulch roots, and prune for airflow. Protect marginally hardy trees (fig, peach) with winter mulch or windbreaks in 5b–6a.",
    uses: ["Fresh fruit", "Cider", "Wildlife food", "Shade"],
    benefits: ["Cold-hardy cultivars for New England", "Long-lived canopy"],
    companion_plants: ["Comfrey", "White Clover", "Chives", "Nasturtium"],
    avoid_planting_near: ["Black Walnut", "Autumn Olive thickets"],
    guild_functions: ["Food Producer", "Wildlife Habitat"],
  },
  Berry: {
    care_summary:
      "Acidic Connecticut soils favor blueberries — test pH and amend with sulfur if needed. Mulch berries, provide trellis for brambles, and net fruit if birds are heavy pressure.",
    uses: ["Fresh berries", "Preserves", "Pollinator support"],
    benefits: ["Thrives in acidic New England soils", "Perennial harvests"],
    companion_plants: ["White Clover", "Comfrey", "Chives"],
    guild_functions: ["Food Producer", "Pollinator Attractor"],
  },
  Vegetable: {
    care_summary:
      "Use spring and fall cool-season windows; start warm-season crops after last frost. Raised beds warm faster in short CT summers.",
    uses: ["Kitchen harvest", "Season extension"],
    benefits: ["Two cool seasons per year in CT"],
    companion_plants: ["Basil", "Marigold", "Nasturtium", "Dill"],
    guild_functions: ["Food Producer"],
  },
  Herb: {
    care_summary:
      "Most culinary herbs want full sun and sharp drainage. Perennials may need winter mulch in exposed 5b sites.",
    uses: ["Culinary", "Tea", "Pollinator support"],
    guild_functions: ["Food Producer", "Pollinator Attractor", "Pest Repellent"],
  },
  "Native Shrub": {
    care_summary:
      "Native CT shrubs support pollinators and wildlife. Match moisture — wetland species for swales, upland species for dry slopes.",
    uses: ["Habitat", "Erosion control", "Ornamental", "Nectar"],
    benefits: ["Supports New England pollinator networks"],
    guild_functions: ["Wildlife Habitat", "Pollinator Attractor", "Nitrogen Fixer"],
  },
  "Edible Flower": {
    care_summary:
      "Sow after frost for annuals; perennials return yearly. Deadhead to extend bloom for pollinators.",
    uses: ["Edible petals", "Pollinator bridge crop"],
    guild_functions: ["Pollinator Attractor", "Pest Repellent"],
  },
  Vine: {
    care_summary:
      "Provide sturdy trellis or arbor. Hardy kiwi and grapes need pruning and airflow to reduce disease in humid CT summers.",
    uses: ["Fresh fruit", "Shade on trellis"],
    companion_plants: ["Comfrey", "White Clover"],
    guild_functions: ["Food Producer", "Pollinator Attractor"],
  },
  "Support Species": {
    care_summary:
      "Place dynamic accumulators and nitrogen fixers throughout the guild. Chop-and-drop comfrey and clovers feed fruit trees.",
    guild_functions: ["Dynamic Accumulator", "Nitrogen Fixer", "Groundcover/Mulch"],
  },
  "Ground Cover": {
    care_summary:
      "Living mulches protect soil, fix nitrogen, and feed pollinators between crop rows.",
    guild_functions: ["Groundcover/Mulch", "Nitrogen Fixer", "Pollinator Attractor"],
  },
};

export const CONNECTICUT_GENUS_PROFILES: Record<string, ProfilePatch> = {
  malus: {
    companion_plants: ["Comfrey", "White Clover", "Nasturtium", "Chives"],
    avoid_planting_near: ["Black Walnut"],
  },
  vaccinium: {
    care_summary:
      "Blueberries love Connecticut's naturally acidic soils. Plant in full sun, mulch with pine needles or wood chips, and water during fruit swell.",
    benefits: ["Excellent match for CT soil pH"],
  },
  ribes: {
    care_summary: "Currants and gooseberries tolerate partial shade — ideal for forest garden edges in CT.",
  },
  asimina: {
    care_summary:
      "Pawpaw wants partial shade when young and a second genetically distinct cultivar for pollination. Ripens late summer in CT.",
  },
  vitis: {
    care_summary:
      "Labrusca-type grapes (Concord family) are the classic Connecticut backyard grape.",
  },
  quercus: {
    care_summary:
      "Oaks are keystone CT natives — plant for wildlife; acorns are not a primary human food but support the whole guild.",
    guild_functions: ["Wildlife Habitat", "Wind Break"],
    uses: ["Wildlife mast", "Timber", "Shade"],
  },
  solidago: {
    care_summary:
      "Goldenrod is a critical fall nectar source in Connecticut — not a cause of hay fever (that's ragweed).",
    guild_functions: ["Pollinator Attractor", "Wildlife Habitat"],
  },
  asclepias: {
    care_summary: "Milkweeds are essential Monarch host plants — include in every CT pollinator guild.",
    guild_functions: ["Pollinator Attractor", "Wildlife Habitat"],
  },
};

export function connecticutProfilePatches(plant: Plant): ProfilePatch[] {
  if (!isConnecticutCatalogPlant(plant)) return [];
  const genus = plant.scientific_name.split(" ")[0]?.toLowerCase() ?? "";
  return [
    CT_CATEGORY[plant.category],
    CONNECTICUT_GENUS_PROFILES[genus],
  ].filter(Boolean) as ProfilePatch[];
}

export function connecticutCareFallback(plant: Plant): string {
  return `${plant.common_name} is suited to Connecticut food forests and native plantings (USDA zones 5b–7a) as a ${plant.canopy_layer.toLowerCase()} ${plant.category.toLowerCase()}.`;
}
