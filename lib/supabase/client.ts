"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

export type BrowserSupabaseClient = SupabaseClient<Database>;

let cached: BrowserSupabaseClient | null = null;

/**
 * Returns the singleton browser client.
 *
 * Initialisation is lazy on purpose: calling this from an event handler or an
 * effect (rather than at module/render time) means a project that has not been
 * configured yet fails with a readable message instead of breaking the build.
 */
export function getSupabaseBrowserClient(): BrowserSupabaseClient {
  if (cached) return cached;

  cached = createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });

  return cached;
}
