import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let sql: ReturnType<typeof postgres> | null = null;

/** Supabase pooler + Vercel serverless: use DATABASE_URL with ?pgbouncer=true */
export function getSql(): ReturnType<typeof postgres> {
  if (sql) return sql;

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is required for Postgres (Supabase). Set it in .env or Vercel env vars.",
    );
  }

  sql = postgres(url, {
    ssl: url.includes("localhost") ? false : "require",
    prepare: false,
    max: 1,
    idle_timeout: 10,
    connect_timeout: 10,
    max_lifetime: 60 * 5,
  });

  return sql;
}

const PG_JSONB_ARRAY_COLUMNS = [
  "synonyms",
  "guild_functions",
  "florida_hardiness_zones",
  "native_states",
  "soil_preferences",
  "best_planting_seasons",
  "uses",
  "benefits",
  "companion_plants",
  "avoid_planting_near",
  "tags",
] as const;

/** Fix rows where JSON.stringify was stored as a jsonb string scalar instead of an array. */
export async function normalizePgJsonbArrays(): Promise<void> {
  const db = getSql();
  for (const col of PG_JSONB_ARRAY_COLUMNS) {
    await db.unsafe(`
      UPDATE plants SET ${col} = CASE
        WHEN jsonb_typeof(${col}) = 'array' THEN ${col}
        WHEN jsonb_typeof(${col}) = 'string' THEN (${col} #>> '{}')::jsonb
        ELSE '[]'::jsonb
      END
      WHERE jsonb_typeof(${col}) IS DISTINCT FROM 'array'
    `);
  }
}

export async function ensurePgSchema(): Promise<void> {
  const schemaPath = path.join(__dirname, "schema.pg.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  const db = getSql();
  await db.unsafe(schemaSql);
}

/** Longer timeouts for bulk migration (Supabase direct connection recommended). */
export async function configurePgMigrationSession(): Promise<void> {
  const db = getSql();
  await db.unsafe(`SET statement_timeout = '300s'`);
  await db.unsafe(`SET lock_timeout = '120s'`);
}

export async function countPgPlants(): Promise<number> {
  const db = getSql();
  const rows = await db<{ c: number }[]>`
    SELECT COUNT(*)::int AS c FROM plants
  `;
  return Number(rows[0]?.c ?? 0);
}

export async function closeSql(): Promise<void> {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
}
