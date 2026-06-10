import type { Plant, PlantFilters } from "../schema.js";
import { pgCatalogEdibleClause } from "../lib/infer-is-edible.js";
import { stateByCode } from "../lib/us-states.js";
import { isDesignerStateCode } from "../lib/designer-states.js";
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
  is_florida_native, is_kitchen_essential, is_edible, florida_hardiness_zones, native_states, native_origin, grows_in_us, is_invasive_in_florida,
  mature_height_min, mature_height_max, mature_spread_min, mature_spread_max, canvas_radius_feet,
  sunlight, water_needs, soil_preferences, best_planting_seasons, growth_rate,
  care_summary, uses, benefits, companion_plants, avoid_planting_near,
  tags, data_source, last_updated
) VALUES (
  $1, $2, $3, $4,
  $5, $6, $7, $8, $9, $10, $11, $12, $13,
  $14, $15, $16,
  $17, $18, $19, $20, $21, $22, $23, $24,
  $25, $26, $27, $28, $29,
  $30, $31, $32, $33, $34,
  $35, $36, $37, $38, $39,
  $40, $41, $42
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
  native_origin = COALESCE(EXCLUDED.native_origin, plants.native_origin),
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
    r.synonyms,
    r.trefle_json,
    r.category,
    r.canopy_layer,
    r.guild_functions,
    r.is_florida_native,
    r.is_kitchen_essential,
    r.is_edible,
    r.florida_hardiness_zones,
    r.native_states,
    r.native_origin,
    r.grows_in_us,
    r.is_invasive_in_florida,
    r.mature_height_min,
    r.mature_height_max,
    r.mature_spread_min,
    r.mature_spread_max,
    r.canvas_radius_feet,
    r.sunlight,
    r.water_needs,
    r.soil_preferences,
    r.best_planting_seasons,
    r.growth_rate,
    r.care_summary,
    r.uses,
    r.benefits,
    r.companion_plants,
    r.avoid_planting_near,
    r.tags,
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

/** Fast path for SQLite→Postgres migration (no per-row merge lookups). */
export async function upsertPlantsMigrationBatch(plants: Plant[]): Promise<void> {
  if (!plants.length) return;
  const sql = getSql();
  await sql.begin(async (tx) => {
    for (const plant of plants) {
      await tx.unsafe(UPSERT_PLANT, plantToPgParams(plant));
    }
  });
}

export async function listGrowingZoneCounts(): Promise<
  { zone: string; count: number }[]
> {
  const sql = getSql();
  const zonesJsonb = pgJsonbAsArray("p.florida_hardiness_zones");
  const rows = await sql.unsafe<{ zone: string; count: string }[]>(
    `SELECT z.value AS zone, COUNT(DISTINCT p.id)::int AS count
     FROM plants p
     CROSS JOIN LATERAL jsonb_array_elements_text(${zonesJsonb}) AS z(value)
     WHERE z.value != ''
     GROUP BY z.value
     ORDER BY z.value`,
  );
  return rows.map((r) => ({ zone: r.zone, count: Number(r.count) }));
}

export async function getPlantById(id: string): Promise<Plant | null> {
  const rows = await getPlantsByIds([id]);
  return rows[0] ?? null;
}

export async function getPlantsByIds(ids: string[]): Promise<Plant[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return [];
  const sql = getSql();
  const rows = await sql<PlantRow[]>`
    SELECT * FROM plants WHERE id IN ${sql(unique)}
  `;
  const byId = new Map(rows.map((r) => [r.id, rowToPlant(r)]));
  return unique.map((id) => byId.get(id)).filter((p): p is Plant => p != null);
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

function pgJsonbAsArray(column: string): string {
  return `CASE
    WHEN jsonb_typeof(${column}) = 'array' THEN ${column}
    WHEN jsonb_typeof(${column}) = 'string' THEN (${column} #>> '{}')::jsonb
    ELSE '[]'::jsonb
  END`;
}

/** postgres.js does not bind @> $n::jsonb correctly — use element text match. */
function pgJsonbArrayHasText(column: string, paramIdx: number): string {
  const arr = pgJsonbAsArray(column);
  return `EXISTS (SELECT 1 FROM jsonb_array_elements_text(${arr}) e WHERE e.value = $${paramIdx})`;
}

function pgJsonbArrayHasState(column: string, paramIdx: number): string {
  const arr = pgJsonbAsArray(column);
  return `EXISTS (SELECT 1 FROM jsonb_array_elements_text(${arr}) e WHERE UPPER(e.value) = UPPER($${paramIdx}))`;
}

function buildListWhere(filters: PlantFilters): {
  clause: string;
  params: PgQueryParam[];
} {
  const conditions: string[] = [];
  const params: PgQueryParam[] = [];
  let n = 0;

  const usOnly = filters.us_only !== false && !filters.for_my_area;
  if (usOnly) {
    conditions.push("(grows_in_us = true OR data_source = 'trefle')");
  }

  if (filters.for_my_area && filters.native_state) {
    const st = filters.native_state.toUpperCase();
    const state = stateByCode(st);
    if (state?.hardiness_zones.length) {
      const zoneParts: string[] = [];
      const zonesJson = pgJsonbAsArray("florida_hardiness_zones");
      for (const z of state.hardiness_zones) {
        n += 1;
        zoneParts.push(
          `EXISTS (SELECT 1 FROM jsonb_array_elements_text(${zonesJson}) z WHERE z.value = $${n})`,
        );
        params.push(z);
      }
      n += 1;
      const stateParam = n;
      params.push(st);
      const tag = st.toLowerCase();
      n += 1;
      const tagParam = n;
      params.push(tag);
      const tagMatch = `EXISTS (SELECT 1 FROM jsonb_array_elements_text(${pgJsonbAsArray("tags")}) t WHERE LOWER(t.value) = LOWER($${tagParam}))`;
      const idPrefix =
        isDesignerStateCode(st) ? `OR id LIKE '${tag}-%'` : "";
      conditions.push(
        `(
          (${zoneParts.join(" OR ")})
          OR ${pgJsonbArrayHasState("native_states", stateParam)}
          OR (
            $${stateParam} = 'FL'
            AND is_florida_native = true
            AND (
              native_states IS NULL
              OR native_states = '[]'::jsonb
              OR jsonb_array_length(${pgJsonbAsArray("native_states")}) = 0
            )
          )
          OR ${tagMatch}
          ${idPrefix}
        )`,
      );
    }
  }

  if (filters.search) {
    n += 1;
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      `(LOWER(common_name) LIKE $${n} OR LOWER(scientific_name) LIKE $${n} OR LOWER(COALESCE(family, '')) LIKE $${n} OR LOWER(COALESCE(genus, '')) LIKE $${n} OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(${pgJsonbAsArray("tags")}) t WHERE LOWER(t.value) LIKE $${n}
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
        ${pgJsonbArrayHasState("native_states", n)}
        OR (
          $${n} = 'FL'
          AND is_florida_native = true
          AND (
            native_states IS NULL
            OR native_states = '[]'::jsonb
            OR jsonb_array_length(${pgJsonbAsArray("native_states")}) = 0
          )
        )
      )`,
    );
    params.push(st);
  }

  if (filters.kitchen_essentials_only) {
    conditions.push("is_kitchen_essential = true");
  }

  if (filters.edible_only) {
    conditions.push(pgCatalogEdibleClause());
  }

  if (filters.exclude_invasive) {
    conditions.push("is_invasive_in_florida = false");
  }

  if (filters.hardiness_zone) {
    const z = filters.hardiness_zone.trim();
    if (/^\d+[ab]$/i.test(z)) {
      n += 1;
      conditions.push(pgJsonbArrayHasText("florida_hardiness_zones", n));
      params.push(z);
    } else if (/^\d+$/.test(z)) {
      n += 1;
      conditions.push(
        `EXISTS (SELECT 1 FROM jsonb_array_elements_text(${pgJsonbAsArray("florida_hardiness_zones")}) hz WHERE hz.value ~ $${n})`,
      );
      params.push(`^${z}[ab]$`);
    } else {
      n += 1;
      conditions.push(pgJsonbArrayHasText("florida_hardiness_zones", n));
      params.push(z);
    }
  }

  if (filters.guild_function) {
    n += 1;
    conditions.push(pgJsonbArrayHasText("guild_functions", n));
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

export type PlantCountBreakdown = {
  total: number;
  by_source: Record<string, number>;
};

export async function countPlantsBreakdown(): Promise<PlantCountBreakdown> {
  const sql = getSql();
  const rows = await sql<{ data_source: string; n: number }[]>`
    SELECT data_source, COUNT(*)::int AS n FROM plants GROUP BY data_source ORDER BY n DESC
  `;
  const by_source: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    by_source[row.data_source] = row.n;
    total += row.n;
  }
  return { total, by_source };
}
