"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Save, UserCheck } from "lucide-react";
import { toast } from "sonner";

import {
  assignComplaintAction,
  updateComplaintStatusAction,
  type ComplaintActionState,
} from "@/lib/actions/complaint-actions";
import { initialActionState } from "@/lib/validations/common";
import { STATUS_META, nextStatuses } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Alert, Card, CardBody, CardHeader } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { ConfirmSubmit } from "@/components/ui/confirm-dialog";
import type { ComplaintStatus } from "@/types/database";

export type StaffOption = { id: string; full_name: string; email: string };

const STATUS_FORM_ID = "complaint-status-form";
const ASSIGN_FORM_ID = "complaint-assign-form";

export function ComplaintManager({
  complaintId,
  currentStatus,
  assignedTo,
  adminRemarks,
  resolutionNotes,
  staff,
  canAssign,
  canChangeStatus = true,
}: {
  complaintId: string;
  currentStatus: ComplaintStatus;
  assignedTo: string | null;
  adminRemarks: string | null;
  resolutionNotes: string | null;
  staff: StaffOption[];
  canAssign: boolean;
  canChangeStatus?: boolean;
}) {
  const router = useRouter();

  const available = React.useMemo(
    () => nextStatuses(currentStatus),
    [currentStatus],
  );

  const [statusState, statusAction, statusPending] = React.useActionState<
    ComplaintActionState,
    FormData
  >(updateComplaintStatusAction, initialActionState);

  const [assignState, assignAction, assignPending] = React.useActionState<
    ComplaintActionState,
    FormData
  >(assignComplaintAction, initialActionState);

  const [targetStatus, setTargetStatus] = React.useState<ComplaintStatus | "">(
    available[0] ?? "",
  );
  const [remarks, setRemarks] = React.useState(adminRemarks ?? "");
  const [notes, setNotes] = React.useState(resolutionNotes ?? "");
  const [selectedStaff, setSelectedStaff] = React.useState(assignedTo ?? "");

  React.useEffect(() => {
    if (statusState.status === "success") {
      toast.success(statusState.message);
      router.refresh();
    }
  }, [statusState, router]);

  React.useEffect(() => {
    if (assignState.status === "success") {
      toast.success(assignState.message);
      router.refresh();
    }
  }, [assignState, router]);

  const needsResolutionNotes =
    targetStatus === "Resolved" || targetStatus === "Closed";
  const isDestructive = targetStatus === "Rejected";

  const statusFieldErrors =
    statusState.status === "error" ? statusState.fieldErrors ?? {} : {};
  const assignFieldErrors =
    assignState.status === "error" ? assignState.fieldErrors ?? {} : {};

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------ Status */}
      <Card>
        <CardHeader
          title="Update status"
          description={
            available.length > 0
              ? `Allowed next steps from "${currentStatus}".`
              : "This complaint can no longer change status."
          }
        />
        <CardBody>
          {statusState.status === "error" && !statusState.fieldErrors ? (
            <Alert variant="error" className="mb-4">
              {statusState.message}
            </Alert>
          ) : null}

          {!canChangeStatus ? (
            <p className="text-sm text-slate-500">
              You can only update complaints that are assigned to you.
            </p>
          ) : available.length === 0 ? (
            <p className="text-sm text-slate-500">
              The status of this complaint cannot be changed any further.
            </p>
          ) : (
            <form id={STATUS_FORM_ID} action={statusAction} className="space-y-4">
              <input type="hidden" name="complaintId" value={complaintId} />

              <Field
                label="New status"
                htmlFor="status"
                required
                error={statusFieldErrors.status}
                hint={STATUS_META[currentStatus].description}
              >
                <Select
                  id="status"
                  name="status"
                  required
                  value={targetStatus}
                  onChange={(event) =>
                    setTargetStatus(event.target.value as ComplaintStatus)
                  }
                  disabled={statusPending}
                >
                  {available.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="space-y-1.5">
                <label
                  htmlFor="remarks"
                  className="block text-sm font-medium text-slate-700"
                >
                  Admin remarks
                  {isDestructive ? (
                    <span className="ml-1 text-rose-500">* required to reject</span>
                  ) : (
                    <span className="ml-1.5 text-xs font-normal text-slate-500">
                      (optional)
                    </span>
                  )}
                </label>
                <Textarea
                  id="remarks"
                  name="remarks"
                  rows={3}
                  maxLength={2000}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Visible to the complainant on their complaint page."
                  disabled={statusPending}
                  invalid={Boolean(statusFieldErrors.remarks)}
                />
                {statusFieldErrors.remarks ? (
                  <p role="alert" className="text-xs font-medium text-rose-600">
                    {statusFieldErrors.remarks}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="resolutionNotes"
                  className="block text-sm font-medium text-slate-700"
                >
                  Resolution notes
                  {needsResolutionNotes ? (
                    <span className="ml-1.5 text-xs font-normal text-slate-500">
                      (recommended when resolving)
                    </span>
                  ) : null}
                </label>
                <Textarea
                  id="resolutionNotes"
                  name="resolutionNotes"
                  rows={3}
                  maxLength={3000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="What was actually done to fix the issue?"
                  disabled={statusPending}
                  invalid={Boolean(statusFieldErrors.resolutionNotes)}
                  className={cn(needsResolutionNotes && "border-emerald-300")}
                />
                {statusFieldErrors.resolutionNotes ? (
                  <p role="alert" className="text-xs font-medium text-rose-600">
                    {statusFieldErrors.resolutionNotes}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {isDestructive || targetStatus === "Closed" ? (
                  <ConfirmSubmit
                    formId={STATUS_FORM_ID}
                    variant={isDestructive ? "danger" : "primary"}
                    title={
                      isDestructive
                        ? "Reject this complaint?"
                        : "Close this complaint?"
                    }
                    confirmLabel={
                      isDestructive ? "Reject complaint" : "Close complaint"
                    }
                    description={
                      isDestructive
                        ? "The complainant will be notified that their complaint was rejected. The remarks above will be shown to them, so make sure they explain the decision."
                        : "Closing marks the complaint as final. The complainant will no longer be able to submit feedback on it if they have not already."
                    }
                  >
                    {isDestructive ? null : (
                      <CheckCircle2 className="size-4" aria-hidden />
                    )}
                    {isDestructive ? "Reject complaint" : "Close complaint"}
                  </ConfirmSubmit>
                ) : (
                  <Button
                    type="submit"
                    loading={statusPending}
                    loadingText="Updating…"
                  >
                    <Save className="size-4" aria-hidden />
                    Update status
                  </Button>
                )}
              </div>
            </form>
          )}
        </CardBody>
      </Card>

      {/* ------------------------------------------------------ Assignment */}
      {canAssign ? (
        <Card>
          <CardHeader
            title="Assignment"
            description="Assign this complaint to a staff member. Assigning from Submitted or Under Review also moves it to Assigned."
          />
          <CardBody>
            {assignState.status === "error" && !assignState.fieldErrors ? (
              <Alert variant="error" className="mb-4">
                {assignState.message}
              </Alert>
            ) : null}

            {staff.length === 0 ? (
              <Alert variant="warning" title="No active staff accounts">
                Create a staff account from{" "}
                <a href="/admin/staff" className="underline underline-offset-2">
                  Staff management
                </a>{" "}
                before assigning complaints.
              </Alert>
            ) : (
              <form id={ASSIGN_FORM_ID} action={assignAction} className="space-y-4">
                <input type="hidden" name="complaintId" value={complaintId} />

                <Field
                  label="Assign to"
                  htmlFor="assignedTo"
                  error={assignFieldErrors.assignedTo}
                >
                  <Select
                    id="assignedTo"
                    name="assignedTo"
                    value={selectedStaff}
                    onChange={(event) => setSelectedStaff(event.target.value)}
                    disabled={assignPending}
                  >
                    <option value="">Unassigned</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} · {member.email}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="space-y-1.5">
                  <label
                    htmlFor="assign-remarks"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Remark
                    <span className="ml-1.5 text-xs font-normal text-slate-500">
                      (optional)
                    </span>
                  </label>
                  <Textarea
                    id="assign-remarks"
                    name="remarks"
                    rows={2}
                    maxLength={2000}
                    placeholder="Add a note for the person picking this up…"
                    disabled={assignPending}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={assignPending}
                  loadingText="Saving…"
                >
                  <UserCheck className="size-4" aria-hidden />
                  {selectedStaff ? "Save assignment" : "Unassign"}
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
