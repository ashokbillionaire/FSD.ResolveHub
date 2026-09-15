import { AppShellLayout } from "@/components/navigation/app-shell-layout";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
