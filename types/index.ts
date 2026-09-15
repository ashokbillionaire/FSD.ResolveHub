import type {
  CategoryRow,
  ComplaintPriority,
  ComplaintRow,
  ComplaintStatus,
  ComplaintStatusHistoryRow,
  FeedbackRow,
  NotificationRow,
  ProfileRow,
} from "@/types/database";

/** Subset of a profile embedded into complaint queries. */
export type ProfileSummary = Pick<
  ProfileRow,
  "id" | "full_name" | "email" | "avatar_url"
>;

/** A complaint with its category, submitter and assignee resolved. */
export type ComplaintWithRelations = ComplaintRow & {
  category: Pick<CategoryRow, "id" | "name"> | null;
  submitter: ProfileSummary | null;
  assignee: ProfileSummary | null;
};

/** Timeline entry with the person who made the change. */
export type StatusHistoryEntry = ComplaintStatusHistoryRow & {
  actor: ProfileSummary | null;
};

/** Everything the complaint details page needs. */
export type ComplaintDetail = ComplaintWithRelations & {
  history: StatusHistoryEntry[];
  feedback: (FeedbackRow & { author: ProfileSummary | null }) | null;
};

export type NotificationWithComplaint = NotificationRow & {
  complaint: { id: string; complaint_number: string; title: string } | null;
};

export type StaffMember = ProfileRow & {
  assigned_count: number;
  open_count: number;
  resolved_count: number;
};

export type CategoryWithCount = CategoryRow & {
  complaint_count: number;
};

export type FeedbackWithRelations = FeedbackRow & {
  author: ProfileSummary | null;
  complaint: {
    id: string;
    complaint_number: string;
    title: string;
    category: { name: string } | null;
  } | null;
};

/** Counts shown on the user dashboard. */
export type UserDashboardStats = {
  total: number;
  submitted: number;
  underReview: number;
  inProgress: number;
  resolved: number;
  closed: number;
  rejected: number;
  unreadNotifications: number;
};

/** Counts shown on the staff dashboard. */
export type StaffDashboardStats = {
  assigned: number;
  open: number;
  inProgress: number;
  resolved: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type {
  CategoryRow,
  ComplaintPriority,
  ComplaintRow,
  ComplaintStatus,
  FeedbackRow,
  NotificationRow,
  ProfileRow,
  ProfileSummary as ProfileSummaryRow,
};
