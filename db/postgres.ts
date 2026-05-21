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
    max: 3,
    idle_timeout: 20,
    connect_timeout: 30,
  });

  return sql;
}

export async function ensurePgSchema(): Promise<void> {
  const schemaPath = path.join(__dirname, "schema.pg.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  const db = getSql();
  await db.unsafe(schemaSql);
}

export async function closeSql(): Promise<void> {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
}
