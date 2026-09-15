"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/feedback-actions";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { NotificationWithComplaint } from "@/types";

export function NotificationList({
  notifications,
  unreadCount,
  complaintBasePath,
}: {
  notifications: NotificationWithComplaint[];
  unreadCount: number;
  complaintBasePath: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<NotificationWithComplaint | null>(null);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const visible =
    filter === "unread"
      ? notifications.filter((notification) => !notification.is_read)
      : notifications;

  async function handleMarkRead(id: string) {
    setPendingId(id);
    const result = await markNotificationReadAction(id);
    setPendingId(null);
    if (result.ok) router.refresh();
    else toast.error(result.message ?? "Could not update the notification.");
  }

  async function handleMarkAllRead() {
    setPendingId("all");
    const result = await markAllNotificationsReadAction();
    setPendingId(null);
    if (result.ok) {
      toast.success("All notifications marked as read.");
      router.refresh();
    } else {
      toast.error(result.message ?? "Could not update notifications.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setPendingId(target.id);
    const result = await deleteNotificationAction(target.id);
    setPendingId(null);
    setDeleteTarget(null);
    if (result.ok) {
      toast.success("Notification deleted.");
      router.refresh();
    } else {
      toast.error(result.message ?? "Could not delete the notification.");
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-1.5">
          {(["all", "unread"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === option
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
              )}
            >
              {option}
              {option === "unread" && unreadCount > 0 ? (
                <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            loading={pendingId === "all"}
          >
            <Check className="size-3.5" aria-hidden />
            Mark all as read
          </Button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-900">
            {filter === "unread"
              ? "No unread notifications"
              : "No notifications yet"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {filter === "unread"
              ? "You are all caught up."
              : "Status updates on your complaints will appear here."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((notification) => (
            <li
              key={notification.id}
              className={cn(
                "flex gap-3.5 px-4 py-4 transition-colors sm:px-5",
                !notification.is_read && "bg-brand-50/40",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 size-2.5 shrink-0 rounded-full",
                  notification.is_read ? "bg-slate-200" : "bg-brand-500",
                )}
                aria-hidden
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p
                    className={cn(
                      "text-sm",
                      notification.is_read
                        ? "font-medium text-slate-700"
                        : "font-semibold text-slate-900",
                    )}
                  >
                    {notification.title}
                  </p>
                  <span className="text-xs text-slate-400">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-600">
                  {notification.message}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {notification.complaint ? (
                    <Link
                      href={`${complaintBasePath}/${notification.complaint.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      {notification.complaint.complaint_number}
                      <ExternalLink className="size-3" aria-hidden />
                    </Link>
                  ) : null}

                  <time
                    dateTime={notification.created_at}
                    className="hidden text-xs text-slate-400 sm:inline"
                    title={formatDateTime(notification.created_at)}
                  >
                    {formatDateTime(notification.created_at)}
                  </time>

                  {!notification.is_read ? (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(notification.id)}
                      disabled={pendingId === notification.id}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                    >
                      Mark as read
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(notification)}
                    disabled={pendingId === notification.id}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-600 disabled:opacity-50"
                  >
                    <Trash2 className="size-3" aria-hidden />
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this notification?"
        description="The notification will be removed from your list. The complaint itself is not affected."
        confirmLabel="Delete"
        loading={pendingId === deleteTarget?.id}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
