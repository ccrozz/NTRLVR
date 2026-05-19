import type {
  CanopyLayer,
  GuildFunction,
  Plant,
  PlantCategory,
  PlantFilters,
  PlantSummary,
} from "../schema.js";
import { stateByCode } from "../lib/us-states.js";
import { getDb } from "./client.js";

type PlantRow = {
  id: string;
  common_name: string;
  scientific_name: string;
  image_url: string | null;
  trefle_id: number;
  trefle_slug: string;
  family: string | null;
  genus: string | null;
  edible_part: string | null;
  vegetable: number;
  observations: string | null;
  synonyms: string;
  trefle_json: string | null;
  category: PlantCategory;
  canopy_layer: CanopyLayer;
  guild_functions: string;
  is_florida_native: number;
  is_kitchen_essential: number;
  is_edible: number;
  florida_hardiness_zones: string;
  native_states: string;
  grows_in_us: number;
  is_invasive_in_florida: number;
  mature_height_min: number;
  mature_height_max: number;
  mature_spread_min: number;
  mature_spread_max: number;
  canvas_radius_feet: number;
  sunlight: Plant["sunlight"];
  water_needs: Plant["water_needs"];
  soil_preferences: string;
  best_planting_seasons: string;
  growth_rate: Plant["growth_rate"];
  care_summary: string;
  uses: string;
  benefits: string;
  companion_plants: string;
  avoid_planting_near: string;
  tags: string;
  data_source: Plant["data_source"];
  last_updated: string;
};

function parseJsonArray<T>(value: string): T[] {
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
}

export function rowToPlant(row: PlantRow): Plant {
  return {
    id: row.id,
    common_name: row.common_name,
    scientific_name: row.scientific_name,
    image_url: row.image_url,
    trefle_id: row.trefle_id ?? 0,
    trefle_slug: row.trefle_slug ?? row.id,
    family: row.family,
    genus: row.genus,
    edible_part: row.edible_part,
    vegetable: row.vegetable === 1,
    observations: row.observations,
    synonyms: parseJsonArray<string>(row.synonyms ?? "[]"),
    trefle_json: row.trefle_json,
    category: row.category,
    canopy_layer: row.canopy_layer,
    guild_functions: parseJsonArray<GuildFunction>(row.guild_functions),
    is_florida_native: row.is_florida_native === 1,
    is_kitchen_essential: row.is_kitchen_essential === 1,
    is_edible: row.is_edible === 1,
    florida_hardiness_zones: parseJsonArray<string>(
      row.florida_hardiness_zones,
    ),
    native_states: parseJsonArray<string>(row.native_states ?? "[]"),
    grows_in_us: (row.grows_in_us ?? 0) === 1,
    is_invasive_in_florida: row.is_invasive_in_florida === 1,
    mature_height_feet: [row.mature_height_min, row.mature_height_max],
    mature_spread_feet: [row.mature_spread_min, row.mature_spread_max],
    canvas_radius_feet: row.canvas_radius_feet,
    sunlight: row.sunlight,
    water_needs: row.water_needs,
    soil_preferences: parseJsonArray(row.soil_preferences),
    best_planting_seasons: parseJsonArray(row.best_planting_seasons),
    growth_rate: row.growth_rate,
    care_summary: row.care_summary,
    uses: parseJsonArray(row.uses),
    benefits: parseJsonArray(row.benefits),
    companion_plants: parseJsonArray(row.companion_plants),
    avoid_planting_near: parseJsonArray(row.avoid_planting_near),
    tags: parseJsonArray(row.tags),
    data_source: row.data_source,
    last_updated: row.last_updated,
  };
}

export function plantToSummary(plant: Plant): PlantSummary & {
  is_invasive_in_florida: boolean;
} {
  return {
    id: plant.id,
    common_name: plant.common_name,
    scientific_name: plant.scientific_name,
    category: plant.category,
    canopy_layer: plant.canopy_layer,
    is_florida_native: plant.is_florida_native,
    is_kitchen_essential: plant.is_kitchen_essential,
    is_edible: plant.is_edible,
    native_states: plant.native_states,
    growing_zones: plant.florida_hardiness_zones,
    canvas_radius_feet: plant.canvas_radius_feet,
    image_url: plant.image_url,
    tags: plant.tags,
    is_invasive_in_florida: plant.is_invasive_in_florida,
    data_source: plant.data_source,
  };
}

const UPSERT_PLANT = `
INSERT INTO plants (
  id, common_name, scientific_name, image_url,
  trefle_id, trefle_slug, family, genus, edible_part, vegetable, observations, synonyms, trefle_json,
  category, canopy_layer, guild_functions,
  is_florida_native, is_kitchen_essential, is_edible, florida_hardiness_zones, native_states, grows_in_us, is_invasive_in_florida,
  mature_height_min, mature_height_max, mature_spread_min, mature_spread_max, canvas_radius_feet,
  sunlight, water_needs, soil_preferences, best_planting_seasons, growth_rate,
  care_summary, uses, benefits, companion_plants, avoid_planting_near,
  tags, data_source, last_updated
) VALUES (
  @id, @common_name, @scientific_name, @image_url,
  @trefle_id, @trefle_slug, @family, @genus, @edible_part, @vegetable, @observations, @synonyms, @trefle_json,
  @category, @canopy_layer, @guild_functions,
  @is_florida_native, @is_kitchen_essential, @is_edible, @florida_hardiness_zones, @native_states, @grows_in_us, @is_invasive_in_florida,
  @mature_height_min, @mature_height_max, @mature_spread_min, @mature_spread_max, @canvas_radius_feet,
  @sunlight, @water_needs, @soil_preferences, @best_planting_seasons, @growth_rate,
  @care_summary, @uses, @benefits, @companion_plants, @avoid_planting_near,
  @tags, @data_source, @last_updated
)
ON CONFLICT(id) DO UPDATE SET
  common_name = excluded.common_name,
  scientific_name = excluded.scientific_name,
  image_url = COALESCE(NULLIF(trim(excluded.image_url), ''), plants.image_url),
  trefle_id = excluded.trefle_id,
  trefle_slug = excluded.trefle_slug,
  family = excluded.family,
  genus = excluded.genus,
  edible_part = excluded.edible_part,
  vegetable = excluded.vegetable,
  observations = excluded.observations,
  synonyms = excluded.synonyms,
  trefle_json = COALESCE(excluded.trefle_json, plants.trefle_json),
  category = excluded.category,
  canopy_layer = excluded.canopy_layer,
  guild_functions = excluded.guild_functions,
  is_florida_native = excluded.is_florida_native,
  is_kitchen_essential = excluded.is_kitchen_essential,
  is_edible = excluded.is_edible,
  florida_hardiness_zones = excluded.florida_hardiness_zones,
  native_states = excluded.native_states,
  grows_in_us = excluded.grows_in_us,
  is_invasive_in_florida = excluded.is_invasive_in_florida,
  mature_height_min = excluded.mature_height_min,
  mature_height_max = excluded.mature_height_max,
  mature_spread_min = excluded.mature_spread_min,
  mature_spread_max = excluded.mature_spread_max,
  canvas_radius_feet = excluded.canvas_radius_feet,
  sunlight = excluded.sunlight,
  water_needs = excluded.water_needs,
  soil_preferences = excluded.soil_preferences,
  best_planting_seasons = excluded.best_planting_seasons,
  growth_rate = excluded.growth_rate,
  care_summary = excluded.care_summary,
  uses = excluded.uses,
  benefits = excluded.benefits,
  companion_plants = excluded.companion_plants,
  avoid_planting_near = excluded.avoid_planting_near,
  tags = excluded.tags,
  data_source = excluded.data_source,
  last_updated = excluded.last_updated
`;

export function plantToRow(plant: Plant) {
  return {
    id: plant.id,
    common_name: plant.common_name,
    scientific_name: plant.scientific_name,
    image_url: plant.image_url ?? null,
    trefle_id: plant.trefle_id ?? 0,
    trefle_slug: plant.trefle_slug ?? plant.id.replace(/^trefle-/, ""),
    family: plant.family,
    genus: plant.genus,
    edible_part: plant.edible_part,
    vegetable: plant.vegetable ? 1 : 0,
    observations: plant.observations,
    synonyms: JSON.stringify(plant.synonyms ?? []),
    trefle_json: plant.trefle_json,
    category: plant.category,
    canopy_layer: plant.canopy_layer,
    guild_functions: JSON.stringify(plant.guild_functions ?? []),
    is_florida_native: plant.is_florida_native ? 1 : 0,
    is_kitchen_essential: plant.is_kitchen_essential ? 1 : 0,
    is_edible: plant.is_edible ? 1 : 0,
    florida_hardiness_zones: JSON.stringify(
      plant.florida_hardiness_zones ?? [],
    ),
    native_states: JSON.stringify(plant.native_states ?? []),
    grows_in_us: plant.grows_in_us ? 1 : 0,
    is_invasive_in_florida: plant.is_invasive_in_florida ? 1 : 0,
    mature_height_min: plant.mature_height_feet?.[0] ?? 4,
    mature_height_max: plant.mature_height_feet?.[1] ?? 10,
    mature_spread_min: plant.mature_spread_feet?.[0] ?? 2,
    mature_spread_max: plant.mature_spread_feet?.[1] ?? 6,
    canvas_radius_feet: plant.canvas_radius_feet ?? 2,
    sunlight: plant.sunlight ?? "Adaptable",
    water_needs: plant.water_needs ?? "Moderate",
    soil_preferences: JSON.stringify(plant.soil_preferences ?? ["Any"]),
    best_planting_seasons: JSON.stringify(
      plant.best_planting_seasons ?? ["Year-Round"],
    ),
    growth_rate: plant.growth_rate ?? "Moderate",
    care_summary: plant.care_summary ?? "",
    uses: JSON.stringify(plant.uses ?? []),
    benefits: JSON.stringify(plant.benefits ?? []),
    companion_plants: JSON.stringify(plant.companion_plants ?? []),
    avoid_planting_near: JSON.stringify(plant.avoid_planting_near ?? []),
    tags: JSON.stringify(plant.tags ?? []),
    data_source: plant.data_source ?? "trefle",
    last_updated: plant.last_updated ?? new Date().toISOString().slice(0, 10),
  };
}

function mergeGrowingZones(existing: string[], incoming: string[]): string[] {
  return [...new Set([...existing, ...incoming])].sort();
}

export function upsertPlant(plant: Plant): void {
  const existing = getPlantById(plant.id);
  if (existing?.florida_hardiness_zones.length) {
    plant = {
      ...plant,
      florida_hardiness_zones: mergeGrowingZones(
        existing.florida_hardiness_zones,
        plant.florida_hardiness_zones,
      ),
    };
  }
  if (existing?.native_states.length && !plant.native_states.length) {
    plant = { ...plant, native_states: existing.native_states };
  }
  if (existing?.trefle_json && !plant.trefle_json) {
    plant = { ...plant, trefle_json: existing.trefle_json };
  }
  const stmt = getDb().prepare(UPSERT_PLANT);
  stmt.run(plantToRow(plant));
}

export function listGrowingZoneCounts(): { zone: string; count: number }[] {
  const rows = getDb()
    .prepare(
      `
    SELECT je.value AS zone, COUNT(DISTINCT p.id) AS count
    FROM plants p
    INNER JOIN json_each(p.florida_hardiness_zones) AS je
    WHERE je.value != ''
    GROUP BY je.value
    ORDER BY je.value
  `,
    )
    .all() as { zone: string; count: number }[];
  return rows;
}

export function getPlantById(id: string): Plant | null {
  const row = getDb()
    .prepare("SELECT * FROM plants WHERE id = ?")
    .get(id) as PlantRow | undefined;
  return row ? rowToPlant(row) : null;
}

export function getPlantByTrefleSlug(slug: string): Plant | null {
  const row = getDb()
    .prepare("SELECT * FROM plants WHERE trefle_slug = ?")
    .get(slug) as PlantRow | undefined;
  return row ? rowToPlant(row) : null;
}

export function listPlants(filters: PlantFilters = {}): {
  data: Plant[];
  total: number;
} {
  const conditions: string[] = [];
  const params: Record<string, string | number> = {};

  const usOnly = filters.us_only !== false && !filters.for_my_area;
  if (usOnly) {
    conditions.push("grows_in_us = 1");
  }

  if (filters.for_my_area && filters.native_state) {
    const st = filters.native_state.toUpperCase();
    const state = stateByCode(st);
    if (state?.hardiness_zones.length) {
      const zoneParts: string[] = [];
      state.hardiness_zones.forEach((z, i) => {
        params[`stz_${i}`] = z;
        zoneParts.push(
          `EXISTS (SELECT 1 FROM json_each(florida_hardiness_zones) WHERE LOWER(value) = LOWER(@stz_${i}))`,
        );
      });
      const wholeNums = [
        ...new Set(
          state.hardiness_zones.map((z) => z.replace(/[ab]$/i, "")),
        ),
      ];
      wholeNums.forEach((n, i) => {
        params[`stzg_${i}`] = `${n}[ab]`;
        zoneParts.push(
          `EXISTS (SELECT 1 FROM json_each(florida_hardiness_zones) WHERE value GLOB @stzg_${i})`,
        );
      });
      const zoneClause = zoneParts.join(" OR ");
      conditions.push(
        `(
          (${zoneClause})
          OR EXISTS (SELECT 1 FROM json_each(native_states) WHERE UPPER(value) = UPPER(@for_my_area_state))
          OR (
            UPPER(@for_my_area_state) = 'FL'
            AND is_florida_native = 1
            AND (native_states IS NULL OR native_states = '[]')
          )
        )`,
      );
      params.for_my_area_state = st;
    }
  }

  if (filters.search) {
    conditions.push(
      `(LOWER(common_name) LIKE @search OR LOWER(scientific_name) LIKE @search OR LOWER(family) LIKE @search OR LOWER(genus) LIKE @search OR EXISTS (
        SELECT 1 FROM json_each(tags) WHERE LOWER(value) LIKE @search
      ))`,
    );
    params.search = `%${filters.search.toLowerCase()}%`;
  }

  if (filters.category) {
    const categories = Array.isArray(filters.category)
      ? filters.category
      : [filters.category];
    const placeholders = categories.map((_, i) => `@category_${i}`).join(", ");
    conditions.push(`category IN (${placeholders})`);
    categories.forEach((c, i) => {
      params[`category_${i}`] = c;
    });
  }

  if (filters.canopy_layer) {
    const layers = Array.isArray(filters.canopy_layer)
      ? filters.canopy_layer
      : [filters.canopy_layer];
    const placeholders = layers.map((_, i) => `@canopy_${i}`).join(", ");
    conditions.push(`canopy_layer IN (${placeholders})`);
    layers.forEach((l, i) => {
      params[`canopy_${i}`] = l;
    });
  }

  if (filters.florida_native_only) {
    conditions.push("is_florida_native = 1");
  }

  if (filters.native_to_state_only && filters.native_state) {
    const st = filters.native_state.toUpperCase();
    conditions.push(
      `(
        EXISTS (SELECT 1 FROM json_each(native_states) WHERE UPPER(value) = UPPER(@native_state))
        OR (
          UPPER(@native_state) = 'FL'
          AND is_florida_native = 1
          AND (native_states IS NULL OR native_states = '[]')
        )
      )`,
    );
    params.native_state = st;
  }

  if (filters.kitchen_essentials_only) {
    conditions.push("is_kitchen_essential = 1");
  }

  if (filters.edible_only) {
    conditions.push("is_edible = 1");
  }

  if (filters.exclude_invasive) {
    conditions.push("is_invasive_in_florida = 0");
  }

  if (filters.hardiness_zone) {
    const z = filters.hardiness_zone.trim();
    if (/^\d+[ab]$/i.test(z)) {
      conditions.push(
        `EXISTS (SELECT 1 FROM json_each(florida_hardiness_zones) WHERE LOWER(value) = LOWER(@hardiness_zone))`,
      );
      params.hardiness_zone = z;
    } else if (/^\d+$/.test(z)) {
      conditions.push(
        `EXISTS (SELECT 1 FROM json_each(florida_hardiness_zones) WHERE value GLOB @hz_glob)`,
      );
      params.hz_glob = `${z}[ab]`;
    } else {
      conditions.push(
        `EXISTS (SELECT 1 FROM json_each(florida_hardiness_zones) WHERE LOWER(value) = LOWER(@hardiness_zone))`,
      );
      params.hardiness_zone = z;
    }
  }

  if (filters.guild_function) {
    conditions.push(
      `EXISTS (SELECT 1 FROM json_each(guild_functions) WHERE value = @guild_function)`,
    );
    params.guild_function = filters.guild_function;
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = getDb()
    .prepare(`SELECT COUNT(*) AS total FROM plants ${where}`)
    .get(params) as { total: number };

  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  const rows = getDb()
    .prepare(
      `SELECT * FROM plants ${where} ORDER BY common_name ASC LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit, offset }) as PlantRow[];

  return {
    data: rows.map(rowToPlant),
    total: countRow.total,
  };
}

export function countPlants(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS total FROM plants")
    .get() as { total: number };
  return row.total;
}
