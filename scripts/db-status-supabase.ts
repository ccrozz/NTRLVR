/**
 * Quick Supabase plant DB status.
 *
 *   npm run db:status:supabase
 */
import { loadEnv } from "../lib/load-env.js";
import { closeSql, countPgPlants, getSql } from "../db/postgres.js";

loadEnv();

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const sql = getSql();
  const total = await countPgPlants();

  const scalarRows = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM plants
    WHERE jsonb_typeof(florida_hardiness_zones) IS DISTINCT FROM 'array'
       OR jsonb_typeof(native_states) IS DISTINCT FROM 'array'
  `;
  const scalars = Number(scalarRows[0]?.n ?? 0);

  console.log(
    JSON.stringify(
      {
        total,
        bad_jsonb_rows: scalars,
        needs_json_fix: scalars > 0,
      },
      null,
      2,
    ),
  );

  await closeSql();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
