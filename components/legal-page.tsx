import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600">
              <Building2 className="size-4.5 text-white" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-slate-900">{APP_NAME}</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to home
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          {APP_TAGLINE}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {updated}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-slate-900">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {APP_NAME}. This document is provided for
            an academic mini project and is not legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
