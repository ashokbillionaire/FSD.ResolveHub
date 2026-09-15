import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, PlusCircle } from "lucide-react";

import { requireProfile } from "@/lib/services/auth-service";
import { getUserComplaints } from "@/lib/services/complaint-service";
import { getCategories } from "@/lib/services/category-service";
import { getUserFeedbackComplaintIds } from "@/lib/services/feedback-service";
import { parseComplaintFilters } from "@/lib/validations/complaint";
import { toQueryObject } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import {
  Card,
  EmptyState,
  PageHeader,
} from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { ComplaintFilters } from "@/components/complaints/complaint-filters";
import { ComplaintTable } from "@/components/complaints/complaint-table";

export const metadata: Metadata = { title: "My Complaints" };

export default async function MyComplaintsPage({
  searchParams,
}: PageProps<"/dashboard/complaints">) {
  const params = await searchParams;
  const query = toQueryObject(params);
  const filter = parseComplaintFilters(query);

  const profile = await requireProfile();

  const [result, categories, feedbackIds] = await Promise.all([
    getUserComplaints(profile.id, filter),
    getCategories(),
    getUserFeedbackComplaintIds(profile.id),
  ]);

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const hasFilters = Object.values(query).some(
    (value) => value !== undefined && value !== "",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Complaints"
        description="Every complaint you have submitted, with its current status."
        action={
          <Link
            href="/dashboard/complaints/new"
            className={buttonClasses("primary", "md")}
          >
            <PlusCircle className="size-4" aria-hidden />
            Submit New Complaint
          </Link>
        }
      />

      <Card className="p-4">
        <ComplaintFilters categories={categoryOptions} />
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {filter.status === "All" ? "All complaints" : filter.status}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {result.total} complaint{result.total === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        <ComplaintTable
          complaints={result.items}
          basePath="/dashboard/complaints"
          hasFeedbackIds={feedbackIds}
          columns={["number", "title", "category", "priority", "status", "date", "action"]}
          emptyState={
            hasFilters ? (
              <EmptyState
                icon={ClipboardList}
                title="No complaints match your filters"
                description="Try a different search term, or clear the filters to see everything."
              />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No complaints yet"
                description="Submit your first complaint to get started. You will be able to track its progress right here."
                actionLabel="Submit Complaint"
                actionHref="/dashboard/complaints/new"
              />
            )
          }
        />

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          basePath="/dashboard/complaints"
          searchParams={query}
        />
      </Card>
    </div>
  );
}
