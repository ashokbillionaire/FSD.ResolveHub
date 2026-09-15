import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";

import { requireProfile } from "@/lib/services/auth-service";
import { getStaffComplaints } from "@/lib/services/complaint-service";
import { getCategories } from "@/lib/services/category-service";
import { parseComplaintFilters } from "@/lib/validations/complaint";
import { toQueryObject } from "@/lib/utils";
import { Alert, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { ComplaintFilters } from "@/components/complaints/complaint-filters";
import { ComplaintTable } from "@/components/complaints/complaint-table";

export const metadata: Metadata = { title: "Assigned Complaints" };

export default async function AssignedComplaintsPage({
  searchParams,
}: PageProps<"/dashboard/assigned">) {
  const params = await searchParams;
  const query = toQueryObject(params);
  const filter = parseComplaintFilters(query);

  const profile = await requireProfile();

  if (profile.role !== "staff" && profile.role !== "admin") {
    redirect("/dashboard");
  }

  const error = typeof params.error === "string" ? params.error : undefined;

  const [result, categories] = await Promise.all([
    getStaffComplaints(profile.id, filter),
    getCategories(),
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
        title="Assigned Complaints"
        description="Complaints an administrator has assigned to you. Update their status as you make progress."
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <Card className="p-4">
        <ComplaintFilters categories={categoryOptions} />
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">My queue</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {result.total} complaint{result.total === 1 ? "" : "s"} assigned
            </p>
          </div>
        </div>

        <ComplaintTable
          complaints={result.items}
          basePath="/dashboard/complaints"
          columns={["number", "title", "submittedBy", "priority", "status", "date", "action"]}
          emptyState={
            hasFilters ? (
              <EmptyState
                icon={Inbox}
                title="No assigned complaints match your filters"
                description="Try clearing the filters to see your whole queue."
              />
            ) : (
              <EmptyState
                icon={Inbox}
                title="Nothing assigned to you yet"
                description="When an administrator assigns a complaint to you, it will appear here and you will receive a notification."
              />
            )
          }
        />

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          basePath="/dashboard/assigned"
          searchParams={query}
        />
      </Card>
    </div>
  );
}
