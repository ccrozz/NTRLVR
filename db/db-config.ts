import { hasDatabaseUrl } from "./supabase-config.js";

export function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}

/** On Vercel, only Postgres — never SQLite (native module hangs serverless). */
export function usePostgres(): boolean {
  if (isVercelRuntime()) return hasDatabaseUrl();
  return hasDatabaseUrl();
}

export function dbBackend(): "postgres" | "sqlite" | "unconfigured" {
  if (isVercelRuntime() && !hasDatabaseUrl()) return "unconfigured";
  return usePostgres() ? "postgres" : "sqlite";
}

export function assertDatabaseConfigured(): void {
  if (isVercelRuntime() && !hasDatabaseUrl()) {
    throw new Error(
      "DATABASE_URL is not set on Vercel. Add your Supabase pooler URI (port 6543, ?pgbouncer=true) in Project → Settings → Environment Variables.",
    );
  }
}
