/**
 * Plant DB inventory (Supabase Postgres or local SQLite).
 *
 *   npm run db:status:supabase
 *
 * Reads `.env` for DATABASE_URL. Without it, reports local SQLite at DATABASE_PATH.
 */
import { loadEnv } from "../lib/load-env.js";
import { closeSql, getSql } from "../db/postgres.js";
import {
  hasFullSupabaseConfig,
  hasDatabaseUrl,
} from "../db/supabase-config.js";
import { countPlantsViaSupabaseAdmin } from "../db/supabase-admin.js";
import { DB_PATH, closeDb } from "../db/client.js";
import { countPlantsBreakdown } from "../db/plant-repository.js";

loadEnv();

async function reportPostgres() {
  const sql = getSql();
  const inventory = await countPlantsBreakdown();
  let api_count: number | null = null;
  if (hasFullSupabaseConfig()) {
    api_count = await countPlantsViaSupabaseAdmin();
  }

  const scalarRows = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM plants
    WHERE jsonb_typeof(florida_hardiness_zones) IS DISTINCT FROM 'array'
       OR jsonb_typeof(native_states) IS DISTINCT FROM 'array'
  `;
  const scalars = Number(scalarRows[0]?.n ?? 0);

  console.log(
    JSON.stringify(
      {
        backend: "postgres",
        inventory,
        api_count,
        supabase_admin: hasFullSupabaseConfig(),
        bad_jsonb_rows: scalars,
        needs_json_fix: scalars > 0,
        catalog_note:
          "Browse uses /api/plants (full DB). Designer uses /api/designer/plants (curated only).",
        migrate_hint:
          inventory.by_source.trefle == null || inventory.by_source.trefle < 1000
            ? "Few Trefle rows in Supabase — run: npm run db:migrate:supabase (from SQLite with Trefle sync)"
            : undefined,
      },
      null,
      2,
    ),
  );

  await closeSql();
}

async function reportSqlite() {
  const inventory = await countPlantsBreakdown();
  console.log(
    JSON.stringify(
      {
        backend: "sqlite",
        path: DB_PATH,
        inventory,
        catalog_note:
          "Browse uses /api/plants. Set DATABASE_URL on Vercel to use this data in production.",
        migrate_hint:
          "npm run db:migrate:supabase — after DATABASE_URL is set in .env",
      },
      null,
      2,
    ),
  );
  closeDb();
}

async function main() {
  if (hasDatabaseUrl()) {
    await reportPostgres();
    return;
  }

  console.error(
    "DATABASE_URL not set — showing local SQLite only.\n" +
      "Add DATABASE_URL to .env (Supabase URI) to check production, then migrate:\n" +
      "  npm run db:migrate:supabase\n",
  );
  await reportSqlite();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
