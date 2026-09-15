import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

export type ServerSupabaseClient = SupabaseClient<Database>;

/**
 * Supabase client bound to the caller's session (anon key + session cookies).
 * Every query therefore runs through Row Level Security as that user.
 *
 * Must be created per request — never cached in a module-level variable.
 */
export async function createSupabaseServerClient(): Promise<ServerSupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. This is expected and safe:
          // middleware refreshes the session cookie on every request instead.
        }
      },
    },
  });
}
