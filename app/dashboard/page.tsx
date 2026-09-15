import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertOctagon,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  FolderOpen,
  Inbox,
  PlusCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { requireProfile } from "@/lib/services/auth-service";
import {
  getRecentUserComplaints,
  getUserDashboardStats,
  getStaffComplaints,
  getStaffDashboardStats,
} from "@/lib/services/complaint-service";
import { getUserFeedbackComplaintIds } from "@/lib/services/feedback-service";
import { complaintFilterSchema } from "@/lib/validations/complaint";
import { formatDate } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { Alert, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/primitives";
import { StatCard } from "@/components/dashboard/stat-card";
import { ComplaintTable } from "@/components/complaints/complaint-table";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;

  const profile = await requireProfile();

  if (profile.role === "admin") {
    return <AdminRedirectDashboard name={profile.full_name} />;
  }

  if (profile.role === "staff") {
    return <StaffDashboard staffId={profile.id} name={profile.full_name} />;
  }

  return <UserDashboard userId={profile.id} name={profile.full_name} error={error} />;
}

// ---------------------------------------------------------------------------
// Admin — the full dashboard lives at /admin
// ---------------------------------------------------------------------------
function AdminRedirectDashboard({ name }: { name: string }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${name.split(" ")[0]}`}
        description="You are signed in as an administrator."
      />
      <Card>
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-50">
            <ShieldCheck className="size-6 text-brand-600" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Administration dashboard
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-slate-600">
            Review complaints, assign staff, manage categories and read the
            analytics for the whole system.
          </p>
          <Link href="/admin" className={buttonClasses("primary", "lg", "mt-6")}>
            Open admin dashboard
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------
async function StaffDashboard({
  staffId,
  name,
}: {
  staffId: string;
  name: string;
}) {
  const filter = complaintFilterSchema.parse({});
  const [stats, assigned] = await Promise.all([
    getStaffDashboardStats(staffId),
    getStaffComplaints(staffId, filter),
  ]);

  const recent = assigned.items;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${name.split(" ")[0]}`}
        description="Complaints assigned to you that need attention."
        action={
          <Link
            href="/dashboard/assigned"
            className={buttonClasses("outline", "md")}
          >
            <ClipboardList className="size-4" aria-hidden />
            View all assigned
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned to me"
          value={stats.assigned}
          icon={FolderOpen}
          tone="info"
          href="/dashboard/assigned"
        />
        <StatCard label="Open" value={stats.open} icon={Clock} tone="warning" />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <Card>
        <CardHeader
          title="Assigned complaints"
          description="Only complaints assigned to you are visible here."
          action={
            <Link
              href="/dashboard/assigned"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </Link>
          }
        />
        <ComplaintTable
          complaints={recent}
          basePath="/dashboard/complaints"
          columns={["number", "title", "category", "priority", "status", "date", "action"]}
          emptyState={
            <EmptyState
              icon={Inbox}
              title="Nothing assigned to you yet"
              description="When an administrator assigns a complaint to you it will appear here, and you will receive a notification."
            />
          }
        />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Regular user
// ---------------------------------------------------------------------------
async function UserDashboard({
  userId,
  name,
  error,
}: {
  userId: string;
  name: string;
  error?: string;
}) {
  const [stats, recent, feedbackIds] = await Promise.all([
    getUserDashboardStats(userId),
    getRecentUserComplaints(userId, 5),
    getUserFeedbackComplaintIds(userId),
  ]);

  return (
    <div className="space-y-6">
      {error ? <Alert variant="error">{error}</Alert> : null}

      <PageHeader
        title={`Welcome back, ${name.split(" ")[0]}`}
        description="Here is the current status of everything you have reported."
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

      {stats.unreadNotifications > 0 ? (
        <Alert
          variant="info"
          action={
            <Link
              href="/notifications"
              className="shrink-0 text-xs font-medium underline underline-offset-2"
            >
              View
            </Link>
          }
        >
          <span className="inline-flex items-center gap-1.5">
            <Bell className="size-3.5" aria-hidden />
            You have <strong>{stats.unreadNotifications}</strong> unread
            notification{stats.unreadNotifications === 1 ? "" : "s"}.
          </span>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total"
          value={stats.total}
          icon={FolderOpen}
          href="/dashboard/complaints"
        />
        <StatCard label="Submitted" value={stats.submitted} icon={Inbox} />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard label="Closed" value={stats.closed} icon={CheckCircle2} tone="default" />
      </div>

      {stats.rejected > 0 ? (
        <Alert variant="warning">
          <span className="inline-flex items-center gap-1.5">
            <XCircle className="size-3.5" aria-hidden />
            {stats.rejected} complaint{stats.rejected === 1 ? "" : "s"} rejected.
            Open {stats.rejected === 1 ? "it" : "them"} to read the administrator&apos;s
            remarks.
          </span>
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Recent complaints"
          description={
            recent.length > 0
              ? `Last ${recent.length} of ${stats.total} complaint${stats.total === 1 ? "" : "s"}`
              : undefined
          }
          action={
            recent.length > 0 ? (
              <Link
                href="/dashboard/complaints"
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            ) : null
          }
        />
        <ComplaintTable
          complaints={recent}
          basePath="/dashboard/complaints"
          hasFeedbackIds={feedbackIds}
          columns={["number", "title", "category", "priority", "status", "date", "action"]}
          emptyState={
            <EmptyState
              icon={ClipboardList}
              title="No complaints yet"
              description="Submit your first complaint to get started. You will be able to track its progress here."
              actionLabel="Submit Complaint"
              actionHref="/dashboard/complaints/new"
            />
          }
        />
      </Card>

      <Card>
        <CardHeader
          title="How complaints are handled"
          description="Every complaint follows the same published workflow."
        />
        <div className="flex flex-wrap items-center gap-2 px-4 py-4 text-xs sm:px-5">
          {[
            "Submitted",
            "Under Review",
            "Assigned",
            "In Progress",
            "Resolved",
            "Closed",
          ].map((step, index, all) => (
            <span key={step} className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                {step}
              </span>
              {index < all.length - 1 ? (
                <ArrowRight className="size-3 text-slate-400" aria-hidden />
              ) : null}
            </span>
          ))}
        </div>
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <AlertOctagon className="size-3.5" aria-hidden />
        Data shown here is read live from the database — nothing on this page is
        simulated. Last loaded {formatDate(new Date())}.
      </p>
    </div>
  );
}
