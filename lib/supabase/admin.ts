import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

/**
 * Privileged Supabase client that bypasses Row Level Security.
 *
 * Used for the small number of operations that genuinely require
 * administrative Auth API access — creating staff accounts, resetting their
 * passwords and deleting them. Every caller MUST verify that the requester is
 * an admin before using this client (see `requireAdmin()` in
 * `lib/services/auth-service.ts`).
 *
 * The `server-only` import above makes it a build error to pull this module
 * into a client bundle, so the service-role key can never reach the browser.
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
