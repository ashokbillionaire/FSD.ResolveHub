import { AlertTriangle, Star } from "lucide-react";

import { PRIORITY_META, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ComplaintPriority, ComplaintStatus } from "@/types/database";

export function StatusBadge({
  status,
  className,
  withDot = true,
}: {
  status: ComplaintStatus;
  className?: string;
  withDot?: boolean;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        meta.badge,
        className,
      )}
    >
      {withDot && (
        <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden="true" />
      )}
      {meta.label}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: ComplaintPriority;
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
  const isCritical = priority === "Critical";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        meta.badge,
        isCritical && "font-semibold",
        className,
      )}
      title={meta.description}
    >
      {isCritical ? (
        <AlertTriangle className="size-3" aria-hidden="true" />
      ) : (
        <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden="true" />
      )}
      {meta.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "bg-brand-50 text-brand-700 ring-brand-200",
    staff: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    user: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        styles[role] ?? styles.user,
      )}
    >
      {role}
    </span>
  );
}

/** Read-only star rating. */
export function StarRating({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const dimension = size === "sm" ? "size-3.5" : "size-5";
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            dimension,
            star <= value
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200",
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
