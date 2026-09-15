import { Check, Clock, XCircle } from "lucide-react";

import { STATUS_META, WORKFLOW_ORDER } from "@/lib/constants";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/primitives";
import type { ComplaintStatus } from "@/types/database";
import type { StatusHistoryEntry } from "@/types";

/**
 * Canonical workflow progress.
 *
 * Steps are marked complete only when the complaint's real history contains
 * that status — nothing is inferred or faked.
 */
export function WorkflowProgress({
  currentStatus,
  history,
}: {
  currentStatus: ComplaintStatus;
  history: StatusHistoryEntry[];
}) {
  if (currentStatus === "Rejected") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3.5">
        <XCircle className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden />
        <div>
          <p className="text-sm font-medium text-rose-800">
            This complaint was rejected
          </p>
          <p className="mt-0.5 text-xs text-rose-700">
            {STATUS_META.Rejected.description}
          </p>
        </div>
      </div>
    );
  }

  const reached = new Set(history.map((entry) => entry.status));
  const currentIndex = WORKFLOW_ORDER.indexOf(currentStatus);

  return (
    <ol className="space-y-0">
      {WORKFLOW_ORDER.map((step, index) => {
        const isDone = reached.has(step) && index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <li key={step} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isDone &&
                    "border-emerald-500 bg-emerald-500 text-white",
                  isCurrent &&
                    "border-brand-600 bg-white ring-4 ring-brand-100",
                  !isDone && !isCurrent && "border-slate-200 bg-white",
                )}
                aria-hidden
              >
                {isDone ? (
                  <Check className="size-3.5" />
                ) : isCurrent ? (
                  <span className="size-2 rounded-full bg-brand-600" />
                ) : null}
              </span>
              {index < WORKFLOW_ORDER.length - 1 ? (
                <span
                  className={cn(
                    "w-0.5 flex-1",
                    isDone ? "bg-emerald-500" : "bg-slate-200",
                  )}
                  aria-hidden
                />
              ) : null}
            </div>

            <div className={cn("pb-5", index === WORKFLOW_ORDER.length - 1 && "pb-0")}>
              <p
                className={cn(
                  "text-sm leading-6 font-medium",
                  isDone || isCurrent ? "text-slate-900" : "text-slate-400",
                )}
              >
                {step}
                {isCurrent ? (
                  <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-700 uppercase">
                    Current
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-slate-500">{STATUS_META[step].description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** The full audit trail, one row per recorded status change. */
export function StatusTimeline({ history }: { history: StatusHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-slate-500 sm:px-5">
        No status history has been recorded for this complaint yet.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-slate-100">
      {history.map((entry) => {
        const meta = STATUS_META[entry.status];
        return (
          <li key={entry.id} className="flex gap-3.5 px-4 py-4 sm:px-5">
            <span
              className={cn(
                "mt-1.5 size-2.5 shrink-0 rounded-full ring-4",
                meta.dot,
                "ring-slate-50",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-slate-900">
                  {entry.status}
                </span>
                <time
                  dateTime={entry.created_at}
                  className="text-xs text-slate-500"
                  title={formatDateTime(entry.created_at)}
                >
                  <Clock className="mr-1 inline size-3" aria-hidden />
                  {formatRelativeTime(entry.created_at)}
                </time>
              </div>

              {entry.remarks ? (
                <p className="mt-1 text-sm text-slate-600">{entry.remarks}</p>
              ) : null}

              <div className="mt-2 flex items-center gap-2">
                <Avatar
                  name={entry.actor?.full_name ?? "System"}
                  src={entry.actor?.avatar_url}
                  size="sm"
                  className="size-5 text-[9px]"
                />
                <span className="text-xs text-slate-500">
                  {entry.actor?.full_name ?? "System"}
                  {entry.actor?.id && entry.actor.id === "" ? "" : null}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
