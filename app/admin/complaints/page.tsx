import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { requireAdminProfile } from "@/lib/services/auth-service";
import { getAllComplaints, getAssignableStaff } from "@/lib/services/admin-service";
import { getCategories } from "@/lib/services/category-service";
import { parseComplaintFilters } from "@/lib/validations/complaint";
import { toQueryObject } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { ComplaintFilters } from "@/components/complaints/complaint-filters";
import { ComplaintTable } from "@/components/complaints/complaint-table";

export const metadata: Metadata = { title: "All Complaints" };

export default async function AdminComplaintsPage({
  searchParams,
}: PageProps<"/admin/complaints">) {
  const params = await searchParams;
  const query = toQueryObject(params);
  const filter = parseComplaintFilters(query);

  await requireAdminProfile();

  const [result, categories, staff] = await Promise.all([
    getAllComplaints(filter),
    getCategories(),
    getAssignableStaff(),
  ]);

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const staffOptions = staff.map((member) => ({
    value: member.id,
    label: member.full_name,
  }));

  const hasFilters = Object.values(query).some(
    (value) => value !== undefined && value !== "",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaint Management"
        description="Every complaint in the system. Search, filter, assign and update status."
        action={
          <Link href="/admin" className={buttonClasses("outline", "md")}>
            Back to dashboard
          </Link>
        }
      />

      <Card className="p-4">
        <ComplaintFilters
          categories={categoryOptions}
          staff={staffOptions}
          showStaffFilter
        />
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">All complaints</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {result.total} complaint{result.total === 1 ? "" : "s"} match
              {result.total === 1 ? "es" : ""} the current view
            </p>
          </div>
        </div>

        <ComplaintTable
          complaints={result.items}
          basePath="/admin/complaints"
          columns={[
            "number",
            "title",
            "submittedBy",
            "category",
            "priority",
            "status",
            "assignee",
            "date",
            "action",
          ]}
          emptyState={
            hasFilters ? (
              <EmptyState
                icon={ClipboardList}
                title="No complaints match your filters"
                description="Adjust the search term or clear the filters to see everything."
              />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No complaints have been submitted yet"
                description="When users submit complaints they will appear here for triage."
              />
            )
          }
        />

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          basePath="/admin/complaints"
          searchParams={query}
        />
      </Card>
    </div>
  );
}
