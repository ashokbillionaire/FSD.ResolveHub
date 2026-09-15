import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AuthorizationError } from "@/lib/services/auth-service";
import {
  buildComplaintQuery,
  COMPLAINT_SELECT,
} from "@/lib/services/complaint-query";
import { ADMIN_PAGE_SIZE, OPEN_STATUSES } from "@/lib/constants";
import type { AdminAnalytics, ProfileRow } from "@/types/database";
import type {
  ComplaintWithRelations,
  FeedbackWithRelations,
  PaginatedResult,
  StaffMember,
} from "@/types";
import type { ComplaintFilterInput } from "@/lib/validations/complaint";
import type { CreateStaffInput } from "@/lib/validations/auth";

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------
export async function getAllComplaints(
  filter: ComplaintFilterInput,
): Promise<PaginatedResult<ComplaintWithRelations>> {
  const supabase = await createSupabaseServerClient();
  const builder = buildComplaintQuery(supabase, filter, {
    pageSize: ADMIN_PAGE_SIZE,
  });

  const { data, error, count } = await builder.run();
  if (error) {
    throw new Error("Complaints could not be loaded. Please try again.");
  }

  const total = count ?? 0;
  return {
    items: data ?? [],
    total,
    page: filter.page,
    pageSize: builder.pageSize,
    totalPages: Math.max(1, Math.ceil(total / builder.pageSize)),
  };
}

export async function getRecentComplaints(
  limit = 5,
): Promise<ComplaintWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("complaints")
    .select(COMPLAINT_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getCriticalComplaints(
  limit = 5,
): Promise<ComplaintWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("complaints")
    .select(COMPLAINT_SELECT)
    .eq("priority", "Critical")
    .in("status", [...OPEN_STATUSES])
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
export const EMPTY_ANALYTICS: AdminAnalytics = {
  total_complaints: 0,
  by_status: {},
  by_priority: {},
  by_category: [],
  critical_complaints: 0,
  high_complaints: 0,
  pending_complaints: 0,
  resolved_complaints: 0,
  closed_complaints: 0,
  rejected_complaints: 0,
  resolution_rate: 0,
  avg_resolution_hours: null,
  avg_rating: null,
  feedback_count: 0,
  total_users: 0,
  total_staff: 0,
  avg_per_category: 0,
};

/**
 * Real statistics computed by the `admin_analytics()` PostgreSQL function from
 * actual rows and timestamps — nothing here is mocked.
 */
export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_analytics");

  if (error || !data) {
    // Surface the failure instead of silently showing zeros.
    throw new Error(
      "Dashboard statistics could not be loaded. Make sure the database migration has been applied.",
    );
  }

  return data as AdminAnalytics;
}

// ---------------------------------------------------------------------------
// Staff management
// ---------------------------------------------------------------------------
export async function getStaffList(): Promise<StaffMember[]> {
  const supabase = await createSupabaseServerClient();

  const [staffResult, complaintsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "staff")
      .order("full_name", { ascending: true }),
    supabase
      .from("complaints")
      .select("assigned_to, status")
      .not("assigned_to", "is", null),
  ]);

  if (staffResult.error) {
    throw new Error("Staff accounts could not be loaded.");
  }

  const counts = new Map<string, { total: number; open: number; resolved: number }>();
  for (const row of complaintsResult.data ?? []) {
    if (!row.assigned_to) continue;
    const entry = counts.get(row.assigned_to) ?? { total: 0, open: 0, resolved: 0 };
    entry.total += 1;
    if ((OPEN_STATUSES as readonly string[]).includes(row.status)) entry.open += 1;
    if (row.status === "Resolved" || row.status === "Closed") entry.resolved += 1;
    counts.set(row.assigned_to, entry);
  }

  return (staffResult.data ?? []).map((profile) => {
    const entry = counts.get(profile.id) ?? { total: 0, open: 0, resolved: 0 };
    return {
      ...profile,
      assigned_count: entry.total,
      open_count: entry.open,
      resolved_count: entry.resolved,
    };
  });
}

/** Lightweight list used to populate "assign to" dropdowns. */
export async function getAssignableStaff(): Promise<
  Pick<ProfileRow, "id" | "full_name" | "email" | "is_active">[]
> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_active")
    .eq("role", "staff")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  return data ?? [];
}

/**
 * Creates a staff account.
 *
 * Requires the service-role key because creating an Auth user is a privileged
 * operation. The caller has already been verified as an admin by the server
 * action, and this function re-verifies independently.
 */
export async function createStaffAccount(
  input: CreateStaffInput,
  callerIsAdmin: boolean,
): Promise<{ id: string; email: string }> {
  if (!callerIsAdmin) {
    throw new AuthorizationError("Only administrators can create staff accounts.");
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true, // staff accounts are created by an admin, so trust the address
    user_metadata: { full_name: input.fullName },
  });

  if (error || !data.user) {
    const message = error?.message ?? "";
    if (message.toLowerCase().includes("already") || message.toLowerCase().includes("registered")) {
      throw new Error("An account with that email address already exists.");
    }
    throw new Error(
      "The staff account could not be created. Check the SUPABASE_SERVICE_ROLE_KEY and try again.",
    );
  }

  // The on_auth_user_created trigger has just inserted a "user" profile.
  // Promote it to staff, which requires bypassing RLS.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "staff", full_name: input.fullName, email: input.email })
    .eq("id", data.user.id);

  if (profileError) {
    // Roll back so we do not leave an account that can log in as a user.
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error("The staff profile could not be created. Please try again.");
  }

  return { id: data.user.id, email: input.email };
}

export async function setStaffActive(
  staffId: string,
  isActive: boolean,
  callerIsAdmin: boolean,
): Promise<void> {
  if (!callerIsAdmin) {
    throw new AuthorizationError("Only administrators can change account status.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", staffId)
    .eq("role", "staff");

  if (error) throw new Error("The staff account status could not be updated.");
}

export async function deleteStaffAccount(
  staffId: string,
  callerIsAdmin: boolean,
): Promise<void> {
  if (!callerIsAdmin) {
    throw new AuthorizationError("Only administrators can delete staff accounts.");
  }

  const admin = createSupabaseAdminClient();

  // Refuse to delete a staff member who still owns active work.
  const { count } = await admin
    .from("complaints")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", staffId)
    .in("status", [...OPEN_STATUSES]);

  if ((count ?? 0) > 0) {
    throw new Error(
      `This staff member still has ${count} open complaint(s). Reassign them before deleting the account.`,
    );
  }

  // Deleting the Auth user cascades to the profile; complaints keep their
  // history because complaints.assigned_to is ON DELETE SET NULL.
  const { error } = await admin.auth.admin.deleteUser(staffId);
  if (error) throw new Error("The staff account could not be deleted.");
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------
export async function getAllFeedback(
  page = 1,
  pageSize = 10,
): Promise<PaginatedResult<FeedbackWithRelations>> {
  const supabase = await createSupabaseServerClient();

  const from = (page - 1) * pageSize;
  const { data, error, count } = await supabase
    .from("feedback")
    .select(
      `*,
       author:profiles!feedback_user_id_fkey ( id, full_name, email, avatar_url ),
       complaint:complaints!feedback_complaint_id_fkey ( id, complaint_number, title, category:categories ( name ) )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error("Feedback could not be loaded.");

  const total = count ?? 0;
  return {
    // The embedded complaint's category is a nested array shape; normalise it.
    items: (data ?? []) as unknown as FeedbackWithRelations[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getStaffPerformance(): Promise<
  { id: string; name: string; resolved: number; open: number }[]
> {
  const staff = await getStaffList();
  return staff.map((member) => ({
    id: member.id,
    name: member.full_name,
    resolved: member.resolved_count,
    open: member.open_count,
  }));
}
