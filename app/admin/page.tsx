import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertOctagon,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  FolderTree,
  Gauge,
  Inbox,
  MessageSquareQuote,
  TrendingUp,
  Users,
} from "lucide-react";

import { requireAdminProfile } from "@/lib/services/auth-service";
import {
  getAdminAnalytics,
  getCriticalComplaints,
  getRecentComplaints,
} from "@/lib/services/admin-service";
import { formatDate, formatDuration } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import {
  Alert,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/ui/primitives";
import { StatCard } from "@/components/dashboard/stat-card";
import { ComplaintTable } from "@/components/complaints/complaint-table";
import {
  CategoryBarChart,
  PriorityBarChart,
  StatusPieChart,
} from "@/components/admin/charts";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const admin = await requireAdminProfile();

  // All three read live data. getAdminAnalytics() computes everything in SQL
  // from real rows and timestamps.
  const [analytics, recent, critical] = await Promise.all([
    getAdminAnalytics(),
    getRecentComplaints(5),
    getCriticalComplaints(4),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Administration dashboard`}
        description={`Signed in as ${admin.full_name}. Live figures computed from the complaints database.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/complaints" className={buttonClasses("primary", "md")}>
              <ClipboardList className="size-4" aria-hidden />
              Manage complaints
            </Link>
            <Link href="/admin/analytics" className={buttonClasses("outline", "md")}>
              <BarChart3 className="size-4" aria-hidden />
              Analytics
            </Link>
          </div>
        }
      />

      {/* ---------------------------------------------------------- Counters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total"
          value={analytics.total_complaints}
          icon={FolderTree}
          href="/admin/complaints"
        />
        <StatCard
          label="Pending"
          value={analytics.pending_complaints}
          icon={Clock}
          tone="warning"
          hint="Not yet resolved"
        />
        <StatCard
          label="In Progress"
          value={
            (analytics.by_status?.["In Progress"] ?? 0) +
            (analytics.by_status?.Assigned ?? 0)
          }
          icon={Gauge}
          tone="info"
        />
        <StatCard
          label="Resolved"
          value={analytics.resolved_complaints}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Closed"
          value={analytics.closed_complaints}
          icon={CheckCircle2}
        />
        <StatCard
          label="Critical"
          value={analytics.critical_complaints}
          icon={AlertOctagon}
          tone="danger"
          hint="Needs attention"
        />
      </div>

      {/* -------------------------------------------------------- Key ratios */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Resolution rate
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900">
            {analytics.resolution_rate}%
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Resolved or closed, of all complaints
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Avg. resolution time
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900">
            {formatDuration(analytics.avg_resolution_hours)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Calculated from created → resolved timestamps
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Avg. complaints / category
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900">
            {analytics.avg_per_category}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Across all complaint categories
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Avg. feedback rating
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900">
            {analytics.avg_rating !== null ? `${analytics.avg_rating} / 5` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            From {analytics.feedback_count} response
            {analytics.feedback_count === 1 ? "" : "s"}
          </p>
        </Card>
      </div>

      {/* ------------------------------------------------------ Alerts area */}
      {analytics.critical_complaints > 0 ? (
        <Alert
          variant="error"
          title={`${analytics.critical_complaints} critical complaint${
            analytics.critical_complaints === 1 ? "" : "s"
          } on record`}
          action={
            <Link
              href="/admin/complaints?priority=Critical"
              className="shrink-0 text-xs font-medium underline underline-offset-2"
            >
              Review
            </Link>
          }
        >
          Critical complaints indicate a safety risk or a complete service
          outage. Triage these first.
        </Alert>
      ) : null}

      {/* ------------------------------------------------------------ Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Complaints by status"
            description="Live distribution across the workflow."
          />
          <div className="p-4 sm:p-5">
            <StatusPieChart analytics={analytics} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Complaints by priority"
            description="How urgent the current workload is."
          />
          <div className="p-4 sm:p-5">
            <PriorityBarChart analytics={analytics} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Complaints by category"
          description="The eight categories with the most complaints."
        />
        <div className="p-4 sm:p-5">
          <CategoryBarChart analytics={analytics} />
        </div>
      </Card>

      {/* -------------------------------------------------- Critical queue */}
      {critical.length > 0 ? (
        <Card>
          <CardHeader
            title="Critical complaints needing attention"
            description="Highest priority items that are still open."
            action={
              <Link
                href="/admin/complaints?priority=Critical"
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                View all critical
              </Link>
            }
          />
          <ComplaintTable
            complaints={critical}
            basePath="/admin/complaints"
            columns={["number", "title", "submittedBy", "priority", "status", "assignee", "date", "action"]}
          />
        </Card>
      ) : null}

      {/* ------------------------------------------------------ Recent all */}
      <Card>
        <CardHeader
          title="Recent complaints"
          description="The five most recently submitted complaints."
          action={
            <Link
              href="/admin/complaints"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </Link>
          }
        />
        <ComplaintTable
          complaints={recent}
          basePath="/admin/complaints"
          columns={["number", "title", "submittedBy", "category", "priority", "status", "assignee", "date", "action"]}
          emptyState={
            <EmptyState
              icon={Inbox}
              title="No complaints yet"
              description="Once users start submitting complaints they will appear here."
            />
          }
        />
      </Card>

      {/* ------------------------------------------------------ Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/complaints", label: "All complaints", icon: ClipboardList, hint: `${analytics.total_complaints} total` },
          { href: "/admin/staff", label: "Staff", icon: Users, hint: `${analytics.total_staff} account${analytics.total_staff === 1 ? "" : "s"}` },
          { href: "/admin/categories", label: "Categories", icon: FolderTree, hint: "Manage complaint types" },
          { href: "/admin/feedback", label: "Feedback", icon: MessageSquareQuote, hint: `${analytics.feedback_count} response${analytics.feedback_count === 1 ? "" : "s"}` },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:border-brand-200 hover:shadow-md"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100">
              <link.icon className="size-4.5 text-slate-600" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-900">
                {link.label}
              </span>
              <span className="block truncate text-xs text-slate-500">
                {link.hint}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <TrendingUp className="size-3.5" aria-hidden />
        Figures computed by the <code className="font-mono">admin_analytics()</code>{" "}
        database function. Snapshot taken {formatDate(new Date())}.
      </p>
    </div>
  );
}
