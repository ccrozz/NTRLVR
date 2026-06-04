import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getServiceRoleKey,
  getSupabaseUrl,
  hasSupabaseServiceRole,
} from "./supabase-config.js";

let admin: SupabaseClient | null = null;

/** Server-side client (bypasses RLS). Requires SUPABASE_SERVICE_ROLE_KEY. */
export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  if (!hasSupabaseServiceRole()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required. Add it from Supabase → Project Settings → API.",
    );
  }
  admin = createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return admin;
}

export async function countPlantsViaSupabaseAdmin(): Promise<number> {
  const client = getSupabaseAdmin();
  const { count, error } = await client
    .from("plants")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}
