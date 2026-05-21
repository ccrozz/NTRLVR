/**
 * Plant DB access — SQLite locally, Postgres (Supabase) when DATABASE_URL is set.
 */
import { usePostgres } from "./db-config.js";

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
import * as sqlite from "./plant-repository-sqlite.js";
import * as pg from "./plant-repository-pg.js";

export async function countPlants(): Promise<number> {
  return usePostgres() ? pg.countPlants() : Promise.resolve(sqlite.countPlants());
}

export async function getPlantById(id: string): Promise<Plant | null> {
  return usePostgres() ? pg.getPlantById(id) : Promise.resolve(sqlite.getPlantById(id));
}

export async function getPlantByTrefleSlug(slug: string): Promise<Plant | null> {
  return usePostgres()
    ? pg.getPlantByTrefleSlug(slug)
    : Promise.resolve(sqlite.getPlantByTrefleSlug(slug));
}

export async function listPlants(filters: PlantFilters = {}): Promise<{
  data: Plant[];
  total: number;
}> {
  return usePostgres()
    ? pg.listPlants(filters)
    : Promise.resolve(sqlite.listPlants(filters));
}

export async function listGrowingZoneCounts(): Promise<
  { zone: string; count: number }[]
> {
  return usePostgres()
    ? pg.listGrowingZoneCounts()
    : Promise.resolve(sqlite.listGrowingZoneCounts());
}

export async function upsertPlant(plant: Plant): Promise<void> {
  if (usePostgres()) {
    await pg.upsertPlant(plant);
  } else {
    sqlite.upsertPlant(plant);
  }
}
