import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  TriangleAlert,
} from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-4 sm:p-5", className)}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-slate-100">
          <Icon className="size-5 text-slate-400" aria-hidden />
        </span>
      ) : null}
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      ) : null}
      {action ??
        (actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className={buttonClasses("primary", "md", "mt-5")}
          >
            {actionLabel}
          </Link>
        ) : null)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------
const ALERT_STYLES = {
  error: {
    wrapper: "border-rose-200 bg-rose-50 text-rose-800",
    icon: AlertCircle,
  },
  success: {
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  warning: {
    wrapper: "border-amber-200 bg-amber-50 text-amber-800",
    icon: TriangleAlert,
  },
  info: {
    wrapper: "border-sky-200 bg-sky-50 text-sky-800",
    icon: Info,
  },
} as const;

export function Alert({
  variant = "info",
  title,
  children,
  className,
  action,
}: {
  variant?: keyof typeof ALERT_STYLES;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const style = ALERT_STYLES[variant];
  const Icon = style.icon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        style.wrapper,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? (
          <div className={cn(title && "mt-0.5", "text-sm opacity-90")}>
            {children}
          </div>
        ) : null}
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------
export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" aria-live="polite" className="inline-flex">
      <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/70", className)}
      aria-hidden="true"
    />
  );
}

/** Table-shaped loading placeholder used while a list is fetching. */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3 p-4" role="status" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn(
                "h-4",
                columnIndex === 0 ? "w-24" : columnIndex === 1 ? "flex-1" : "w-20",
              )}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dimensions = {
    sm: "size-7 text-[11px]",
    md: "size-9 text-xs",
    lg: "size-16 text-lg",
  }[size];

  if (src) {
    return (
      // A plain <img> keeps this dependency-free; the URL is a Supabase Storage
      // public URL or an avatar the user supplied.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ? `${name}'s avatar` : "User avatar"}
        className={cn(
          "shrink-0 rounded-full object-cover ring-1 ring-slate-200",
          dimensions,
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ring-1 ring-brand-200",
        dimensions,
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Definition list used across detail pages
// ---------------------------------------------------------------------------
export function DetailItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  );
}
