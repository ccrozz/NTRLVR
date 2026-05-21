import type { Plant, PlantFilters } from "../schema.js";
import { stateByCode } from "../lib/us-states.js";
import { getSql } from "./postgres.js";
import {
  mergeTrefleIntoCatalogRow,
  plantToRow,
  rowToPlant,
  type PlantRow,
} from "./plant-row.js";

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
  $1, $2, $3, $4,
  $5, $6, $7, $8, $9, $10, $11, $12, $13,
  $14, $15, $16,
  $17, $18, $19, $20, $21, $22, $23,
  $24, $25, $26, $27, $28,
  $29, $30, $31, $32, $33,
  $34, $35, $36, $37, $38,
  $39, $40, $41
)
ON CONFLICT(id) DO UPDATE SET
  common_name = EXCLUDED.common_name,
  scientific_name = EXCLUDED.scientific_name,
  image_url = COALESCE(NULLIF(trim(EXCLUDED.image_url), ''), plants.image_url),
  trefle_id = CASE WHEN EXCLUDED.trefle_id != 0 THEN EXCLUDED.trefle_id ELSE plants.trefle_id END,
  trefle_slug = CASE
    WHEN EXCLUDED.trefle_id != 0 THEN EXCLUDED.trefle_slug
    WHEN plants.trefle_id != 0 THEN plants.trefle_slug
    ELSE EXCLUDED.trefle_slug
  END,
  family = EXCLUDED.family,
  genus = EXCLUDED.genus,
  edible_part = EXCLUDED.edible_part,
  vegetable = EXCLUDED.vegetable,
  observations = EXCLUDED.observations,
  synonyms = EXCLUDED.synonyms,
  trefle_json = COALESCE(EXCLUDED.trefle_json, plants.trefle_json),
  category = EXCLUDED.category,
  canopy_layer = EXCLUDED.canopy_layer,
  guild_functions = EXCLUDED.guild_functions,
  is_florida_native = EXCLUDED.is_florida_native,
  is_kitchen_essential = EXCLUDED.is_kitchen_essential,
  is_edible = EXCLUDED.is_edible,
  florida_hardiness_zones = EXCLUDED.florida_hardiness_zones,
  native_states = EXCLUDED.native_states,
  grows_in_us = EXCLUDED.grows_in_us,
  is_invasive_in_florida = EXCLUDED.is_invasive_in_florida,
  mature_height_min = EXCLUDED.mature_height_min,
  mature_height_max = EXCLUDED.mature_height_max,
  mature_spread_min = EXCLUDED.mature_spread_min,
  mature_spread_max = EXCLUDED.mature_spread_max,
  canvas_radius_feet = EXCLUDED.canvas_radius_feet,
  sunlight = EXCLUDED.sunlight,
  water_needs = EXCLUDED.water_needs,
  soil_preferences = EXCLUDED.soil_preferences,
  best_planting_seasons = EXCLUDED.best_planting_seasons,
  growth_rate = EXCLUDED.growth_rate,
  care_summary = EXCLUDED.care_summary,
  uses = EXCLUDED.uses,
  benefits = EXCLUDED.benefits,
  companion_plants = EXCLUDED.companion_plants,
  avoid_planting_near = EXCLUDED.avoid_planting_near,
  tags = EXCLUDED.tags,
  data_source = EXCLUDED.data_source,
  last_updated = EXCLUDED.last_updated
`;

function plantToPgParams(plant: Plant) {
  const r = plantToRow(plant);
  return [
    r.id,
    r.common_name,
    r.scientific_name,
    r.image_url,
    r.trefle_id,
    r.trefle_slug,
    r.family,
    r.genus,
    r.edible_part,
    r.vegetable,
    r.observations,
    JSON.stringify(r.synonyms),
    r.trefle_json,
    r.category,
    r.canopy_layer,
    JSON.stringify(r.guild_functions),
    r.is_florida_native,
    r.is_kitchen_essential,
    r.is_edible,
    JSON.stringify(r.florida_hardiness_zones),
    JSON.stringify(r.native_states),
    r.grows_in_us,
    r.is_invasive_in_florida,
    r.mature_height_min,
    r.mature_height_max,
    r.mature_spread_min,
    r.mature_spread_max,
    r.canvas_radius_feet,
    r.sunlight,
    r.water_needs,
    JSON.stringify(r.soil_preferences),
    JSON.stringify(r.best_planting_seasons),
    r.growth_rate,
    r.care_summary,
    JSON.stringify(r.uses),
    JSON.stringify(r.benefits),
    JSON.stringify(r.companion_plants),
    JSON.stringify(r.avoid_planting_near),
    JSON.stringify(r.tags),
    r.data_source,
    r.last_updated,
  ];
}

export async function upsertPlant(plant: Plant): Promise<void> {
  const incomingSlug = plant.trefle_slug?.trim();
  if (incomingSlug && plant.id.startsWith("trefle-")) {
    const bySlug = await getPlantByTrefleSlug(incomingSlug);
    if (bySlug && bySlug.id !== plant.id) {
      plant = mergeTrefleIntoCatalogRow(bySlug, plant);
    }
  }

  let existing = await getPlantById(plant.id);
  if (existing?.trefle_slug && !plant.trefle_slug) {
    plant = { ...plant, trefle_slug: existing.trefle_slug };
  }
  const preservedTrefleId = existing?.trefle_id ?? 0;
  if (preservedTrefleId > 0 && !(plant.trefle_id ?? 0)) {
    plant = { ...plant, trefle_id: preservedTrefleId };
  }
  if (existing?.florida_hardiness_zones.length) {
    plant = {
      ...plant,
      florida_hardiness_zones: [
        ...new Set([
          ...existing.florida_hardiness_zones,
          ...plant.florida_hardiness_zones,
        ]),
      ].sort(),
    };
  }
  if (existing?.native_states.length && !plant.native_states.length) {
    plant = { ...plant, native_states: existing.native_states };
  }
  if (existing?.trefle_json && !plant.trefle_json) {
    plant = { ...plant, trefle_json: existing.trefle_json };
  }

  const sql = getSql();
  await sql.unsafe(UPSERT_PLANT, plantToPgParams(plant));
}

export async function listGrowingZoneCounts(): Promise<
  { zone: string; count: number }[]
> {
  const sql = getSql();
  const rows = await sql<{ zone: string; count: string }[]>`
    SELECT z.value AS zone, COUNT(DISTINCT p.id)::int AS count
    FROM plants p
    CROSS JOIN LATERAL jsonb_array_elements_text(p.florida_hardiness_zones) AS z(value)
    WHERE z.value != ''
    GROUP BY z.value
    ORDER BY z.value
  `;
  return rows.map((r) => ({ zone: r.zone, count: Number(r.count) }));
}

export async function getPlantById(id: string): Promise<Plant | null> {
  const sql = getSql();
  const rows = await sql<PlantRow[]>`
    SELECT * FROM plants WHERE id = ${id}
  `;
  const row = rows[0];
  return row ? rowToPlant(row) : null;
}

export async function getPlantByTrefleSlug(slug: string): Promise<Plant | null> {
  const sql = getSql();
  const rows = await sql<PlantRow[]>`
    SELECT * FROM plants WHERE trefle_slug = ${slug}
  `;
  const row = rows[0];
  return row ? rowToPlant(row) : null;
}

type PgQueryParam = string | number | boolean | null;

function buildListWhere(filters: PlantFilters): {
  clause: string;
  params: PgQueryParam[];
} {
  const conditions: string[] = [];
  const params: PgQueryParam[] = [];
  let n = 0;

  const usOnly = filters.us_only !== false && !filters.for_my_area;
  if (usOnly) {
    conditions.push("grows_in_us = true");
  }

  if (filters.for_my_area && filters.native_state) {
    const st = filters.native_state.toUpperCase();
    const state = stateByCode(st);
    if (state?.hardiness_zones.length) {
      const zoneParts: string[] = [];
      for (const z of state.hardiness_zones) {
        n += 1;
        zoneParts.push(
          `EXISTS (SELECT 1 FROM jsonb_array_elements_text(florida_hardiness_zones) z WHERE LOWER(z.value) = LOWER($${n}))`,
        );
        params.push(z);
      }
      const wholeNums = [
        ...new Set(state.hardiness_zones.map((z) => z.replace(/[ab]$/i, ""))),
      ];
      for (const num of wholeNums) {
        n += 1;
        zoneParts.push(
          `EXISTS (SELECT 1 FROM jsonb_array_elements_text(florida_hardiness_zones) z WHERE z.value ~ $${n})`,
        );
        params.push(`^${num}[ab]$`);
      }
      const stParam = ++n;
      conditions.push(
        `(
          (${zoneParts.join(" OR ")})
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(native_states) ns
            WHERE UPPER(ns.value) = UPPER($${stParam})
          )
          OR (
            UPPER($${stParam}) = 'FL'
            AND is_florida_native = true
            AND (native_states IS NULL OR native_states = '[]'::jsonb)
          )
        )`,
      );
      params.push(st);
    }
  }

  if (filters.search) {
    n += 1;
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      `(LOWER(common_name) LIKE $${n} OR LOWER(scientific_name) LIKE $${n} OR LOWER(COALESCE(family, '')) LIKE $${n} OR LOWER(COALESCE(genus, '')) LIKE $${n} OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(tags) t WHERE LOWER(t.value) LIKE $${n}
      ))`,
    );
    params.push(term);
  }

  if (filters.category) {
    const categories = Array.isArray(filters.category)
      ? filters.category
      : [filters.category];
    const placeholders = categories.map(() => {
      n += 1;
      return `$${n}`;
    });
    conditions.push(`category IN (${placeholders.join(", ")})`);
    params.push(...categories);
  }

  if (filters.canopy_layer) {
    const layers = Array.isArray(filters.canopy_layer)
      ? filters.canopy_layer
      : [filters.canopy_layer];
    const placeholders = layers.map(() => {
      n += 1;
      return `$${n}`;
    });
    conditions.push(`canopy_layer IN (${placeholders.join(", ")})`);
    params.push(...layers);
  }

  if (filters.florida_native_only) {
    conditions.push("is_florida_native = true");
  }

  if (filters.native_to_state_only && filters.native_state) {
    const st = filters.native_state.toUpperCase();
    n += 1;
    conditions.push(
      `(
        EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(native_states) ns
          WHERE UPPER(ns.value) = UPPER($${n})
        )
        OR (
          UPPER($${n}) = 'FL'
          AND is_florida_native = true
          AND (native_states IS NULL OR native_states = '[]'::jsonb)
        )
      )`,
    );
    params.push(st);
  }

  if (filters.kitchen_essentials_only) {
    conditions.push("is_kitchen_essential = true");
  }

  if (filters.edible_only) {
    conditions.push("is_edible = true");
  }

  if (filters.exclude_invasive) {
    conditions.push("is_invasive_in_florida = false");
  }

  if (filters.hardiness_zone) {
    const z = filters.hardiness_zone.trim();
    if (/^\d+[ab]$/i.test(z)) {
      n += 1;
      conditions.push(
        `EXISTS (SELECT 1 FROM jsonb_array_elements_text(florida_hardiness_zones) hz WHERE LOWER(hz.value) = LOWER($${n}))`,
      );
      params.push(z);
    } else if (/^\d+$/.test(z)) {
      n += 1;
      conditions.push(
        `EXISTS (SELECT 1 FROM jsonb_array_elements_text(florida_hardiness_zones) hz WHERE hz.value ~ $${n})`,
      );
      params.push(`^${z}[ab]$`);
    } else {
      n += 1;
      conditions.push(
        `EXISTS (SELECT 1 FROM jsonb_array_elements_text(florida_hardiness_zones) hz WHERE LOWER(hz.value) = LOWER($${n}))`,
      );
      params.push(z);
    }
  }

  if (filters.guild_function) {
    n += 1;
    conditions.push(
      `EXISTS (SELECT 1 FROM jsonb_array_elements_text(guild_functions) gf WHERE gf.value = $${n})`,
    );
    params.push(filters.guild_function);
  }

  const clause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { clause, params };
}

export async function listPlants(filters: PlantFilters = {}): Promise<{
  data: Plant[];
  total: number;
}> {
  const sql = getSql();
  const { clause, params } = buildListWhere(filters);

  const countRows = await sql.unsafe(
    `SELECT COUNT(*)::int AS total FROM plants ${clause}`,
    params,
  );
  const total = Number((countRows[0] as unknown as { total: number })?.total ?? 0);

  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;
  const listParams = [...params, limit, offset];
  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;

  const rows = (await sql.unsafe(
    `SELECT * FROM plants ${clause} ORDER BY common_name ASC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    listParams,
  )) as PlantRow[];

  return {
    data: rows.map(rowToPlant),
    total,
  };
}

export async function countPlants(): Promise<number> {
  const sql = getSql();
  const rows = await sql<{ total: string }[]>`
    SELECT COUNT(*)::int AS total FROM plants
  `;
  return Number(rows[0]?.total ?? 0);
}
