import { requireProfile } from "@/lib/services/auth-service";
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/lib/services/notification-service";
import { AppShell } from "@/components/navigation/app-shell";

/**
 * Server-side wrapper around `AppShell`.
 *
 * Loads the signed-in profile, recent notifications and the unread badge count,
 * then hands them to the interactive shell. Used by every layout under
 * /dashboard, /admin, /notifications and /profile so the sidebar behaves
 * identically everywhere and the data is fetched exactly once per request.
 */
export async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(profile.id, 10),
    getUnreadNotificationCount(profile.id),
  ]);

  return (
    <AppShell
      profile={profile}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
