import { AppShellLayout } from "@/components/navigation/app-shell-layout";

export default function ProfileLayout({ children }: LayoutProps<"/profile">) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
