import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * ResolveHub request middleware.
 *
 * Runs before every matched request to refresh the Supabase session cookie and
 * enforce authentication / role based route protection.
 *
 * (Next.js 16 also accepts `proxy.ts` for this file; `middleware.ts` is used
 * here because it is the name referenced throughout the project documentation.)
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except:
     *  - Next.js internals (_next/static, _next/image)
     *  - the favicon and other static assets in /public
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
