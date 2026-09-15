import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  MessageSquareQuote,
  PlusCircle,
  User,
  Users,
} from "lucide-react";

import type { UserRole } from "@/types/database";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Show the unread notification count next to this item. */
  showBadge?: boolean;
  /** Highlight only on an exact path match. */
  exact?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const USER_NAV: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { label: "My Complaints", href: "/dashboard/complaints", icon: ClipboardList },
      { label: "Submit Complaint", href: "/dashboard/complaints/new", icon: PlusCircle },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, showBadge: true },
      { label: "Profile", href: "/profile", icon: User },
    ],
  },
];

export const STAFF_NAV: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { label: "Assigned Complaints", href: "/dashboard/assigned", icon: ClipboardList },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, showBadge: true },
      { label: "Profile", href: "/profile", icon: User },
    ],
  },
];

export const ADMIN_NAV: NavSection[] = [
  {
    title: "Administration",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "All Complaints", href: "/admin/complaints", icon: ClipboardList },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Staff", href: "/admin/staff", icon: Users },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Feedback", href: "/admin/feedback", icon: MessageSquareQuote },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, showBadge: true },
      { label: "Profile", href: "/profile", icon: User },
    ],
  },
];

export function navSectionsForRole(role: UserRole): NavSection[] {
  switch (role) {
    case "admin":
      return ADMIN_NAV;
    case "staff":
      return STAFF_NAV;
    default:
      return USER_NAV;
  }
}

/** Brand mark used in the sidebar and landing header. */
export const BrandIcon = Building2;
