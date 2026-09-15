"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";

import { signOutAction } from "@/lib/actions/auth-actions";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/primitives";
import { CountBadge, RoleBadge } from "@/components/ui/badges";
import { navSectionsForRole, BrandIcon } from "@/components/navigation/nav-config";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";
import type { NotificationWithComplaint } from "@/types";
import type { ProfileRow } from "@/types/database";

export type AppShellProps = {
  profile: ProfileRow;
  unreadCount: number;
  notifications: NotificationWithComplaint[];
  children: React.ReactNode;
};

export function AppShell({
  profile,
  unreadCount,
  notifications,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const sections = navSectionsForRole(profile.role);

  // The drawer is open only while the path is still the one it was opened on.
  // Navigating therefore closes it with no effect and no extra state churn.
  const [drawerPath, setDrawerPath] = React.useState<string | null>(null);
  const mobileOpen = drawerPath === pathname;

  const setMobileOpen = React.useCallback(
    (open: boolean) => setDrawerPath(open ? pathname : null),
    [pathname],
  );

  // Lock body scroll while the drawer is open.
  React.useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-600">
          <BrandIcon className="size-4.5 text-white" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{APP_NAME}</p>
          <p className="truncate text-[11px] text-slate-500">{APP_TAGLINE}</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="ml-auto rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <nav
        aria-label="Main navigation"
        className="hide-scrollbar flex-1 overflow-y-auto px-3 pb-4"
      >
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-brand-600" : "text-slate-400",
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{item.label}</span>
                      {item.showBadge ? (
                        <CountBadge count={unreadCount} className="ml-auto" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-900">
              {profile.full_name}
            </p>
            <p className="truncate text-[11px] text-slate-500">{profile.email}</p>
          </div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="size-4 text-slate-400" aria-hidden />
            Log out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <RealtimeRefresher userId={profile.id} />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <div className="relative h-full w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-xl">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <Link
            href={profile.role === "admin" ? "/admin" : "/dashboard"}
            className="flex items-center gap-2 lg:hidden"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-brand-600">
              <BrandIcon className="size-4 text-white" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-slate-900">{APP_NAME}</span>
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
            />
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-slate-100"
              aria-label="Open your profile"
            >
              <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block max-w-32 truncate text-xs font-medium text-slate-900">
                  {profile.full_name}
                </span>
                <RoleBadge role={profile.role} />
              </span>
            </Link>
          </div>
        </header>

        <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
