import type {
  CanopyLayer,
  GuildFunction,
  Plant,
  PlantCategory,
} from "../schema.js";

const today = () => new Date().toISOString().slice(0, 10);

/** Compact row for bulk Florida food-forest catalogs. */
export interface CompactSeed {
  id: string;
  name: string;
  sci: string;
  cat: PlantCategory;
  layer: CanopyLayer;
  zones?: string[];
  /** Kitchen essential */
  k?: boolean;
  eat?: boolean;
  nat?: boolean;
  inv?: boolean;
  h?: [number, number];
  s?: [number, number];
  note?: string;
  tags?: string[];
  guild?: GuildFunction[];
  sun?: Plant["sunlight"];
  water?: Plant["water_needs"];
}

const EDIBLE_CATEGORIES: PlantCategory[] = [
  "Fruit Tree",
  "Citrus",
  "Tropical Fruit",
  "Berry",
  "Herb",
  "Vegetable",
  "Vine",
  "Edible Flower",
  "Ground Cover",
];

export function compactSeeds(defs: CompactSeed[]): Plant[] {
  return defs.map((d) => {
    const spread = d.s ?? [4, 8];
    const edibleDefault =
      d.eat ?? (EDIBLE_CATEGORIES.includes(d.cat) && !d.inv);
    return makeSeed({
      id: d.id,
      common_name: d.name,
      scientific_name: d.sci,
      category: d.cat,
      canopy_layer: d.layer,
      florida_hardiness_zones: d.zones ?? ["9a", "9b", "10a", "10b"],
      is_kitchen_essential: d.k ?? false,
      is_edible: edibleDefault,
      is_florida_native: d.nat ?? false,
      is_invasive_in_florida: d.inv ?? false,
      mature_height_feet: d.h ?? [8, 15],
      mature_spread_feet: spread,
      canvas_radius_feet: (spread[0] + spread[1]) / 4,
      care_summary: d.note ?? "",
      guild_functions: d.guild ?? (edibleDefault ? ["Food Producer"] : []),
      sunlight: d.sun,
      water_needs: d.water,
      tags: ["food-forest", "florida", ...(d.tags ?? [])],
    });
  });
}

/** Build a curated manual plant row with sensible Florida defaults. */
export function makeSeed(
  p: Partial<Plant> & Pick<Plant, "id" | "common_name" | "scientific_name" | "category" | "canopy_layer">,
): Plant {
  const spread: [number, number] = p.mature_spread_feet ?? [4, 8];
  return {
    image_url: null,
    trefle_id: undefined,
    trefle_slug: undefined,
    family: null,
    genus: null,
    edible_part: null,
    vegetable: false,
    observations: null,
    synonyms: [],
    trefle_json: null,
    guild_functions: ["Food Producer"],
    is_florida_native: false,
    is_kitchen_essential: false,
    is_edible: false,
    florida_hardiness_zones: ["9a", "9b", "10a", "10b"],
    native_states: ["FL"],
    grows_in_us: true,
    is_invasive_in_florida: false,
    mature_height_feet: [8, 15],
    mature_spread_feet: spread,
    canvas_radius_feet: (spread[0] + spread[1]) / 4,
    sunlight: "Full Sun",
    water_needs: "Moderate",
    soil_preferences: ["Sandy", "Well-Drained"],
    best_planting_seasons: ["Spring", "Summer"],
    growth_rate: "Moderate",
    care_summary: "",
    uses: [],
    benefits: [],
    companion_plants: [],
    avoid_planting_near: [],
    tags: ["food-forest", "florida"],
    data_source: "ifas",
    last_updated: today(),
    ...p,
  };
}
