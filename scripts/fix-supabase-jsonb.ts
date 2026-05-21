/**
 * Fix jsonb columns stored as string scalars (fixes "cannot extract elements from a scalar").
 *
 *   npm run db:fix:supabase-json
 */
import { loadEnv } from "../lib/load-env.js";
import { closeSql, normalizePgJsonbArrays } from "../db/postgres.js";

loadEnv();

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Set DATABASE_URL in .env");
    process.exit(1);
  }
  await normalizePgJsonbArrays();
  await closeSql();
  console.log("JSONB array columns normalized.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
