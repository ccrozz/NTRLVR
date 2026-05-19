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

export interface PlantSummary {
  id: string;
  common_name: string;
  scientific_name: string;
  category: PlantCategory;
  canopy_layer: CanopyLayer;
  is_florida_native: boolean;
  is_kitchen_essential: boolean;
  is_edible: boolean;
  native_states: string[];
  growing_zones: string[];
  is_invasive_in_florida: boolean;
  canvas_radius_feet: number;
  image_url: string | null;
  tags: string[];
  data_source?: string;
}

export interface Plant extends PlantSummary {
  trefle_id?: number;
  trefle_slug?: string;
  family: string | null;
  genus: string | null;
  edible_part: string | null;
  vegetable: boolean;
  observations: string | null;
  synonyms: string[];
  guild_functions: string[];
  florida_hardiness_zones?: string[];
  source?: "local" | "trefle";
  mature_height_feet: [number, number];
  mature_spread_feet: [number, number];
  sunlight: string;
  water_needs: string;
  soil_preferences: string[];
  best_planting_seasons: string[];
  growth_rate: string;
  care_summary: string;
  uses: string[];
  benefits: string[];
  companion_plants: string[];
  avoid_planting_near: string[];
  data_source: string;
  last_updated: string;
}

export interface PlantsResponse {
  data: PlantSummary[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface PlantFilters {
  search?: string;
  category?: string;
  canopy_layer?: string;
  growing_zone?: string;
  edible_only?: boolean;
  exclude_invasive?: boolean;
  state?: string;
  native_to_state?: boolean;
  /** When false, skip area-based matching (e.g. native-only mode). */
  for_my_area?: boolean;
  limit?: number;
  offset?: number;
}

export interface GrowingZoneCount {
  zone: string;
  count: number;
}

export interface UsStateOption {
  code: string;
  name: string;
  hardiness_zones: string[];
  primary_zone: string;
  zone_range: string;
}
