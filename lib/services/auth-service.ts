import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseConfigError } from "@/lib/env";
import type { ProfileRow, UserRole } from "@/types/database";

/** Thrown when a server action is invoked without sufficient privileges. */
export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * The authenticated Supabase user for this request, or null.
 * Uses getUser() so the JWT is verified with Supabase Auth on every call.
 *
 * When the project has not been configured yet this returns null instead of
 * throwing, so protected routes redirect to /login (which explains what to do)
 * rather than crashing with a 500.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch (error) {
    if (error instanceof SupabaseConfigError) return null;
    throw error;
  }
}

/**
 * The application profile (including `role`) for the current user.
 * Memoised per request with React's cache().
 */
export const getUserProfile = cache(
  async (userId?: string): Promise<ProfileRow | null> => {
    const id = userId ?? (await getCurrentUser())?.id;
    if (!id) return null;

    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch (error) {
      if (error instanceof SupabaseConfigError) return null;
      throw error;
    }
  },
);

/** Redirects to /login when there is no session. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects to /login (or /dashboard) when there is no session / profile. */
export async function requireProfile(): Promise<ProfileRow> {
  await requireUser();
  const profile = await getUserProfile();
  if (!profile) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Your profile could not be loaded. Please sign in again or contact an administrator.",
        ),
    );
  }
  return profile;
}

/** Page-level guard: admin only. */
export async function requireAdminProfile(): Promise<ProfileRow> {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    redirect(
      "/dashboard?error=" +
        encodeURIComponent(
          "You do not have permission to access the administration area.",
        ),
    );
  }
  return profile;
}

/** Action-level guard: throws instead of redirecting. */
export async function requireAdmin(): Promise<ProfileRow> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("You must be signed in.");

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== "admin" || !profile.is_active) {
    throw new AuthorizationError(
      "Administrator privileges are required for this action.",
    );
  }
  return profile;
}

/** Action-level guard: admin or staff. */
export async function requireStaffOrAdmin(): Promise<ProfileRow> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("You must be signed in.");

  const profile = await getUserProfile(user.id);
  if (!profile || !["admin", "staff"].includes(profile.role) || !profile.is_active) {
    throw new AuthorizationError(
      "Only administrators and staff members can perform this action.",
    );
  }
  return profile;
}

/** Action-level guard: any authenticated user. */
export async function requireAuthenticatedUser(): Promise<{
  userId: string;
  profile: ProfileRow;
}> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("You must be signed in.");

  const profile = await getUserProfile(user.id);
  if (!profile) {
    throw new AuthorizationError(
      "Your profile could not be loaded. Please sign in again.",
    );
  }
  return { userId: user.id, profile };
}

export function isRole(profile: ProfileRow | null, role: UserRole): boolean {
  return profile?.role === role;
}

/** Where a user should land after signing in. */
export function landingPathForRole(role: UserRole | undefined): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "staff":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}
