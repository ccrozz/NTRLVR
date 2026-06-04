/**
 * Plant DB access — SQLite locally, Postgres (Supabase) when DATABASE_URL / POSTGRES_URL is set.
 */
import {
  assertDatabaseConfigured,
  isVercelRuntime,
  usePostgres,
} from "./db-config.js";

export {
  rowToPlant,
  plantToSummary,
  plantToRow,
  plantToSqliteRow,
  mergeTrefleIntoCatalogRow,
  catalogTrefleSlug,
  type PlantRow,
} from "./plant-row.js";

export { usePostgres, dbBackend } from "./db-config.js";

import type { Plant, PlantFilters } from "../schema.js";
import * as pg from "./plant-repository-pg.js";

type SqliteRepo = typeof import("./plant-repository-sqlite.js");

let sqliteRepo: SqliteRepo | null = null;

async function sqlite(): Promise<SqliteRepo> {
  if (isVercelRuntime()) {
    assertDatabaseConfigured();
    throw new Error("SQLite is not available on Vercel");
  }
  if (!sqliteRepo) {
    sqliteRepo = await import("./plant-repository-sqlite.js");
  }
  return sqliteRepo;
}

export async function countPlants(): Promise<number> {
  assertDatabaseConfigured();
  return usePostgres() ? pg.countPlants() : (await sqlite()).countPlants();
}

export type PlantCountBreakdown = pg.PlantCountBreakdown;

export async function countPlantsBreakdown(): Promise<PlantCountBreakdown> {
  assertDatabaseConfigured();
  return usePostgres()
    ? pg.countPlantsBreakdown()
    : (await sqlite()).countPlantsBreakdown();
}

export async function getPlantById(id: string): Promise<Plant | null> {
  return usePostgres() ? pg.getPlantById(id) : (await sqlite()).getPlantById(id);
}

export async function getPlantsByIds(ids: string[]): Promise<Plant[]> {
  return usePostgres()
    ? pg.getPlantsByIds(ids)
    : (await sqlite()).getPlantsByIds(ids);
}

export async function getPlantByTrefleSlug(slug: string): Promise<Plant | null> {
  return usePostgres()
    ? pg.getPlantByTrefleSlug(slug)
    : (await sqlite()).getPlantByTrefleSlug(slug);
}

export async function listPlants(filters: PlantFilters = {}): Promise<{
  data: Plant[];
  total: number;
}> {
  assertDatabaseConfigured();
  return usePostgres()
    ? pg.listPlants(filters)
    : (await sqlite()).listPlants(filters);
}

export async function listGrowingZoneCounts(): Promise<
  { zone: string; count: number }[]
> {
  return usePostgres()
    ? pg.listGrowingZoneCounts()
    : (await sqlite()).listGrowingZoneCounts();
}

export async function upsertPlant(plant: Plant): Promise<void> {
  if (usePostgres()) {
    await pg.upsertPlant(plant);
  } else {
    (await sqlite()).upsertPlant(plant);
  }
}
