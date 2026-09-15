"use server";

import { revalidatePath } from "next/cache";

import {
  AuthorizationError,
  requireAuthenticatedUser,
} from "@/lib/services/auth-service";
import { createFeedback } from "@/lib/services/feedback-service";
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notification-service";
import { createFeedbackSchema } from "@/lib/validations/complaint";
import type { ActionState } from "@/lib/validations/common";
import { firstErrorMessage, toFieldErrors } from "@/lib/validations/common";

export type FeedbackActionState = ActionState<{ complaintId?: string }>;
export type SimpleActionState = ActionState<Record<string, never>>;

function toFailure(error: unknown): FeedbackActionState {
  if (error instanceof AuthorizationError) {
    return { status: "error", message: error.message };
  }
  const message = error instanceof Error ? error.message : "";
  return {
    status: "error",
    message:
      message.length > 0 && message.length < 300
        ? message
        : "Your feedback could not be submitted. Please try again.",
  };
}

export async function createFeedbackAction(
  _prev: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const parsed = createFeedbackSchema.safeParse({
    complaintId: formData.get("complaintId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
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
    await createFeedback(parsed.data, userId);

    revalidatePath(`/dashboard/complaints/${parsed.data.complaintId}`);
    revalidatePath("/dashboard");
    revalidatePath("/admin/feedback");

    return {
      status: "success",
      message: "Thank you! Your feedback has been recorded.",
      data: { complaintId: parsed.data.complaintId },
    };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function markNotificationReadAction(
  notificationId: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await requireAuthenticatedUser();
    await markNotificationRead(notificationId);
    revalidatePath("/notifications");
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch {
    return { ok: false, message: "The notification could not be updated." };
  }
}

export async function markAllNotificationsReadAction(): Promise<{
  ok: boolean;
  message?: string;
}> {
  try {
    const { userId } = await requireAuthenticatedUser();
    await markAllNotificationsRead(userId);
    revalidatePath("/notifications");
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch {
    return { ok: false, message: "Notifications could not be updated." };
  }
}

export async function deleteNotificationAction(
  notificationId: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await requireAuthenticatedUser();
    await deleteNotification(notificationId);
    revalidatePath("/notifications");
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch {
    return { ok: false, message: "The notification could not be deleted." };
  }
}
