import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, ShieldCheck } from "lucide-react";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

/**
 * Shared shell for /login and /register.
 *
 * The right-hand panel explains the workflow so a first-time user (or an
 * examiner during a viva) immediately understands the system.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
      {/* ------------------------------------------------------- Form panel */}
      <div className="flex flex-col px-4 py-8 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600">
              <Building2 className="size-4.5 text-white" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-slate-900">
                {APP_NAME}
              </span>
              <span className="block text-[11px] text-slate-500">
                {APP_TAGLINE}
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to home
          </Link>
        </div>

        <main
          id="main-content"
          className="flex flex-1 items-center justify-center py-10"
        >
          <div className="w-full max-w-md">{children}</div>
        </main>

        <p className="text-center text-xs text-slate-400">
          {APP_NAME} · Complaint Management System
        </p>
      </div>

      {/* ------------------------------------------------------ Info panel */}
      <aside className="relative hidden overflow-hidden bg-slate-900 lg:block">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(50rem_30rem_at_20%_0%,rgba(79,70,229,0.35),transparent)]"
        />

        <div className="relative flex h-full flex-col justify-center px-12 py-16 text-white">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200">
            <ShieldCheck className="size-3.5" aria-hidden />
            Secure, role-based access
          </span>

          <h2 className="mt-6 text-3xl font-semibold tracking-tight">
            Every complaint, one transparent trail.
          </h2>
          <p className="mt-4 max-w-md text-slate-300">
            From the moment an issue is reported to the moment it is closed,
            ResolveHub records who did what and when — and keeps your data
            visible only to the people who should see it.
          </p>

          <ul className="mt-9 space-y-4 text-sm">
            {[
              "Complaint tracking with a full status timeline",
              "Image evidence attached straight to your complaint",
              "Live in-app notifications on every status change",
              "Analytics computed from real resolution timestamps",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 size-4.5 shrink-0 text-emerald-400"
                  aria-hidden
                />
                <span className="text-slate-200">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Workflow</p>
            <p className="mt-1.5 font-mono text-xs leading-relaxed text-slate-300">
              Submitted → Under Review → Assigned → In Progress → Resolved →
              Closed
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
