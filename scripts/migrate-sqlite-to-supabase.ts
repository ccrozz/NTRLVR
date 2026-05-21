/**
 * SQLite → Supabase Postgres (resumable).
 *
 *   npm run db:migrate:supabase
 *   npm run db:migrate:supabase -- --offset=5000
 *   npm run db:migrate:supabase -- --resume
 *
 * Use the **direct** DB URL (port 5432) in DATABASE_URL for bulk loads — not the
 * pooler — to avoid statement timeouts.
 */
import { loadEnv } from "../lib/load-env.js";
import { getDb, DB_PATH, closeDb } from "../db/client.js";
import {
  configurePgMigrationSession,
  countPgPlants,
  ensurePgSchema,
  normalizePgJsonbArrays,
  closeSql,
} from "../db/postgres.js";
import { rowToPlant } from "../db/plant-row.js";
import { upsertPlantsMigrationBatch } from "../db/plant-repository-pg.js";
import type { PlantRow } from "../db/plant-row.js";

loadEnv();

const BATCH = 100;

function parseOffset(argv: string[]): number {
  const resume = argv.includes("--resume");
  const offsetArg = argv.find((a) => a.startsWith("--offset="));
  if (offsetArg) {
    const n = parseInt(offsetArg.split("=")[1] ?? "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  return resume ? -1 : 0;
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Set DATABASE_URL to your Supabase Postgres connection string.");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (url.includes("pooler") || url.includes(":6543")) {
    console.warn(
      "Warning: pooler URLs often timeout on bulk migration. Prefer direct host:5432 in DATABASE_URL.",
    );
  }

  console.log(`Source SQLite: ${DB_PATH}`);
  console.log("Ensuring Postgres schema + indexes…");
  await ensurePgSchema();
  await configurePgMigrationSession();

  const existing = await countPgPlants();
  console.log(`Supabase plants already loaded: ${existing}`);

  const db = getDb();
  const total = (
    db.prepare("SELECT COUNT(*) AS c FROM plants").get() as { c: number }
  ).c;

  let offset = parseOffset(process.argv.slice(2));
  if (offset < 0) {
    offset = existing;
    console.log(`--resume: starting at offset ${offset}`);
  }
  if (offset >= total) {
    console.log("SQLite fully migrated — normalizing JSONB…");
    await normalizePgJsonbArrays();
    closeDb();
    await closeSql();
    console.log(`Done. ${await countPgPlants()} plants in Supabase.`);
    return;
  }

  console.log(`Migrating ${total - offset} plants (${offset} → ${total})…`);

  let done = offset;

  while (offset < total) {
    const rows = db
      .prepare(
        `SELECT * FROM plants ORDER BY id ASC LIMIT ${BATCH} OFFSET ${offset}`,
      )
      .all() as PlantRow[];

    const plants = rows.map((row) => rowToPlant(row));
    await upsertPlantsMigrationBatch(plants);
    done += plants.length;
    offset += BATCH;
    console.log(`  ${done} / ${total}`);
  }

  console.log("Normalizing JSONB array columns…");
  await normalizePgJsonbArrays();

  closeDb();
  const finalCount = await countPgPlants();
  await closeSql();
  console.log(`Done. ${finalCount} plants in Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
