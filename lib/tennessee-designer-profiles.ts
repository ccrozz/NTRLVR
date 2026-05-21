/**
 * Tennessee-specific designer profile patches (zones 6a–8a).
 */
import type { Plant } from "../schema.js";
import type { ProfilePatch } from "./designer-plant-profiles.js";

export function isTennesseeCatalogPlant(plant: Plant): boolean {
  return (
    plant.native_states.includes("TN") ||
    plant.tags.some((t) => t.toLowerCase() === "tn")
  );
}

const TN_CATEGORY: Partial<Record<Plant["category"], ProfilePatch>> = {
  "Fruit Tree": {
    care_summary:
      "Tennessee spans zones 6a–8a — choose cultivars for your site (West TN pecan/peach, East TN apples, Middle TN muscadine). Full sun, deep mulch, and summer irrigation during fruit swell. Mulch figs in zone 6a winters.",
    uses: ["Fresh fruit", "Preserves", "Wildlife food", "Shade"],
    benefits: ["Crossroads climate: Appalachian + Midwest + Southern cultivars"],
    companion_plants: ["Comfrey", "White Clover", "Garlic", "Nasturtium"],
    avoid_planting_near: ["Black Walnut (allelopathic)"],
    guild_functions: ["Food Producer", "Wildlife Habitat"],
  },
  Berry: {
    care_summary:
      "Rabbiteye blueberries excel in Middle/West TN; highbush in East TN mountains. Muscadines need trellis and full sun — TN heat and humidity suit them better than European grapes.",
    uses: ["Fresh berries", "Wine/jelly", "Pollinator support"],
    companion_plants: ["Comfrey", "Crimson Clover", "Chives"],
    guild_functions: ["Food Producer", "Pollinator Attractor"],
  },
  Vegetable: {
    care_summary:
      "Use TN's long warm season for tomatoes, okra, and sweet potatoes; spring and fall cool windows for greens and brassicas. Raised beds help on heavy clay.",
    uses: ["Kitchen harvest", "Southern staples"],
    benefits: ["Excellent double cropping season"],
    companion_plants: ["Basil", "Marigold", "Nasturtium", "Dill"],
    guild_functions: ["Food Producer"],
  },
  Herb: {
    care_summary:
      "TN summers favor basil, tulsi, and lemongrass (zone 8). Rosemary and lavender thrive in zones 7–8 with sharp drainage.",
    guild_functions: ["Food Producer", "Pollinator Attractor", "Pest Repellent"],
  },
  "Native Shrub": {
    care_summary:
      "TN native shrubs support Smokies-to-Mississippi floodplain biodiversity. Match moisture: wetland species in swales, upland species on slopes.",
    uses: ["Habitat", "Nectar", "Erosion control"],
    guild_functions: ["Wildlife Habitat", "Pollinator Attractor", "Nitrogen Fixer"],
  },
  Vine: {
    care_summary:
      "Muscadine and hardy kiwi need strong trellis. Prune grapes and kiwi for airflow in humid TN summers.",
    companion_plants: ["Comfrey", "White Clover"],
    guild_functions: ["Food Producer", "Pollinator Attractor"],
  },
  "Support Species": {
    care_summary:
      "Stack N-fixers and dynamic accumulators under every fruit tree — black locust and redbud are powerful in TN guilds (site carefully).",
    guild_functions: ["Dynamic Accumulator", "Nitrogen Fixer", "Groundcover/Mulch"],
  },
};

export const TENNESSEE_GENUS_PROFILES: Record<string, ProfilePatch> = {
  asimina: {
    care_summary:
      "Pawpaw is iconic in Tennessee — plant two genetically distinct cultivars for pollination, partial shade when young, rich moist soil.",
    companion_plants: ["Pawpaw (second cultivar)", "Comfrey", "Wild Ginger"],
  },
  vitis: {
    care_summary:
      "Muscadine (Vitis rotundifolia) is the signature TN grape — self-fertile cultivars for reliable crops in heat and humidity.",
  },
  carya: {
    care_summary:
      "Pecans need long season and deep soil — West TN is prime pecan country. Plant grafted cultivars for consistent nuts.",
  },
  prunus: {
    companion_plants: ["Comfrey", "White Clover", "Chives"],
    care_summary:
      "Peaches and plums need annual pruning and disease management in humid TN — choose resistant cultivars.",
  },
  solidago: {
    care_summary:
      "Goldenrod is the backbone of fall pollinator support in Tennessee — not ragweed.",
    guild_functions: ["Pollinator Attractor", "Wildlife Habitat"],
  },
  liriodendron: {
    care_summary:
      "Tulip poplar is Tennessee's state tree — fast-growing overstory for wildlife and timber, not a primary human food crop.",
    guild_functions: ["Wildlife Habitat", "Wind Break"],
  },
};

export function tennesseeProfilePatches(plant: Plant): ProfilePatch[] {
  if (!isTennesseeCatalogPlant(plant)) return [];
  const genus = plant.scientific_name.split(" ")[0]?.toLowerCase() ?? "";
  return [TN_CATEGORY[plant.category], TENNESSEE_GENUS_PROFILES[genus]].filter(
    Boolean,
  ) as ProfilePatch[];
}

export function tennesseeCareFallback(plant: Plant): string {
  return `${plant.common_name} is suited to Tennessee food forests (USDA zones 6a–8a) as a ${plant.canopy_layer.toLowerCase()} ${plant.category.toLowerCase()}.`;
}
