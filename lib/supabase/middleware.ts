import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database, UserRole } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/env";

/** Routes that require an authenticated session. */
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/notifications", "/profile"];

/** Routes that an already-authenticated visitor should be bounced away from. */
const AUTH_ROUTES = ["/login", "/register"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.includes(pathname);
}

/**
 * Refreshes the Supabase session cookie on every request and enforces
 * route protection.
 *
 * Role checks happen here (server side, against the database) as the first
 * gate. Every page and server action re-checks independently, so a bypassed
 * redirect can never expose data.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const { pathname, search } = request.nextUrl;

  // Without configuration we cannot authenticate anyone. Let the request pass
  // so the setup screen inside the app can explain what is missing.
  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: getUser() (not getSession()) revalidates the JWT with Supabase
  // Auth, so a tampered cookie cannot be trusted here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ---- Unauthenticated visitor ---------------------------------------------
  if (!user) {
    if (isProtected(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // ---- Authenticated visitor ------------------------------------------------
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const role: UserRole = profile?.role ?? "user";

  // Deactivated staff/admin accounts lose access immediately.
  if (profile && profile.is_active === false && profile.role !== "user") {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set(
      "error",
      "Your account has been deactivated. Please contact an administrator.",
    );
    return NextResponse.redirect(url);
  }

  if (isAuthRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin" : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    url.searchParams.set(
      "error",
      "You do not have permission to access the administration area.",
    );
    return NextResponse.redirect(url);
  }

  return response;
}
