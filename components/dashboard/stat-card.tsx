import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  href,
  tone = "default",
  className,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  href?: string;
  tone?: "default" | "info" | "warning" | "success" | "danger";
  className?: string;
}) {
  const tones = {
    default: { icon: "bg-slate-100 text-slate-600", value: "text-slate-900" },
    info: { icon: "bg-sky-50 text-sky-600", value: "text-sky-700" },
    warning: { icon: "bg-amber-50 text-amber-600", value: "text-amber-700" },
    success: { icon: "bg-emerald-50 text-emerald-600", value: "text-emerald-700" },
    danger: { icon: "bg-rose-50 text-rose-600", value: "text-rose-700" },
  }[tone];

  const content = (
    <div
      className={cn(
        "flex items-start gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow",
        href && "hover:border-brand-200 hover:shadow-md",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          tones.icon,
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          {label}
        </p>
        <p className={cn("mt-1 text-2xl font-semibold", tones.value)}>{value}</p>
        {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-xl focus-visible:outline-2">
        {content}
      </Link>
    );
  }

  return content;
}
