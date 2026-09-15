/**
 * Typed representation of the ResolveHub PostgreSQL schema.
 *
 * This mirrors `supabase/migrations/20260914000000_init_resolvehub.sql`.
 * If you change the schema, update this file (or regenerate with
 * `npx supabase gen types typescript --project-id <ref> > types/database.ts`).
 */

export type UserRole = "user" | "staff" | "admin";

export type ComplaintPriority = "Low" | "Medium" | "High" | "Critical";

export type ComplaintStatus =
  | "Submitted"
  | "Under Review"
  | "Assigned"
  | "In Progress"
  | "Resolved"
  | "Closed"
  | "Rejected";

// Declared `as const` so the literal union types survive into Zod schemas and
// the Supabase client, rather than widening to plain `string`.
export const USER_ROLES = ["user", "staff", "admin"] as const;

export const COMPLAINT_PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;

export const COMPLAINT_STATUSES = [
  "Submitted",
  "Under Review",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
  "Rejected",
] as const;

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  full_name: string;
  email: string;
  role?: UserRole;
  is_active?: boolean;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = {
  id?: string;
  full_name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
  avatar_url?: string | null;
  updated_at?: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type CategoryInsert = {
  id?: string;
  name: string;
  description?: string | null;
  created_at?: string;
};

export type CategoryUpdate = {
  name?: string;
  description?: string | null;
};

export type ComplaintRow = {
  id: string;
  complaint_number: string;
  user_id: string;
  category_id: string;
  assigned_to: string | null;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  image_url: string | null;
  location: string | null;
  admin_remarks: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  /** Internal sort helper: Critical=1 … Low=4. */
  priority_rank: number;
  /** Internal sort helper: Submitted=1 … Rejected=7. */
  status_rank: number;
};

export type ComplaintInsert = {
  id?: string;
  complaint_number?: string;
  user_id: string;
  category_id: string;
  assigned_to?: string | null;
  title: string;
  description: string;
  priority?: ComplaintPriority;
  status?: ComplaintStatus;
  image_url?: string | null;
  location?: string | null;
  admin_remarks?: string | null;
  resolution_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string | null;
};

export type ComplaintUpdate = Partial<Omit<ComplaintInsert, "user_id">>;

export type ComplaintStatusHistoryRow = {
  id: string;
  complaint_id: string;
  status: ComplaintStatus;
  changed_by: string;
  remarks: string | null;
  created_at: string;
};

export type ComplaintStatusHistoryInsert = {
  id?: string;
  complaint_id: string;
  status: ComplaintStatus;
  changed_by: string;
  remarks?: string | null;
  created_at?: string;
};

export type FeedbackRow = {
  id: string;
  complaint_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type FeedbackInsert = {
  id?: string;
  complaint_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
  created_at?: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  complaint_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type NotificationInsert = {
  id?: string;
  user_id: string;
  complaint_id?: string | null;
  title: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
};

export type NotificationUpdate = {
  is_read?: boolean;
  title?: string;
  message?: string;
};

export type AdminAnalytics = {
  total_complaints: number;
  by_status: Partial<Record<ComplaintStatus, number>>;
  by_priority: Partial<Record<ComplaintPriority, number>>;
  by_category: { category: string; count: number }[];
  critical_complaints: number;
  high_complaints: number;
  pending_complaints: number;
  resolved_complaints: number;
  closed_complaints: number;
  rejected_complaints: number;
  resolution_rate: number;
  avg_resolution_hours: number | null;
  avg_rating: number | null;
  feedback_count: number;
  total_users: number;
  total_staff: number;
  avg_per_category: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
        Relationships: [];
      };
      complaints: {
        Row: ComplaintRow;
        Insert: ComplaintInsert;
        Update: ComplaintUpdate;
        Relationships: [
          {
            foreignKeyName: "complaints_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      complaint_status_history: {
        Row: ComplaintStatusHistoryRow;
        Insert: ComplaintStatusHistoryInsert;
        Update: Partial<ComplaintStatusHistoryInsert>;
        Relationships: [
          {
            foreignKeyName: "complaint_status_history_complaint_id_fkey";
            columns: ["complaint_id"];
            isOneToOne: false;
            referencedRelation: "complaints";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaint_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      feedback: {
        Row: FeedbackRow;
        Insert: FeedbackInsert;
        Update: Partial<Pick<FeedbackInsert, "rating" | "comment">>;
        Relationships: [
          {
            foreignKeyName: "feedback_complaint_id_fkey";
            columns: ["complaint_id"];
            isOneToOne: true;
            referencedRelation: "complaints";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
        Relationships: [
          {
            foreignKeyName: "notifications_complaint_id_fkey";
            columns: ["complaint_id"];
            isOneToOne: false;
            referencedRelation: "complaints";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      admin_analytics: {
        Args: Record<string, never>;
        Returns: AdminAnalytics;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_admin_or_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      current_app_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      complaint_priority: ComplaintPriority;
      complaint_status: ComplaintStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};
