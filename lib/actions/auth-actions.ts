"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { landingPathForRole } from "@/lib/services/auth-service";
import { getSupabaseUrl } from "@/lib/env";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "@/lib/validations/auth";
import type { ActionState } from "@/lib/validations/common";
import { firstErrorMessage, toFieldErrors } from "@/lib/validations/common";
import type { UserRole } from "@/types/database";

export type AuthActionState = ActionState<{
  requiresEmailConfirmation?: boolean;
  redirectTo?: string;
}>;

/** Maps Supabase Auth errors onto messages a student can act on. */
function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email address before signing in. Check your inbox for the confirmation link.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lower.includes("password") && lower.includes("least")) {
    return "Your password is too weak. Use at least 8 characters with a letter and a number.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (lower.includes("fetch") || lower.includes("network")) {
    return "Could not reach Supabase. Check your internet connection and your Supabase URL.";
  }

  return "Authentication failed. Please try again.";
}

async function resolveSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "";
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstErrorMessage(parsed.error),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      status: "error",
      message:
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the server.",
    };
  }

  const siteUrl = await resolveSiteUrl();

  // NOTE: role is deliberately not sent. The database trigger always creates
  // the profile with role = 'user'.
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: siteUrl ? `${siteUrl}/auth/callback` : undefined,
    },
  });

  if (error) {
    return { status: "error", message: friendlyAuthError(error.message) };
  }

  // Supabase returns an obfuscated user with no identities when the email is
  // already registered and email confirmation is enabled.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return {
      status: "error",
      message:
        "An account with this email already exists. Try signing in instead.",
      fieldErrors: { email: "This email address is already registered." },
    };
  }

  // No session means the project requires email confirmation.
  if (!data.session) {
    return {
      status: "success",
      message:
        "Account created. Check your email to confirm your address, then sign in.",
      data: { requiresEmailConfirmation: true, redirectTo: "/login" },
    };
  }

  return {
    status: "success",
    message: "Account created successfully. Taking you to your dashboard…",
    data: { redirectTo: "/dashboard" },
  };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstErrorMessage(parsed.error),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      status: "error",
      message:
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the server.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      status: "error",
      message: friendlyAuthError(error?.message ?? "Invalid login credentials"),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = profile?.role as UserRole | undefined;

  if (profile && profile.is_active === false && role !== "admin" && role !== "user") {
    await supabase.auth.signOut();
    return {
      status: "error",
      message:
        "Your account has been deactivated. Please contact an administrator.",
    };
  }

  const requested = formData.get("next");
  const next =
    typeof requested === "string" &&
    requested.startsWith("/") &&
    !requested.startsWith("//")
      ? requested
      : landingPathForRole(role);

  return {
    status: "success",
    message: "Signed in successfully.",
    data: { redirectTo: next },
  };
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export async function updateProfileAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstErrorMessage(parsed.error),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  // `role` and `is_active` are intentionally absent: the guard_profile_update
  // trigger rejects any attempt to change them from the client.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      avatar_url: parsed.data.avatarUrl,
    })
    .eq("id", user.id);

  if (error) {
    return {
      status: "error",
      message: "Your profile could not be updated. Please try again.",
    };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard", "layout");

  return {
    status: "success",
    message: "Profile updated successfully.",
    data: {},
  };
}

/** Exposed for diagnostics on the setup screen. */
export async function getConfiguredSupabaseUrl(): Promise<string | null> {
  try {
    return getSupabaseUrl();
  } catch {
    return null;
  }
}
