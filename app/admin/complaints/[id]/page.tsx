import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  ImageOff,
  Mail,
  MapPin,
  Tag,
  UserCheck,
} from "lucide-react";

import { requireAdminProfile } from "@/lib/services/auth-service";
import { getComplaintById } from "@/lib/services/complaint-service";
import { getAssignableStaff } from "@/lib/services/admin-service";
import { formatDateTime, getInitials, isUuid } from "@/lib/utils";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import {
  Card,
  CardBody,
  CardHeader,
  DetailItem,
  PageHeader,
} from "@/components/ui/primitives";
import {
  StatusTimeline,
  WorkflowProgress,
} from "@/components/complaints/status-timeline";
import { ComplaintManager } from "@/components/complaints/complaint-manager";
import { SubmittedFeedback } from "@/components/complaints/feedback-form";

export async function generateMetadata({
  params,
}: PageProps<"/admin/complaints/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Complaint not found" };

  const complaint = await getComplaintById(id);
  if (!complaint) return { title: "Complaint not found" };

  return { title: `${complaint.complaint_number} · Admin` };
}

export default async function AdminComplaintDetailsPage({
  params,
  searchParams,
}: PageProps<"/admin/complaints/[id]">) {
  const { id } = await params;
  const query = await searchParams;

  if (!isUuid(id)) notFound();

  await requireAdminProfile();

  const [complaint, staff] = await Promise.all([
    getComplaintById(id),
    getAssignableStaff(),
  ]);

  if (!complaint) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/complaints"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to all complaints
      </Link>

      {typeof query.updated === "string" ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Complaint updated successfully.
        </div>
      ) : null}

      <PageHeader
        title={complaint.title}
        description={`Complaint ${complaint.complaint_number} · submitted by ${
          complaint.submitter?.full_name ?? "unknown"
        }`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={complaint.status} />
        <PriorityBadge priority={complaint.priority} />
        {complaint.category ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            <Tag className="size-3" aria-hidden />
            {complaint.category.name}
          </span>
        ) : null}
        {complaint.assignee ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            <UserCheck className="size-3" aria-hidden />
            {complaint.assignee.full_name}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            Unassigned
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------------------------------------------------- Left column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Complaint details" />
            <CardBody className="space-y-5">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                {complaint.description}
              </p>

              <dl className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                <DetailItem label="Category">
                  {complaint.category?.name ?? "—"}
                </DetailItem>
                <DetailItem label="Priority">
                  <PriorityBadge priority={complaint.priority} />
                </DetailItem>
                <DetailItem label="Location">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-slate-400" aria-hidden />
                    {complaint.location ?? "Not specified"}
                  </span>
                </DetailItem>
                <DetailItem label="Submitted on">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-slate-400" aria-hidden />
                    {formatDateTime(complaint.created_at)}
                  </span>
                </DetailItem>
                <DetailItem label="Last updated">
                  {formatDateTime(complaint.updated_at)}
                </DetailItem>
                <DetailItem label="Resolved on">
                  {complaint.resolved_at
                    ? formatDateTime(complaint.resolved_at)
                    : "Not resolved yet"}
                </DetailItem>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Supporting image"
              description="Submitted by the complainant as evidence."
            />
            {complaint.image_url ? (
              <div className="p-4 sm:p-5">
                <a
                  href={complaint.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg ring-1 ring-slate-200 transition-shadow hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={complaint.image_url}
                    alt={`Supporting image for complaint ${complaint.complaint_number}`}
                    className="max-h-96 w-full bg-slate-50 object-contain"
                    loading="lazy"
                  />
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-4 py-6 text-sm text-slate-500 sm:px-5">
                <ImageOff className="size-4 text-slate-400" aria-hidden />
                No image was attached to this complaint.
              </div>
            )}
          </Card>

          {/* ------------------------------------------------ Manager panel */}
          <ComplaintManager
            complaintId={complaint.id}
            currentStatus={complaint.status}
            assignedTo={complaint.assigned_to}
            adminRemarks={complaint.admin_remarks}
            resolutionNotes={complaint.resolution_notes}
            staff={staff.map((member) => ({
              id: member.id,
              full_name: member.full_name,
              email: member.email,
            }))}
            canAssign
          />

          <Card>
            <CardHeader
              title="Complainant feedback"
              description="Submitted after the complaint was resolved."
            />
            <CardBody>
              {complaint.feedback ? (
                <SubmittedFeedback
                  rating={complaint.feedback.rating}
                  comment={complaint.feedback.comment}
                  createdAt={complaint.feedback.created_at}
                  authorName={complaint.feedback.author?.full_name}
                />
              ) : (
                <p className="text-sm text-slate-500">
                  No feedback has been submitted for this complaint yet.
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* --------------------------------------------------- Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Complainant" />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  {getInitials(complaint.submitter?.full_name ?? "User")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {complaint.submitter?.full_name ?? "Unknown"}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                    <Mail className="size-3 shrink-0" aria-hidden />
                    {complaint.submitter?.email ?? "—"}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Progress" />
            <CardBody>
              <WorkflowProgress
                currentStatus={complaint.status}
                history={complaint.history}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Status timeline"
              description="Full audit trail of this complaint."
            />
            <StatusTimeline history={complaint.history} />
          </Card>

          <Card>
            <CardHeader title="Reference" />
            <CardBody>
              <p className="flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2.5 font-mono text-sm font-semibold tracking-wider text-white">
                <FileText className="size-4 shrink-0 text-slate-400" aria-hidden />
                {complaint.complaint_number}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Assigned to: {complaint.assignee?.full_name ?? "nobody yet"}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
