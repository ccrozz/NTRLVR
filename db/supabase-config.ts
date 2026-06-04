/**
 * Supabase env: Postgres via DATABASE_URL (pooler on Vercel), admin API via service role.
 */

const DB_URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
] as const;

function withPoolerParams(url: string): string {
  if (!url.includes("pooler") && !url.includes(":6543")) return url;
  if (url.includes("pgbouncer=")) return url;
  return url.includes("?") ? `${url}&pgbouncer=true` : `${url}?pgbouncer=true`;
}

/** Transaction pooler / direct Postgres URI (not the service role JWT). */
export function getDatabaseUrl(): string {
  for (const key of DB_URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value) {
      return process.env.VERCEL ? withPoolerParams(value) : value;
    }
  }
  return "";
}

export function getServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}

/** Project API URL, e.g. https://abcdefgh.supabase.co */
export function getSupabaseUrl(): string {
  const explicit = process.env.SUPABASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const ref = inferSupabaseProjectRef(getDatabaseUrl());
  if (ref) return `https://${ref}.supabase.co`;

  throw new Error(
    "Set SUPABASE_URL or a DATABASE_URL that includes the project ref (db.<ref>.supabase.co or postgres.<ref> user).",
  );
}

export function inferSupabaseProjectRef(databaseUrl: string): string | null {
  if (!databaseUrl) return null;
  try {
    const normalized = databaseUrl.replace(/^postgresql:/i, "https:");
    const u = new URL(normalized);
    const dbHost = u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    if (dbHost) return dbHost[1];
    const poolerUser = u.username.match(/^postgres\.([a-z0-9]+)$/i);
    if (poolerUser) return poolerUser[1];
    if (u.username === "postgres" && dbHost) return dbHost[1];
  } catch {
    /* invalid URL */
  }
  return null;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(getDatabaseUrl());
}

export function hasSupabaseServiceRole(): boolean {
  return Boolean(getServiceRoleKey());
}

/** True when Postgres URL and admin credentials are available. */
export function hasFullSupabaseConfig(): boolean {
  if (!hasDatabaseUrl() || !hasSupabaseServiceRole()) return false;
  try {
    getSupabaseUrl();
    return true;
  } catch {
    return false;
  }
}
