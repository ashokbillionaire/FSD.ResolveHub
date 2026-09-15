import { requireAdminProfile } from "@/lib/services/auth-service";
import { AppShellLayout } from "@/components/navigation/app-shell-layout";

/**
 * Admin section guard.
 *
 * `requireAdminProfile()` redirects non-admins before anything renders, and the
 * middleware blocks /admin earlier still. Every server action behind these pages
 * re-checks the caller's role independently.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdminProfile();
  return <AppShellLayout>{children}</AppShellLayout>;
}
