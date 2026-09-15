import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareQuote, Star } from "lucide-react";

import { requireAdminProfile } from "@/lib/services/auth-service";
import { getAdminAnalytics, getAllFeedback } from "@/lib/services/admin-service";
import { formatDateTime, getInitials, toQueryObject } from "@/lib/utils";
import { StarRating } from "@/components/ui/badges";
import {
  Card,
  CardHeader,
  DetailItem,
  EmptyState,
  PageHeader,
} from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { StatCard } from "@/components/dashboard/stat-card";

export const metadata: Metadata = { title: "Feedback" };

const PAGE_SIZE = 10;

export default async function AdminFeedbackPage({
  searchParams,
}: PageProps<"/admin/feedback">) {
  const params = await searchParams;
  const query = toQueryObject(params);
  const page =
    typeof query.page === "string" && /^\d+$/.test(query.page)
      ? Math.max(1, Number(query.page))
      : 1;

  await requireAdminProfile();

  const [result, analytics] = await Promise.all([
    getAllFeedback(page, PAGE_SIZE),
    getAdminAnalytics(),
  ]);

  // Distribution of ratings across the whole feedback table.
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: result.items.filter((item) => item.rating === rating).length,
  }));
  const visibleTotal = result.items.length || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description="How complainants rated the handling of their resolved complaints."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Responses"
          value={analytics.feedback_count}
          icon={MessageSquareQuote}
        />
        <StatCard
          label="Average rating"
          value={
            analytics.avg_rating !== null ? `${analytics.avg_rating} / 5` : "—"
          }
          icon={Star}
          tone="warning"
        />
        <StatCard
          label="Resolved complaints"
          value={analytics.resolved_complaints}
          icon={MessageSquareQuote}
          tone="success"
        />
        <StatCard
          label="Response rate"
          value={
            analytics.resolved_complaints > 0
              ? `${Math.round(
                  (analytics.feedback_count / analytics.resolved_complaints) * 100,
                )}%`
              : "—"
          }
          icon={MessageSquareQuote}
          tone="info"
          hint="Of resolved complaints"
        />
      </div>

      <Card>
        <CardHeader
          title="Rating distribution"
          description="Across the feedback responses shown on this page."
        />
        <div className="space-y-2.5 p-4 sm:p-5">
          {distribution.map((entry) => (
            <div key={entry.rating} className="flex items-center gap-3">
              <StarRating value={entry.rating} />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{
                    width: `${Math.round((entry.count / visibleTotal) * 100)}%`,
                  }}
                />
              </div>
              <span className="w-8 text-right text-xs text-slate-500">
                {entry.count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="All feedback"
          description={`${result.total} response${result.total === 1 ? "" : "s"} submitted in total.`}
        />

        {result.items.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title="No feedback yet"
            description="Feedback appears here once complainants rate their resolved complaints."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {result.items.map((item) => (
              <li key={item.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {getInitials(item.author?.full_name ?? "User")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {item.author?.full_name ?? "Unknown user"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {item.author?.email ?? ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <StarRating value={item.rating} size="md" />
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                </div>

                {item.comment ? (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3.5 text-sm text-slate-700">
                    {item.comment}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-slate-400 italic">
                    No comment provided.
                  </p>
                )}

                {item.complaint ? (
                  <dl className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
                    <DetailItem label="Complaint">
                      <Link
                        href={`/admin/complaints/${item.complaint.id}`}
                        className="font-mono text-xs text-brand-600 hover:text-brand-700"
                      >
                        {item.complaint.complaint_number}
                      </Link>
                    </DetailItem>
                    <DetailItem label="Title">
                      <span className="line-clamp-2">{item.complaint.title}</span>
                    </DetailItem>
                    <DetailItem label="Category">
                      {item.complaint.category?.name ?? "—"}
                    </DetailItem>
                  </dl>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          basePath="/admin/feedback"
          searchParams={query}
        />
      </Card>
    </div>
  );
}
