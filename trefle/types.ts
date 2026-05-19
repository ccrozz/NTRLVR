export interface TrefleLinks {
  first?: string;
  last?: string;
  next?: string;
  self?: string;
}

export interface TrefleListPlant {
  id: number;
  common_name: string | null;
  slug: string;
  scientific_name: string;
  year?: number | null;
  bibliography?: string | null;
  author?: string | null;
  status?: string | null;
  rank?: string | null;
  family_common_name?: string | null;
  genus_id?: number | null;
  image_url?: string | null;
  synonyms?: string[];
  genus?: string;
  family?: string;
  vegetable?: boolean;
  observations?: string | null;
  links?: Record<string, string>;
}

export interface TreflePlantsListResponse {
  data: TrefleListPlant[];
  links: TrefleLinks;
  meta: { total: number };
}

export interface TrefleGrowth {
  description?: string | null;
  sowing?: string | null;
  light?: number | null;
  ph_minimum?: number | null;
  ph_maximum?: number | null;
  soil_texture?: number | null;
  soil_humidity?: number | null;
  bloom_months?: string[] | null;
  fruit_months?: string[] | null;
  growth_months?: string[] | null;
  minimum_temperature?: { deg_c?: number | null; deg_f?: number | null };
  maximum_temperature?: { deg_c?: number | null; deg_f?: number | null };
  minimum_precipitation?: { mm?: number | null };
  maximum_precipitation?: { mm?: number | null };
  minimum_root_depth?: { cm?: number | null };
  row_spacing?: { cm?: number | null };
  spread?: { cm?: number | null };
}

export interface TrefleSpecifications {
  ligneous_type?: string | null;
  growth_form?: string | null;
  growth_habit?: string | null;
  growth_rate?: string | null;
  average_height?: { cm?: number | null };
  maximum_height?: { cm?: number | null };
  nitrogen_fixation?: string | null;
  toxicity?: string | null;
}

export interface TrefleSpecies extends TrefleListPlant {
  edible?: boolean;
  edible_part?: string | null;
  duration?: string | null;
  distribution?: { native?: string[]; introduced?: string[] };
  distributions?: unknown;
  growth?: TrefleGrowth | null;
  specifications?: TrefleSpecifications | null;
  flower?: Record<string, unknown> | null;
  foliage?: Record<string, unknown> | null;
  fruit_or_seed?: Record<string, unknown> | null;
  common_names?: Record<string, string[]>;
  images?: Record<string, { image_url?: string }[]>;
}

export interface TreflePlantDetail {
  id: number;
  common_name: string | null;
  slug: string;
  scientific_name: string;
  main_species_id?: number | null;
  image_url?: string | null;
  year?: number | null;
  bibliography?: string | null;
  author?: string | null;
  family_common_name?: string | null;
  genus_id?: number | null;
  observations?: string | null;
  vegetable?: boolean;
  genus?: string;
  family?: string;
  main_species?: TrefleSpecies | null;
  species?: TrefleSpecies[];
  subspecies?: TrefleSpecies[];
  varieties?: TrefleSpecies[];
  hybrids?: TrefleSpecies[];
  forms?: TrefleSpecies[];
  subvarieties?: TrefleSpecies[];
  links?: Record<string, string>;
}

export interface TreflePlantDetailResponse {
  data: TreflePlantDetail;
}

export interface TrefleSyncState {
  listPage: number;
  lastPage: number | null;
  pendingSlugs: string[];
  totalUpserted: number;
  baseFilters: Record<string, string>;
}
