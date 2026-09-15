import type { Metadata } from "next";

import { requireProfile } from "@/lib/services/auth-service";
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/lib/services/notification-service";
import { NOTIFICATION_PAGE_SIZE } from "@/lib/constants";
import { PageHeader } from "@/components/ui/primitives";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const profile = await requireProfile();

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(profile.id, NOTIFICATION_PAGE_SIZE),
    getUnreadNotificationCount(profile.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Status updates on your complaints, newest first."
      />

      <NotificationList
        notifications={notifications}
        unreadCount={unreadCount}
        complaintBasePath={
          profile.role === "admin"
            ? "/admin/complaints"
            : "/dashboard/complaints"
        }
      />
    </div>
  );
}
