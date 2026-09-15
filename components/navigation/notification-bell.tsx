"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox } from "lucide-react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/feedback-actions";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CountBadge } from "@/components/ui/badges";
import type { NotificationWithComplaint } from "@/types";

/**
 * Notification dropdown in the top bar.
 *
 * `notifications` comes from the server on every render, and RealtimeRefresher
 * triggers `router.refresh()` when a new row arrives, so this list stays live
 * without a manual reload.
 */
export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationWithComplaint[];
  unreadCount: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleMarkRead(id: string) {
    setPendingId(id);
    await markNotificationReadAction(id);
    setPendingId(null);
    router.refresh();
  }

  async function handleMarkAllRead() {
    setPendingId("all");
    await markAllNotificationsReadAction();
    setPendingId(null);
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="size-5" aria-hidden />
        {unreadCount > 0 ? (
          <CountBadge
            count={unreadCount}
            className="absolute -top-0.5 -right-0.5"
          />
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:w-96"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={pendingId === "all"}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
              >
                <CheckCheck className="size-3.5" aria-hidden />
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Inbox className="mx-auto size-6 text-slate-300" aria-hidden />
                <p className="mt-2 text-sm font-medium text-slate-600">
                  No notifications yet
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  We&apos;ll let you know when a complaint is updated.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.slice(0, 8).map((notification) => {
                  const content = (
                    <>
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-1.5 size-1.5 shrink-0 rounded-full",
                            notification.is_read ? "bg-slate-200" : "bg-brand-500",
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-xs",
                              notification.is_read
                                ? "font-medium text-slate-600"
                                : "font-semibold text-slate-900",
                            )}
                          >
                            {notification.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-600">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {formatRelativeTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </>
                  );

                  return (
                    <li key={notification.id}>
                      <div className="group relative px-4 py-3 hover:bg-slate-50">
                        {notification.complaint ? (
                          <Link
                            href={`/dashboard/complaints/${notification.complaint.id}`}
                            onClick={() => {
                              if (!notification.is_read) {
                                void handleMarkRead(notification.id);
                              }
                              setOpen(false);
                            }}
                            className="block"
                          >
                            {content}
                          </Link>
                        ) : (
                          <div>{content}</div>
                        )}

                        {!notification.is_read ? (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(notification.id)}
                            disabled={pendingId === notification.id}
                            className="mt-2 text-[11px] font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                          >
                            Mark as read
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-200 p-2">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full">
                View all notifications
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
