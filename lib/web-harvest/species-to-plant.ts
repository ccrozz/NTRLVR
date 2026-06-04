import type { Plant, PlantCategory, CanopyLayer } from "../../schema.js";
import { applyEdibleFlag, inferIsEdibleFromPlant } from "../infer-is-edible.js";
import { inferBenefitsFromPlant } from "../infer-plant-benefits.js";
import type { DesignerStateCode } from "../designer-states.js";
import { webHarvestConfig } from "./state-config.js";
import type { DiscoveredSpecies } from "./discovered-species.js";
import { speciesKey } from "./discovered-species.js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function inferCategoryFromNames(
  common: string,
  scientific: string,
): PlantCategory {
  const blob = `${common} ${scientific}`.toLowerCase();
  if (/citrus|orange|lemon|lime|grapefruit/.test(blob)) return "Citrus";
  if (/palm|coconut/.test(blob)) return "Palm";
  if (/grape|vitis|vine|tendril/.test(blob)) return "Vine";
  if (/berry|strawberry|blueberry|raspberry|blackberry|currant|gooseberry/.test(blob))
    return "Berry";
  if (/apple|pear|peach|plum|cherry|fig|persimmon|pawpaw|mulberry|loquat|quince/.test(blob))
    return "Fruit Tree";
  if (/oak|maple|hickory|walnut|pecan|chestnut|beech|birch|poplar|elm|pine|spruce|fir|hemlock/.test(blob))
    return "Native Shrub";
  if (/tomato|pepper|squash|cucumber|bean|pea|lettuce|kale|chard|beet|carrot|onion|garlic|potato|corn|wheat|radish|turnip|broccoli|cabbage/.test(blob))
    return "Vegetable";
  if (/mint|basil|oregano|thyme|sage|rosemary|lavender|parsley|cilantro|dill|fennel|herb/.test(blob))
    return "Herb";
  if (/fern|moss|groundcover|clover|violet|wildflower/.test(blob))
    return "Ground Cover";
  if (/flower|blossom|bloom|rose|iris|lily|daisy|sunflower/.test(blob))
    return "Edible Flower";
  if (/shrub|holly|azalea|rhododendron|spicebush|elderberry|serviceberry/.test(blob))
    return "Native Shrub";
  return "Herb";
}

function inferCanopy(category: PlantCategory): CanopyLayer {
  if (category === "Fruit Tree" || category === "Citrus" || category === "Palm")
    return "Understory";
  if (category === "Vine") return "Vine";
  if (category === "Berry" || category === "Native Shrub") return "Shrub";
  if (category === "Ground Cover") return "Groundcover";
  if (category === "Vegetable" || category === "Herb" || category === "Edible Flower")
    return "Herbaceous";
  return "Herbaceous";
}

export function plantIdFromDiscovered(
  row: DiscoveredSpecies,
  stateCode: DesignerStateCode,
): string {
  const prefix = stateCode.toLowerCase();
  const src = row.source.slice(0, 4);
  return `web-${prefix}-${src}-${speciesKey(row.scientific_name)}`;
}

export function discoveredSpeciesToPlant(
  row: DiscoveredSpecies,
  stateCode: DesignerStateCode,
): Plant {
  const cfg = webHarvestConfig(stateCode);
  const category = inferCategoryFromNames(
    row.common_name,
    row.scientific_name,
  );
  const canopy = inferCanopy(category);
  const spread: [number, number] =
    category === "Fruit Tree" ? [10, 18] : [3, 8];
  const height: [number, number] =
    category === "Fruit Tree" ? [12, 25] : [2, 8];

  const stub: Plant = {
    id: plantIdFromDiscovered(row, stateCode),
    common_name: row.common_name,
    scientific_name: row.scientific_name,
    image_url: row.image_url ?? null,
    family: row.family ?? null,
    genus: row.genus ?? row.scientific_name.split(" ")[0] ?? null,
    edible_part: null,
    vegetable: category === "Vegetable",
    observations: `Harvested from ${row.source} for ${cfg.stateName}.`,
    synonyms: [],
    trefle_json: null,
    category,
    canopy_layer: canopy,
    guild_functions: [],
    is_florida_native: false,
    native_states: row.source === "usda" ? [stateCode] : [],
    native_origin: null,
    grows_in_us: true,
    is_kitchen_essential: false,
    is_edible: false,
    florida_hardiness_zones: [...cfg.defaultZones],
    is_invasive_in_florida: false,
    mature_height_feet: height,
    mature_spread_feet: spread,
    canvas_radius_feet: (spread[0] + spread[1]) / 4,
    sunlight: "Adaptable",
    water_needs: "Moderate",
    soil_preferences: ["Any"],
    best_planting_seasons: ["Spring", "Summer"],
    growth_rate: "Moderate",
    care_summary: "",
    uses: [],
    benefits: [],
    companion_plants: [],
    avoid_planting_near: [],
    tags: ["food-forest", stateCode.toLowerCase(), row.source],
    data_source: "web",
    last_updated: today(),
  };

  stub.is_edible = inferIsEdibleFromPlant(stub);
  stub.benefits = inferBenefitsFromPlant(stub);
  return applyEdibleFlag(stub);
}
