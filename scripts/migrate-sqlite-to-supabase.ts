/**
 * One-time migration: local SQLite → Supabase Postgres.
 *
 *   1. Create a Supabase project and run db/schema.pg.sql in the SQL editor
 *   2. Set DATABASE_URL in .env (Session pooler URI, port 6543, ?pgbouncer=true)
 *   3. npx tsx scripts/migrate-sqlite-to-supabase.ts
 *
 * Uses local data/naturelover.db unless DATABASE_PATH is set.
 * Does not delete SQLite data.
 */
import { loadEnv } from "../lib/load-env.js";
import { getDb, DB_PATH, closeDb } from "../db/client.js";
import { ensurePgSchema, closeSql } from "../db/postgres.js";
import { rowToPlant } from "../db/plant-row.js";
import { upsertPlant } from "../db/plant-repository-pg.js";
import type { PlantRow } from "../db/plant-row.js";

loadEnv();

const BATCH = 200;

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Set DATABASE_URL to your Supabase Postgres connection string.");
    process.exit(1);
  }

  console.log(`Source SQLite: ${DB_PATH}`);
  console.log("Ensuring Postgres schema…");
  await ensurePgSchema();

  const db = getDb();
  const total = (
    db.prepare("SELECT COUNT(*) AS c FROM plants").get() as { c: number }
  ).c;
  console.log(`Migrating ${total} plants…`);

  let offset = 0;
  let done = 0;

  while (offset < total) {
    const rows = db
      .prepare(
        `SELECT * FROM plants ORDER BY id ASC LIMIT ${BATCH} OFFSET ${offset}`,
      )
      .all() as PlantRow[];

    for (const row of rows) {
      const plant = rowToPlant(row);
      await upsertPlant(plant);
      done += 1;
    }

    offset += BATCH;
    console.log(`  ${done} / ${total}`);
  }

  closeDb();
  await closeSql();
  console.log(`Done. ${done} plants upserted to Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
