// ============================================================
//  FLORIDA FOOD FOREST — Core Plant Type Definitions
// ============================================================

export type CanopyLayer =
  | "Overstory"
  | "Understory"
  | "Shrub"
  | "Herbaceous"
  | "Groundcover"
  | "Root"
  | "Vine";

export type PlantCategory =
  | "Fruit Tree"
  | "Citrus"
  | "Tropical Fruit"
  | "Berry"
  | "Herb"
  | "Vegetable"
  | "Ground Cover"
  | "Support Species"
  | "Vine"
  | "Palm"
  | "Native Shrub"
  | "Edible Flower";

export type SunlightNeeds = "Full Sun" | "Partial Shade" | "Full Shade" | "Adaptable";
export type WaterNeeds = "Low" | "Moderate" | "High" | "Drought Tolerant";
export type PlantingSeason = "Spring" | "Summer" | "Fall" | "Winter" | "Year-Round";
export type GrowthRate = "Slow" | "Moderate" | "Fast";
export type SoilType = "Sandy" | "Clay" | "Loamy" | "Well-Drained" | "Moist" | "Any";

export type GuildFunction =
  | "Nitrogen Fixer"
  | "Dynamic Accumulator"
  | "Pollinator Attractor"
  | "Pest Repellent"
  | "Wind Break"
  | "Groundcover/Mulch"
  | "Food Producer"
  | "Medicinal"
  | "Wildlife Habitat";

export interface Plant {
  id: string;
  common_name: string;
  scientific_name: string;
  image_url: string | null;

  /** Trefle.io reference */
  trefle_id?: number;
  trefle_slug?: string;
  family: string | null;
  genus: string | null;
  edible_part: string | null;
  vegetable: boolean;
  observations: string | null;
  synonyms: string[];
  /** Full Trefle plant detail JSON when fetched */
  trefle_json: string | null;

  category: PlantCategory;
  canopy_layer: CanopyLayer;
  guild_functions: GuildFunction[];

  is_florida_native: boolean;
  is_kitchen_essential: boolean;
  is_edible: boolean;
  florida_hardiness_zones: string[];
  native_states: string[];
  grows_in_us: boolean;
  is_invasive_in_florida: boolean;

  mature_height_feet: [number, number];
  mature_spread_feet: [number, number];
  canvas_radius_feet: number;

  sunlight: SunlightNeeds;
  water_needs: WaterNeeds;
  soil_preferences: SoilType[];
  best_planting_seasons: PlantingSeason[];
  growth_rate: GrowthRate;

  care_summary: string;
  uses: string[];
  benefits: string[];
  companion_plants: string[];
  avoid_planting_near: string[];

  tags: string[];
  data_source: "manual" | "trefle" | "usda" | "ifas";
  last_updated: string;
}

export interface PlantSummary {
  id: string;
  common_name: string;
  scientific_name: string;
  category: PlantCategory;
  canopy_layer: CanopyLayer;
  is_florida_native: boolean;
  is_kitchen_essential: boolean;
  is_edible: boolean;
  is_invasive_in_florida?: boolean;
  native_states: string[];
  growing_zones: string[];
  canvas_radius_feet: number;
  image_url: string | null;
  tags: string[];
  data_source?: Plant["data_source"];
  /** Present on combined API list responses */
  source?: "local" | "trefle";
  trefle_id?: number;
  trefle_slug?: string;
}

export interface PlantFilters {
  search?: string;
  category?: PlantCategory | PlantCategory[];
  canopy_layer?: CanopyLayer | CanopyLayer[];
  florida_native_only?: boolean;
  native_state?: string;
  native_to_state_only?: boolean;
  /** Match plants that can grow in native_state (zone overlap or native range). */
  for_my_area?: boolean;
  kitchen_essentials_only?: boolean;
  edible_only?: boolean;
  exclude_invasive?: boolean;
  /** When false, include full catalog (used with for_my_area). */
  us_only?: boolean;
  /** Designer: only curated Florida food-forest plants (IFAS seed catalog). */
  food_forest_only?: boolean;
  /** Designer sidebar group (fruit_trees, herbs, …). */
  food_forest_group?: string;
  hardiness_zone?: string;
  guild_function?: GuildFunction;
  limit?: number;
  offset?: number;
}
