"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requireAdmin,
  requireAuthenticatedUser,
  requireStaffOrAdmin,
  AuthorizationError,
  getUserProfile,
} from "@/lib/services/auth-service";
import {
  assignComplaint,
  createComplaint,
  deleteDraftComplaint,
  updateComplaintStatus,
} from "@/lib/services/complaint-service";
import {
  assignComplaintSchema,
  createComplaintSchema,
  updateComplaintStatusSchema,
} from "@/lib/validations/complaint";
import type { ActionState } from "@/lib/validations/common";
import { firstErrorMessage, toFieldErrors } from "@/lib/validations/common";

export type ComplaintActionState = ActionState<{
  complaintId?: string;
  complaintNumber?: string;
}>;

/**
 * Turns any thrown error into a safe, human message.
 *
 * Raw Postgres / PostgREST errors are never surfaced; only the deliberate
 * messages raised by our own service layer and database triggers.
 */
function toActionFailure(error: unknown): ComplaintActionState {
  if (error instanceof AuthorizationError) {
    return { status: "error", message: error.message };
  }

  const message = error instanceof Error ? error.message : "";

  const isSafeMessage =
    message.length > 0 &&
    message.length < 300 &&
    !/relation|column|constraint|syntax|policy|pg_|postgrest|JWT|json/i.test(message);

  return {
    status: "error",
    message: isSafeMessage
      ? message
      : "Something went wrong on our side. Please try again in a moment.",
  };
}

function revalidateComplaint(complaintId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/complaints");
  revalidatePath(`/dashboard/complaints/${complaintId}`);
  revalidatePath("/dashboard/assigned");
  revalidatePath("/admin");
  revalidatePath("/admin/complaints");
  revalidatePath(`/admin/complaints/${complaintId}`);
  revalidatePath("/notifications");
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createComplaintAction(
  _prev: ComplaintActionState,
  formData: FormData,
): Promise<ComplaintActionState> {
  const parsed = createComplaintSchema.safeParse({
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
    priority: formData.get("priority"),
    description: formData.get("description"),
    location: formData.get("location"),
    imagePath: formData.get("imagePath"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstErrorMessage(parsed.error),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    const { userId } = await requireAuthenticatedUser();
    const created = await createComplaint(parsed.data, userId);

    revalidateComplaint(created.id);

    return {
      status: "success",
      message: "Complaint submitted successfully.",
      data: { complaintId: created.id, complaintNumber: created.complaint_number },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Status change (admin + staff)
// ---------------------------------------------------------------------------
export async function updateComplaintStatusAction(
  _prev: ComplaintActionState,
  formData: FormData,
): Promise<ComplaintActionState> {
  const parsed = updateComplaintStatusSchema.safeParse({
    complaintId: formData.get("complaintId"),
    status: formData.get("status"),
    remarks: formData.get("remarks"),
    resolutionNotes: formData.get("resolutionNotes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstErrorMessage(parsed.error),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    await requireStaffOrAdmin();
    const result = await updateComplaintStatus(parsed.data);

    revalidateComplaint(parsed.data.complaintId);

    return {
      status: "success",
      message: `Status updated to "${result.status}". The complainant has been notified.`,
      data: { complaintId: parsed.data.complaintId },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Assignment (admin only)
// ---------------------------------------------------------------------------
export async function assignComplaintAction(
  _prev: ComplaintActionState,
  formData: FormData,
): Promise<ComplaintActionState> {
  const parsed = assignComplaintSchema.safeParse({
    complaintId: formData.get("complaintId"),
    assignedTo: formData.get("assignedTo"),
    remarks: formData.get("remarks"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstErrorMessage(parsed.error),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    await requireAdmin();
    await assignComplaint(parsed.data);

    revalidateComplaint(parsed.data.complaintId);
    revalidatePath("/admin/staff");

    return {
      status: "success",
      message: parsed.data.assignedTo
        ? "Complaint assigned successfully."
        : "Complaint unassigned.",
      data: { complaintId: parsed.data.complaintId },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Withdraw — plain form action used by the confirmation dialog
// ---------------------------------------------------------------------------
export async function withdrawComplaintAction(formData: FormData): Promise<void> {
  const complaintId = String(formData.get("complaintId") ?? "");
  if (!complaintId) return;

  try {
    await requireAuthenticatedUser();
    await deleteDraftComplaint(complaintId);
    revalidateComplaint(complaintId);
  } catch {
    // The list page re-renders with the complaint still present, which already
    // communicates that the withdrawal did not go through.
  }

  redirect("/dashboard/complaints");
}

// ---------------------------------------------------------------------------
// Delete (owner, only while still 'Submitted')
// ---------------------------------------------------------------------------
export async function deleteDraftComplaintAction(
  _prev: ComplaintActionState,
  formData: FormData,
): Promise<ComplaintActionState> {
  const complaintId = String(formData.get("complaintId") ?? "");
  if (!complaintId) {
    return { status: "error", message: "Invalid complaint." };
  }

  try {
    const { userId } = await requireAuthenticatedUser();
    const profile = await getUserProfile(userId);

    if (!profile) {
      return { status: "error", message: "Your profile could not be loaded." };
    }

    await deleteDraftComplaint(complaintId);

    revalidateComplaint(complaintId);

    return {
      status: "success",
      message: "Complaint withdrawn.",
      data: { complaintId },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
