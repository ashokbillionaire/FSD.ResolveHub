"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { buttonClasses } from "@/components/ui/button";

/**
 * Route-level error boundary.
 *
 * Raw database or Auth errors are never shown to the user; the digest is
 * surfaced instead so a problem can still be traced in the server logs.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Kept intentionally simple: the server logs already hold the real stack.
    console.error("Unhandled application error:", error);
  }, [error]);

  const looksLikeConfiguration =
    error.message.includes("NEXT_PUBLIC_SUPABASE") ||
    error.message.includes("SUPABASE_SERVICE_ROLE_KEY") ||
    error.message.includes("Supabase is not configured");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-rose-50">
        <AlertTriangle className="size-7 text-rose-600" aria-hidden />
      </span>

      <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
        {looksLikeConfiguration
          ? "Supabase is not configured"
          : "Something went wrong"}
      </h1>

      <p className="mt-2 max-w-lg text-sm text-slate-600">
        {looksLikeConfiguration
          ? "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see .env.local.example), then restart the dev server."
          : "The page could not be loaded. This is usually temporary — try again, and if it keeps happening check the server logs."}
      </p>

      {error.digest ? (
        <p className="mt-3 rounded-md bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-500">
          Error reference: {error.digest}
        </p>
      ) : null}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className={buttonClasses("primary", "md")}
        >
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </button>
        <Link href="/" className={buttonClasses("outline", "md")}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
