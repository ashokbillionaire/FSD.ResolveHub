/**
 * Supabase configuration, read from the environment.
 *
 * Two variables are required for the app to function:
 *
 *   NEXT_PUBLIC_SUPABASE_URL        — Project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY   — "anon" / publishable key (safe in the browser,
 *                                     because Row Level Security protects the data)
 *
 * One is optional and SERVER-ONLY:
 *
 *   SUPABASE_SERVICE_ROLE_KEY       — required only by the "create staff account"
 *                                     admin action. Never prefix it with
 *                                     NEXT_PUBLIC_ and never import it into a
 *                                     client component.
 */

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

const SETUP_HINT =
  "Create a .env.local file in the project root (copy .env.local.example) and " +
  "fill in the values from your Supabase project's Settings → API page, then " +
  "restart the dev server.";

export function getSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!value) {
    throw new SupabaseConfigError(
      `Missing NEXT_PUBLIC_SUPABASE_URL. ${SETUP_HINT}`,
    );
  }
  return value;
}

export function getSupabaseAnonKey(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!value) {
    throw new SupabaseConfigError(
      `Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. ${SETUP_HINT}`,
    );
  }
  return value;
}

export function getSupabaseServiceRoleKey(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!value) {
    throw new SupabaseConfigError(
      "Missing SUPABASE_SERVICE_ROLE_KEY. This server-only key is required to " +
        "create staff accounts. Add it to .env.local (never with a NEXT_PUBLIC_ " +
        "prefix) and restart the server.",
    );
  }
  return value;
}

/**
 * True when the public Supabase variables are present. Used to render a
 * friendly setup screen instead of a raw crash when the project has not been
 * configured yet.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export const SUPABASE_SETUP_HINT = SETUP_HINT;
