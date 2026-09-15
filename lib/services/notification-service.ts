import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NotificationWithComplaint } from "@/types";

const NOTIFICATION_SELECT = `
  *,
  complaint:complaints!notifications_complaint_id_fkey ( id, complaint_number, title )
`;

export async function getUserNotifications(
  userId: string,
  limit = 50,
): Promise<NotificationWithComplaint[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}

/** Memoised unread badge count. */
export const getUnreadNotificationCount = cache(
  async (userId: string): Promise<number> => {
    const supabase = await createSupabaseServerClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    return count ?? 0;
  },
);

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw new Error("The notification could not be updated.");
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw new Error("Notifications could not be updated.");
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) throw new Error("The notification could not be deleted.");
}

/**
 * Creates a notification.
 *
 * Status-change and assignment notifications are written automatically by
 * database triggers; this function exists for the `createNotification()`
 * service hook required by the specification and for custom admin messages.
 */
export async function createNotification(params: {
  userId: string;
  complaintId?: string | null;
  title: string;
  message: string;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    complaint_id: params.complaintId ?? null,
    title: params.title,
    message: params.message,
  });

  // RLS only lets admins insert directly; trigger-driven notifications cover
  // every other case, so a failure here is not fatal.
  if (error) return;
}
