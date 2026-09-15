import { AlertTriangle } from "lucide-react";

/**
 * Shown when NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are
 * missing.
 *
 * This exists so a fresh clone tells you exactly what to do instead of quietly
 * falling back to mock data — ResolveHub has no mock mode by design.
 */
export function SetupNotice() {
  return (
    <div className="border-b border-amber-300 bg-amber-50">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 sm:px-6">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <div className="min-w-0 text-sm text-amber-900">
          <p className="font-semibold">
            Supabase is not configured — data features are disabled.
          </p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-xs text-amber-800">
            <li>
              Create a project at{" "}
              <span className="font-mono">supabase.com/dashboard</span>.
            </li>
            <li>
              Copy <span className="font-mono">.env.local.example</span> to{" "}
              <span className="font-mono">.env.local</span>.
            </li>
            <li>
              Paste your Project URL and anon key from{" "}
              <span className="font-mono">Settings → API</span>.
            </li>
            <li>
              Run the SQL in{" "}
              <span className="font-mono">
                supabase/migrations/20260914000000_init_resolvehub.sql
              </span>{" "}
              in the SQL Editor.
            </li>
            <li>Restart the dev server.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
