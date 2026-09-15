import { AppShellLayout } from "@/components/navigation/app-shell-layout";

export default function NotificationsLayout({
  children,
}: LayoutProps<"/notifications">) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
