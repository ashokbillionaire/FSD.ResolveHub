import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  ImageOff,
  MapPin,
  MessageSquareQuote,
  Tag,
  Trash2,
  UserCheck,
} from "lucide-react";

import { requireProfile } from "@/lib/services/auth-service";
import { getComplaintById } from "@/lib/services/complaint-service";
import { getAssignableStaff } from "@/lib/services/admin-service";
import { withdrawComplaintAction } from "@/lib/actions/complaint-actions";
import { formatDateTime, getInitials, isUuid } from "@/lib/utils";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import {
  Card,
  CardBody,
  CardHeader,
  DetailItem,
  PageHeader,
} from "@/components/ui/primitives";
import { ConfirmSubmit } from "@/components/ui/confirm-dialog";
import {
  StatusTimeline,
  WorkflowProgress,
} from "@/components/complaints/status-timeline";
import {
  FeedbackForm,
  SubmittedFeedback,
} from "@/components/complaints/feedback-form";
import { ComplaintManager } from "@/components/complaints/complaint-manager";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/complaints/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Complaint not found" };

  const complaint = await getComplaintById(id);
  if (!complaint) return { title: "Complaint not found" };

  return {
    title: `${complaint.complaint_number} · ${complaint.title}`,
  };
}

export default async function ComplaintDetailsPage({
  params,
  searchParams,
}: PageProps<"/dashboard/complaints/[id]">) {
  const { id } = await params;
  const query = await searchParams;

  if (!isUuid(id)) notFound();

  const profile = await requireProfile();
  const complaint = await getComplaintById(id);

  // RLS returns nothing for complaints this user may not read, so a missing
  // row and an unauthorised row are indistinguishable — which is intended.
  if (!complaint) notFound();

  const isOwner = complaint.user_id === profile.id;
  const canGiveFeedback =
    isOwner && ["Resolved", "Closed"].includes(complaint.status);
  const canWithdraw = isOwner && complaint.status === "Submitted";

  // Staff may action a complaint only once it has been assigned to them; this
  // mirrors the RLS policies and the guard trigger on the complaints table.
  const isAssignedStaff =
    profile.role === "staff" && complaint.assigned_to === profile.id;
  const canManage = profile.role === "admin" || isAssignedStaff;

  const assignableStaff = canManage && profile.role === "admin"
    ? await getAssignableStaff()
    : [];

  return (
    <div className="space-y-6">
      <Link
        href={
          profile.role === "admin"
            ? "/admin/complaints"
            : profile.role === "staff"
              ? "/dashboard/assigned"
              : "/dashboard/complaints"
        }
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to complaints
      </Link>

      {typeof query.submitted === "string" ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Complaint <strong>{complaint.complaint_number}</strong> was submitted
          successfully.
        </div>
      ) : null}

      <PageHeader
        title={complaint.title}
        description={`Complaint ${complaint.complaint_number}`}
        action={
          canWithdraw ? (
            <form action={withdrawComplaintAction} id="withdraw-complaint-form">
              <input type="hidden" name="complaintId" value={complaint.id} />
              <ConfirmSubmit
                formId="withdraw-complaint-form"
                variant="outline"
                title="Withdraw this complaint?"
                confirmLabel="Withdraw complaint"
                description="The complaint will be permanently deleted. This cannot be undone. You can only withdraw a complaint while it is still awaiting review."
              >
                <Trash2 className="size-4" aria-hidden />
                Withdraw
              </ConfirmSubmit>
            </form>
          ) : null
        }
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ------------------------------------------------------- Left column */}
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
                {complaint.resolved_at ? (
                  <DetailItem label="Resolved on">
                    {formatDateTime(complaint.resolved_at)}
                  </DetailItem>
                ) : null}
              </dl>
            </CardBody>
          </Card>

          {/* ------------------------------------------------------ Attachment */}
          <Card>
            <CardHeader
              title="Supporting image"
              description="Attached by the complainant as evidence."
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
                    alt={`Supporting image for complaint ${complaint.complaint_number}: ${complaint.title}`}
                    className="max-h-96 w-full bg-slate-50 object-contain"
                    loading="lazy"
                  />
                </a>
                <p className="mt-2 text-xs text-slate-500">
                  Click the image to open it full size.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-4 py-6 text-sm text-slate-500 sm:px-5">
                <ImageOff className="size-4 text-slate-400" aria-hidden />
                No image was attached to this complaint.
              </div>
            )}
          </Card>

          {/* --------------------------------------------- Management panel */}
          {canManage ? (
            <ComplaintManager
              complaintId={complaint.id}
              currentStatus={complaint.status}
              assignedTo={complaint.assigned_to}
              adminRemarks={complaint.admin_remarks}
              resolutionNotes={complaint.resolution_notes}
              staff={assignableStaff.map((member) => ({
                id: member.id,
                full_name: member.full_name,
                email: member.email,
              }))}
              canAssign={profile.role === "admin"}
            />
          ) : null}

          {/* -------------------------------------------------- Admin remarks */}
          {complaint.admin_remarks || complaint.resolution_notes ? (
            <Card>
              <CardHeader title="Administration" />
              <CardBody className="space-y-5">
                {complaint.admin_remarks ? (
                  <div>
                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                      Admin remarks
                    </p>
                    <p className="mt-1.5 rounded-lg bg-slate-50 p-3.5 text-sm whitespace-pre-wrap text-slate-700">
                      {complaint.admin_remarks}
                    </p>
                  </div>
                ) : null}

                {complaint.resolution_notes ? (
                  <div>
                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                      Resolution notes
                    </p>
                    <p className="mt-1.5 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3.5 text-sm whitespace-pre-wrap text-emerald-900">
                      {complaint.resolution_notes}
                    </p>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ) : null}

          {/* ---------------------------------------------------- Feedback */}
          <Card>
            <CardHeader
              title="Feedback"
              description={
                complaint.status === "Resolved" || complaint.status === "Closed"
                  ? "Share how this complaint was handled."
                  : "Available once the complaint has been resolved."
              }
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100">
                  <MessageSquareQuote className="size-4 text-slate-500" aria-hidden />
                </span>
              }
            />
            <CardBody>
              {complaint.feedback ? (
                <SubmittedFeedback
                  rating={complaint.feedback.rating}
                  comment={complaint.feedback.comment}
                  createdAt={complaint.feedback.created_at}
                  authorName={complaint.feedback.author?.full_name}
                />
              ) : canGiveFeedback ? (
                <FeedbackForm complaintId={complaint.id} />
              ) : (
                <p className="text-sm text-slate-500">
                  {isOwner
                    ? "You will be able to rate this complaint once it has been resolved."
                    : "No feedback has been submitted for this complaint yet."}
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ------------------------------------------------------ Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Progress" description="Where this complaint stands." />
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
              description="Recorded from the audit trail — every change is logged."
            />
            <StatusTimeline history={complaint.history} />
          </Card>

          <Card>
            <CardHeader title="People" />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {getInitials(complaint.submitter?.full_name ?? "User")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {complaint.submitter?.full_name ?? "Unknown"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {complaint.submitter?.email ?? ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <UserCheck className="size-4 text-slate-500" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Assigned to</p>
                  <p className="truncate text-sm font-medium text-slate-900">
                    {complaint.assignee?.full_name ?? "Not yet assigned"}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Complaint number" />
            <CardBody>
              <p className="flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2.5 font-mono text-sm font-semibold tracking-wider text-white">
                <FileText className="size-4 shrink-0 text-slate-400" aria-hidden />
                {complaint.complaint_number}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Quote this number in any correspondence about this complaint.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
