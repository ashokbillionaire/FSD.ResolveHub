import type { ComplaintPriority, ComplaintStatus } from "@/types/database";

export const APP_NAME = "ResolveHub";
export const APP_TAGLINE = "Smart Complaint Management System";

export const IMAGE_BUCKET = "complaint-images";

/** Human labels + Tailwind classes for every complaint status. */
export type StatusMeta = {
  label: ComplaintStatus;
  /** Short description shown in the details page. */
  description: string;
  badge: string;
  dot: string;
};

export const STATUS_META: Record<ComplaintStatus, StatusMeta> = {
  Submitted: {
    label: "Submitted",
    description: "The complaint has been received and is queued for review.",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-400",
  },
  "Under Review": {
    label: "Under Review",
    description: "An administrator is reviewing the complaint.",
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
  },
  Assigned: {
    label: "Assigned",
    description: "A staff member has been assigned to handle the complaint.",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    dot: "bg-indigo-500",
  },
  "In Progress": {
    label: "In Progress",
    description: "Work on the complaint is currently underway.",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  Resolved: {
    label: "Resolved",
    description: "The issue has been resolved. Please share your feedback.",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  Closed: {
    label: "Closed",
    description: "The complaint has been reviewed and closed.",
    badge: "bg-teal-50 text-teal-700 ring-teal-200",
    dot: "bg-teal-600",
  },
  Rejected: {
    label: "Rejected",
    description: "The complaint was rejected. See the administrator's remarks.",
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
  },
};

export type PriorityMeta = {
  label: ComplaintPriority;
  badge: string;
  dot: string;
  description: string;
};

export const PRIORITY_META: Record<ComplaintPriority, PriorityMeta> = {
  Low: {
    label: "Low",
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
    description: "Minor inconvenience, no immediate impact.",
  },
  Medium: {
    label: "Medium",
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
    description: "Noticeable impact on daily activity.",
  },
  High: {
    label: "High",
    badge: "bg-orange-50 text-orange-700 ring-orange-200",
    dot: "bg-orange-500",
    description: "Serious impact that needs prompt attention.",
  },
  Critical: {
    label: "Critical",
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    description: "Safety risk or a complete service outage.",
  },
};

/**
 * Allowed status transitions.
 *
 * The canonical path is
 *   Submitted → Under Review → Assigned → In Progress → Resolved → Closed
 * with Rejected reachable from any state that is not already final.
 * Anything else (e.g. Submitted → Closed) is rejected by the server action.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  Submitted: ["Under Review", "Assigned", "Rejected"],
  "Under Review": ["Assigned", "In Progress", "Rejected", "Under Review"],
  Assigned: ["In Progress", "Resolved", "Rejected", "Under Review", "Assigned"],
  "In Progress": ["Resolved", "Rejected", "Assigned", "In Progress"],
  Resolved: ["Closed", "In Progress", "Resolved"],
  Closed: ["Closed"],
  Rejected: ["Under Review", "Rejected"],
};

export const TERMINAL_STATUSES: readonly ComplaintStatus[] = ["Closed"];

export const OPEN_STATUSES: readonly ComplaintStatus[] = [
  "Submitted",
  "Under Review",
  "Assigned",
  "In Progress",
];

export function canTransition(
  from: ComplaintStatus,
  to: ComplaintStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: ComplaintStatus): ComplaintStatus[] {
  return (ALLOWED_STATUS_TRANSITIONS[from] ?? []).filter((s) => s !== from);
}

/** Ordered workflow used by the timeline component. */
export const WORKFLOW_ORDER: ComplaintStatus[] = [
  "Submitted",
  "Under Review",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
];

export const PROFILE_PAGE_SIZE = 10;
export const ADMIN_PAGE_SIZE = 10;
export const NOTIFICATION_PAGE_SIZE = 20;
