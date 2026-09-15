import Link from "next/link";
import { ArrowUpRight, MessageSquareQuote, Star } from "lucide-react";

import { formatDate } from "@/lib/utils";
import { PRIORITY_META } from "@/lib/constants";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import type { ComplaintWithRelations } from "@/types";

export type ComplaintTableColumn =
  | "number"
  | "title"
  | "category"
  | "priority"
  | "status"
  | "submittedBy"
  | "assignee"
  | "date"
  | "action";

const DEFAULT_COLUMNS: ComplaintTableColumn[] = [
  "number",
  "title",
  "category",
  "priority",
  "status",
  "date",
  "action",
];

/**
 * Complaint list.
 *
 * Renders a real <table> on tablet and up, and a stack of cards on phones —
 * the same data, restructured rather than horizontally scrolled.
 */
export function ComplaintTable({
  complaints,
  basePath,
  columns = DEFAULT_COLUMNS,
  hasFeedbackIds,
  emptyState,
}: {
  complaints: ComplaintWithRelations[];
  basePath: string;
  columns?: ComplaintTableColumn[];
  /** Complaint ids that already have feedback (shows a "Rated" chip). */
  hasFeedbackIds?: Set<string>;
  emptyState?: React.ReactNode;
}) {
  if (complaints.length === 0) {
    return <>{emptyState}</>;
  }

  const show = (column: ComplaintTableColumn) => columns.includes(column);

  return (
    <>
      {/* ------------------------------------------------ Desktop / tablet */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs tracking-wide text-slate-500 uppercase">
              {show("number") ? <th className="px-4 py-3 font-medium">Number</th> : null}
              {show("title") ? <th className="px-4 py-3 font-medium">Title</th> : null}
              {show("submittedBy") ? (
                <th className="px-4 py-3 font-medium">Submitted by</th>
              ) : null}
              {show("category") ? (
                <th className="px-4 py-3 font-medium">Category</th>
              ) : null}
              {show("priority") ? (
                <th className="px-4 py-3 font-medium">Priority</th>
              ) : null}
              {show("status") ? <th className="px-4 py-3 font-medium">Status</th> : null}
              {show("assignee") ? (
                <th className="px-4 py-3 font-medium">Assigned to</th>
              ) : null}
              {show("date") ? <th className="px-4 py-3 font-medium">Created</th> : null}
              {show("action") ? (
                <th className="px-4 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {complaints.map((complaint) => (
              <tr
                key={complaint.id}
                className="transition-colors hover:bg-slate-50/80"
              >
                {show("number") ? (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs text-slate-500">
                      {complaint.complaint_number}
                    </span>
                  </td>
                ) : null}

                {show("title") ? (
                  <td className="max-w-xs px-4 py-3">
                    <Link
                      href={`${basePath}/${complaint.id}`}
                      className="font-medium text-slate-900 hover:text-brand-700"
                    >
                      {complaint.title}
                    </Link>
                    {complaint.priority === "Critical" ? (
                      <span className="mt-1 block text-[11px] font-medium text-rose-600">
                        {PRIORITY_META.Critical.description}
                      </span>
                    ) : null}
                    {hasFeedbackIds?.has(complaint.id) ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                        <Star className="size-3 fill-amber-500 text-amber-500" aria-hidden />
                        Feedback submitted
                      </span>
                    ) : null}
                  </td>
                ) : null}

                {show("submittedBy") ? (
                  <td className="px-4 py-3">
                    <span className="block truncate text-slate-700">
                      {complaint.submitter?.full_name ?? "—"}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {complaint.submitter?.email ?? ""}
                    </span>
                  </td>
                ) : null}

                {show("category") ? (
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {complaint.category?.name ?? "—"}
                  </td>
                ) : null}

                {show("priority") ? (
                  <td className="px-4 py-3">
                    <PriorityBadge priority={complaint.priority} />
                  </td>
                ) : null}

                {show("status") ? (
                  <td className="px-4 py-3">
                    <StatusBadge status={complaint.status} />
                  </td>
                ) : null}

                {show("assignee") ? (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {complaint.assignee ? (
                      <span className="text-slate-700">
                        {complaint.assignee.full_name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )}
                  </td>
                ) : null}

                {show("date") ? (
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {formatDate(complaint.created_at)}
                  </td>
                ) : null}

                {show("action") ? (
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`${basePath}/${complaint.id}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                    >
                      View
                      <ArrowUpRight className="size-3.5" aria-hidden />
                      <span className="sr-only">
                        {complaint.complaint_number}
                      </span>
                    </Link>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --------------------------------------------------------- Mobile */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {complaints.map((complaint) => (
          <li key={complaint.id}>
            <Link
              href={`${basePath}/${complaint.id}`}
              className="block px-4 py-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-[11px] text-slate-500">
                  {complaint.complaint_number}
                </span>
                <StatusBadge status={complaint.status} />
              </div>

              <p className="mt-2 text-sm font-medium text-slate-900">
                {complaint.title}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <PriorityBadge priority={complaint.priority} />
                {show("category") ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                    {complaint.category?.name ?? "—"}
                  </span>
                ) : null}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>{formatDate(complaint.created_at)}</span>
                {show("submittedBy") && complaint.submitter ? (
                  <span className="truncate">{complaint.submitter.full_name}</span>
                ) : null}
                {show("assignee") && complaint.assignee ? (
                  <span className="truncate">
                    Assigned to {complaint.assignee.full_name}
                  </span>
                ) : null}
                {hasFeedbackIds?.has(complaint.id) ? (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <MessageSquareQuote className="size-3" aria-hidden />
                    Rated
                  </span>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
