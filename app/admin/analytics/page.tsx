import type { Metadata } from "next";
import {
  AlertOctagon,
  BarChart3,
  CheckCircle2,
  Clock,
  FolderTree,
  Gauge,
  Star,
  Users,
} from "lucide-react";

import { requireAdminProfile } from "@/lib/services/auth-service";
import {
  getAdminAnalytics,
  getRecentComplaints,
  getStaffPerformance,
} from "@/lib/services/admin-service";
import { COMPLAINT_STATUSES } from "@/types/database";
import { formatDuration } from "@/lib/utils";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/ui/primitives";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  CategoryBarChart,
  PriorityBarChart,
  StatusPieChart,
} from "@/components/admin/charts";

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  await requireAdminProfile();

  const [analytics, staffPerformance, recent] = await Promise.all([
    getAdminAnalytics(),
    getStaffPerformance(),
    getRecentComplaints(3),
  ]);

  const maxCategoryCount = Math.max(
    1,
    ...(analytics.by_category ?? []).map((entry) => entry.count),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Every figure below is computed in PostgreSQL from real complaint rows and timestamps."
      />

      {/* ---------------------------------------------------------- Headline */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total complaints"
          value={analytics.total_complaints}
          icon={FolderTree}
        />
        <StatCard
          label="Pending"
          value={analytics.pending_complaints}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Resolved"
          value={analytics.resolved_complaints}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="High priority"
          value={analytics.high_complaints}
          icon={Gauge}
          tone="info"
        />
        <StatCard
          label="Critical"
          value={analytics.critical_complaints}
          icon={AlertOctagon}
          tone="danger"
        />
        <StatCard
          label="Rejected"
          value={analytics.rejected_complaints}
          icon={AlertOctagon}
          tone="danger"
        />
      </div>

      {/* ------------------------------------------------------------ Ratios */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Resolution rate"
          value={`${analytics.resolution_rate}%`}
          icon={CheckCircle2}
          tone="success"
          hint="Resolved or closed"
        />
        <StatCard
          label="Avg. resolution time"
          value={formatDuration(analytics.avg_resolution_hours)}
          icon={Clock}
          tone="info"
          hint="created → resolved"
        />
        <StatCard
          label="Avg. per category"
          value={analytics.avg_per_category}
          icon={BarChart3}
        />
        <StatCard
          label="Avg. rating"
          value={
            analytics.avg_rating !== null ? `${analytics.avg_rating} / 5` : "—"
          }
          icon={Star}
          tone="warning"
          hint={`${analytics.feedback_count} response(s)`}
        />
      </div>

      {/* ------------------------------------------------------------ Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Complaints by status" />
          <CardBody>
            <StatusPieChart analytics={analytics} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Complaints by priority" />
          <CardBody>
            <PriorityBarChart analytics={analytics} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Complaints by category"
          description="Including categories with no complaints, so gaps are visible."
        />
        <CardBody>
          <CategoryBarChart analytics={analytics} />
        </CardBody>
      </Card>

      {/* --------------------------------------------------------- Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Status breakdown"
            description="Exact counts for every status in the workflow."
          />
          <CardBody>
            <ul className="space-y-3">
              {COMPLAINT_STATUSES.map((status) => {
                const count = analytics.by_status?.[status] ?? 0;
                const percentage =
                  analytics.total_complaints > 0
                    ? Math.round((count / analytics.total_complaints) * 100)
                    : 0;
                return (
                  <li key={status} className="flex items-center gap-3">
                    <StatusBadge status={status} className="w-28 justify-center" />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs text-slate-500">
                      {count} · {percentage}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Category performance"
            description="Complaint volume per category."
          />
          <CardBody>
            {(analytics.by_category ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No categories defined yet.</p>
            ) : (
              <ul className="space-y-3">
                {[...(analytics.by_category ?? [])]
                  .sort((a, b) => b.count - a.count)
                  .map((entry) => (
                    <li key={entry.category} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-sm text-slate-700">
                        {entry.category}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-700"
                          style={{
                            width: `${Math.round(
                              (entry.count / maxCategoryCount) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs text-slate-500">
                        {entry.count}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ------------------------------------------------------------- Staff */}
      <Card>
        <CardHeader
          title="Staff workload"
          description="Open and resolved complaint counts per staff member."
        />
        {staffPerformance.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff accounts yet"
            description="Create staff accounts to start assigning complaints."
          />
        ) : (
          <CardBody>
            <ul className="space-y-4">
              {staffPerformance.map((member) => {
                const total = member.open + member.resolved;
                const resolvedPercentage =
                  total > 0 ? Math.round((member.resolved / total) * 100) : 0;
                return (
                  <li key={member.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-900">
                        {member.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {member.open} open · {member.resolved} resolved
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-amber-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${resolvedPercentage}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        )}
      </Card>

      {/* ------------------------------------------------------------ Recent */}
      <Card>
        <CardHeader
          title="Recently submitted"
          description="The newest complaints in the system."
        />
        {recent.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No complaints yet"
            description="Analytics will populate as soon as complaints are submitted."
          />
        ) : (
          <CardBody className="space-y-3">
            {recent.map((complaint) => (
              <div
                key={complaint.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3.5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-slate-500">
                    {complaint.complaint_number}
                  </p>
                  <p className="truncate text-sm font-medium text-slate-900">
                    {complaint.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {complaint.category?.name ?? "—"} ·{" "}
                    {complaint.submitter?.full_name ?? "Unknown"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={complaint.priority} />
                  <StatusBadge status={complaint.status} />
                </div>
              </div>
            ))}
          </CardBody>
        )}
      </Card>
    </div>
  );
}
