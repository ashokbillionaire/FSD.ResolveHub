import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  FolderTree,
  Gauge,
  ImageIcon,
  LayoutDashboard,
  MessageSquareQuote,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { getCurrentUser, getUserProfile } from "@/lib/services/auth-service";
import { buttonClasses } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  {
    icon: UserPlus,
    title: "1. Register & sign in",
    description:
      "Create an account in seconds. Every new account starts with the standard user role — no exceptions.",
  },
  {
    icon: ClipboardList,
    title: "2. Submit your complaint",
    description:
      "Pick a category and priority, describe the issue, add a location and attach a photo as evidence.",
  },
  {
    icon: Route,
    title: "3. Track every step",
    description:
      "A live status timeline shows exactly who did what and when, from review to resolution.",
  },
  {
    icon: MessageSquareQuote,
    title: "4. Give feedback",
    description:
      "Once resolved, rate the handling. Your rating feeds the accountability dashboard.",
  },
];

const FEATURES = [
  {
    icon: Workflow,
    title: "Real complaint workflow",
    description:
      "Submitted → Under Review → Assigned → In Progress → Resolved → Closed, with invalid transitions rejected by the database itself.",
  },
  {
    icon: Clock,
    title: "Status timeline",
    description:
      "Every status change is written to a history table, so the timeline you see is generated from real audit rows.",
  },
  {
    icon: ImageIcon,
    title: "Image evidence",
    description:
      "Attach JPG, PNG or WEBP photos up to 5 MB. Uploads go straight to Supabase Storage under your own folder.",
  },
  {
    icon: Sparkles,
    title: "In-app notifications",
    description:
      "Get notified the moment a complaint is reviewed, assigned, updated or resolved — with an unread badge.",
  },
  {
    icon: BarChart3,
    title: "Honest analytics",
    description:
      "Resolution rate and average resolution time are computed from real timestamps. No placeholder numbers anywhere.",
  },
  {
    icon: ShieldCheck,
    title: "Row Level Security",
    description:
      "PostgreSQL policies enforce who can read and write what. Role checks are never trusted from the browser alone.",
  },
];

const ROLES = [
  {
    icon: Users,
    name: "Complainants",
    points: [
      "Submit and track complaints",
      "Upload supporting images",
      "See a full status timeline",
      "Rate the resolution",
    ],
  },
  {
    icon: Gauge,
    name: "Staff",
    points: [
      "See only complaints assigned to them",
      "Move work into progress",
      "Record resolution notes",
      "Update status on their queue",
    ],
  },
  {
    icon: LayoutDashboard,
    name: "Administrators",
    points: [
      "Review and triage every complaint",
      "Assign staff and set priority",
      "Manage categories and staff accounts",
      "Read live analytics and feedback",
    ],
  },
];

export default async function LandingPage() {
  let dashboardHref: string | null = null;

  try {
    const user = await getCurrentUser();
    if (user) {
      const profile = await getUserProfile(user.id);
      dashboardHref = profile?.role === "admin" ? "/admin" : "/dashboard";
    }
  } catch {
    // Supabase not configured yet — the setup banner already explains what to do.
    dashboardHref = null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ---------------------------------------------------------------- Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
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

          <nav
            aria-label="Primary"
            className="ml-8 hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex"
          >
            <a href="#how-it-works" className="hover:text-slate-900">
              How it works
            </a>
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#tracking" className="hover:text-slate-900">
              Tracking
            </a>
            <a href="#roles" className="hover:text-slate-900">
              Roles
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {dashboardHref ? (
              <Link href={dashboardHref} className={buttonClasses("primary", "md")}>
                Go to dashboard
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonClasses("ghost", "md", "hidden sm:inline-flex")}
                >
                  Login
                </Link>
                <Link href="/register" className={buttonClasses("primary", "md")}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* ------------------------------------------------------------- Hero */}
        <section className="relative overflow-hidden border-b border-slate-200">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_32rem_at_70%_-10%,var(--color-brand-100),transparent)]"
          />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                <ShieldCheck className="size-3.5" aria-hidden />
                Transparent by design
              </span>

              <h1 className="text-balance mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
                Resolve Issues. Improve Experiences.
              </h1>

              <p className="mt-5 max-w-xl text-lg text-slate-600">
                Submit, track, and resolve complaints through one transparent
                platform.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={dashboardHref ?? "/register"}
                  className={buttonClasses("primary", "lg")}
                >
                  {dashboardHref ? "Open dashboard" : "Submit a complaint"}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link href="/login" className={buttonClasses("outline", "lg")}>
                  Login
                </Link>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-slate-200 pt-6">
                <div>
                  <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                    Categories
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-slate-900">
                    11
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                    Roles
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-slate-900">3</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                    RLS tables
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-slate-900">6</dd>
                </div>
              </dl>
            </div>

            {/* A stylised preview of the complaint details timeline. */}
            <div className="relative">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-slate-500">CMP-000042</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      Projector in Lab 3 is not switching on
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200 ring-inset">
                    <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
                    In Progress
                  </span>
                </div>

                <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
                  {[
                    { label: "Submitted", done: true, note: "Complaint received." },
                    { label: "Under Review", done: true, note: "Acknowledged by admin." },
                    { label: "Assigned", done: true, note: "Assigned to Priya Nair." },
                    { label: "In Progress", done: false, active: true, note: "Site visit scheduled." },
                    { label: "Resolved", done: false, note: "Awaiting completion." },
                  ].map((step) => (
                    <div key={step.label} className="flex gap-3">
                      <span
                        className={
                          step.done
                            ? "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500"
                            : step.active
                              ? "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 bg-white"
                              : "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white"
                        }
                        aria-hidden
                      >
                        {step.done ? (
                          <CheckCircle2 className="size-3 text-white" />
                        ) : null}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={
                            step.done || step.active
                              ? "text-sm font-medium text-slate-900"
                              : "text-sm text-slate-400"
                          }
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-500">{step.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- How it works */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-b border-slate-200 bg-slate-50 py-16 lg:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                How It Works
              </h2>
              <p className="mt-3 text-slate-600">
                Four steps from raising an issue to confirming it is genuinely
                resolved.
              </p>
            </div>

            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((step) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50">
                    <step.icon className="size-4.5 text-brand-600" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* -------------------------------------------------------- Features */}
        <section
          id="features"
          className="scroll-mt-20 border-b border-slate-200 py-16 lg:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Key Features
              </h2>
              <p className="mt-3 text-slate-600">
                Built on PostgreSQL with security enforced in the database, not
                just in the interface.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-200 p-5 transition-shadow hover:shadow-md"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-slate-900">
                    <feature.icon className="size-4.5 text-white" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- Tracking */}
        <section
          id="tracking"
          className="scroll-mt-20 border-b border-slate-200 bg-slate-900 py-16 text-white lg:py-20"
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200">
                <Search className="size-3.5" aria-hidden />
                Complaint Tracking
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                Know exactly where your complaint stands
              </h2>
              <p className="mt-4 text-slate-300">
                No more asking around for updates. Search and filter your own
                complaints, open any one of them, and read the complete audit
                trail of status changes with timestamps and the person who made
                each change.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {[
                  "Search by number, title, location or description",
                  "Filter by status, category and priority",
                  "Sort by newest, oldest, priority or progress",
                  "Timeline generated from real history rows",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-emerald-400"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <Search className="size-4 text-slate-400" aria-hidden />
                <span className="text-sm text-slate-400">
                  Search complaints…
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { number: "CMP-000042", title: "Projector in Lab 3", status: "In Progress", tone: "text-amber-300 bg-amber-400/10 ring-amber-400/20" },
                  { number: "CMP-000041", title: "No Wi-Fi on 3rd floor", status: "Under Review", tone: "text-sky-300 bg-sky-400/10 ring-sky-400/20" },
                  { number: "CMP-000039", title: "Water leakage near stairs", status: "Resolved", tone: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/20" },
                ].map((row) => (
                  <div
                    key={row.number}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/60 px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-slate-400">
                        {row.number}
                      </p>
                      <p className="truncate text-sm font-medium">{row.title}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${row.tone}`}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------ Transparent resolution */}
        <section className="border-b border-slate-200 py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className="size-4 fill-amber-400 text-amber-400"
                      aria-hidden
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-sm font-medium text-slate-700">
                    5.0
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  &ldquo;Fixed quickly and the team kept me updated throughout.&rdquo;
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Sneha Iyer · on CMP-000039
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5">
                  <div className="rounded-lg bg-white p-3.5 ring-1 ring-slate-200">
                    <p className="text-xs text-slate-500">Resolution rate</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      Computed
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-3.5 ring-1 ring-slate-200">
                    <p className="text-xs text-slate-500">Avg. resolution</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      From timestamps
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <MessageSquareQuote className="size-3.5" aria-hidden />
                Transparent Resolution
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
                Closed loop, not a black hole
              </h2>
              <p className="mt-4 text-slate-600">
                Once a complaint is resolved the complainant is asked to rate how
                it was handled. Feedback is tied to the exact complaint, can only
                be submitted once, and is visible to administrators — so
                resolution quality becomes measurable instead of assumed.
              </p>
              <p className="mt-4 text-sm text-slate-500">
                Resolution notes written by staff are shown alongside the
                feedback, so what was promised and how it was received sit side
                by side.
              </p>
            </div>
          </div>
        </section>

        {/* -------------------------------------------- Admin management */}
        <section
          id="roles"
          className="scroll-mt-20 border-b border-slate-200 bg-slate-50 py-16 lg:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                <FolderTree className="size-3.5" aria-hidden />
                Admin Management
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
                One platform, three clear roles
              </h2>
              <p className="mt-3 text-slate-600">
                Each role sees only what it should. That boundary is enforced by
                PostgreSQL Row Level Security, not by hiding buttons.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {ROLES.map((role) => (
                <div
                  key={role.name}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-600">
                    <role.icon className="size-4.5 text-white" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    {role.name}
                  </h3>
                  <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                    {role.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-brand-500"
                          aria-hidden
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- CTA */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Ready to be heard?
            </h2>
            <p className="mt-3 text-slate-600">
              Create an account and submit your first complaint in under a
              minute.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={dashboardHref ?? "/register"}
                className={buttonClasses("primary", "lg")}
              >
                {dashboardHref ? "Open dashboard" : "Create an account"}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/login" className={buttonClasses("outline", "lg")}>
                Login
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------ Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600">
                  <Building2 className="size-4.5 text-white" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {APP_NAME}
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-slate-600">
                {APP_TAGLINE}. Built with Next.js, TypeScript, Tailwind CSS and
                Supabase.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-wide text-slate-900 uppercase">
                Platform
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#how-it-works" className="hover:text-slate-900">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-slate-900">
                    Key features
                  </a>
                </li>
                <li>
                  <Link href="/register" className="hover:text-slate-900">
                    Create account
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-slate-900">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-wide text-slate-900 uppercase">
                Contact
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>support@resolvehub.local</li>
                <li>Administration Block, Room 12</li>
                <li>Mon–Fri, 9:00–17:00</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-wide text-slate-900 uppercase">
                Legal
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <Link href="/privacy" className="hover:text-slate-900">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-slate-900">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} {APP_NAME}. Complaint Management
              System.
            </p>
            <p className="text-xs text-slate-500">
              College mini project · Next.js + Supabase
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
