import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IMAGE_BUCKET, canTransition, OPEN_STATUSES } from "@/lib/constants";
import { buildComplaintQuery, COMPLAINT_SELECT } from "@/lib/services/complaint-query";
import { AuthorizationError, getUserProfile } from "@/lib/services/auth-service";
import { getSupabaseUrl } from "@/lib/env";
import type { ComplaintStatus } from "@/types/database";
import type {
  ComplaintDetail,
  ComplaintWithRelations,
  PaginatedResult,
  StaffDashboardStats,
  StatusHistoryEntry,
  UserDashboardStats,
} from "@/types";
import type {
  AssignComplaintInput,
  ComplaintFilterInput,
  CreateComplaintInput,
  UpdateComplaintStatusInput,
} from "@/lib/validations/complaint";

/** Public URL for an object in the complaint-images bucket. */
export function buildPublicImageUrl(objectPath: string): string {
  const base = getSupabaseUrl().replace(/\/+$/, "");
  const clean = objectPath.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${IMAGE_BUCKET}/${clean}`;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createComplaint(
  input: CreateComplaintInput,
  userId: string,
): Promise<{ id: string; complaint_number: string }> {
  const supabase = await createSupabaseServerClient();

  // Never trust a client-supplied URL — rebuild it from the storage path,
  // which the storage RLS policy has already scoped to this user's folder.
  const imageUrl = input.imagePath ? buildPublicImageUrl(input.imagePath) : null;

  const { data, error } = await supabase
    .from("complaints")
    .insert({
      user_id: userId,
      category_id: input.categoryId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      location: input.location,
      image_url: imageUrl,
      // `status` is intentionally omitted: the database default ('Submitted')
      // applies, and the trigger records the first history row.
    })
    .select("id, complaint_number")
    .single();

  if (error || !data) {
    if (error?.code === "42501") {
      if (error?.message?.toLowerCase().includes("sequence")) {
        throw new Error(
          "Database sequence permission error. Please run the SQL fix in Supabase SQL editor to grant permissions on complaint_number_seq.",
        );
      }
      throw new Error("You are not allowed to create complaints.");
    }
    if (error?.code === "23503") {
      throw new Error("The selected category no longer exists. Please pick another.");
    }
    throw new Error(
      "The complaint could not be saved. Please check the details and try again.",
    );
  }

  return data;
}

// ---------------------------------------------------------------------------
// Read — user
// ---------------------------------------------------------------------------
export async function getUserComplaints(
  userId: string,
  filter: ComplaintFilterInput,
): Promise<PaginatedResult<ComplaintWithRelations>> {
  const supabase = await createSupabaseServerClient();
  const builder = buildComplaintQuery(supabase, filter, { ownerId: userId });

  const { data, error, count } = await builder.run();
  if (error) {
    throw new Error("Your complaints could not be loaded. Please try again.");
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

export async function getUserDashboardStats(
  userId: string,
): Promise<UserDashboardStats> {
  const supabase = await createSupabaseServerClient();

  const [complaints, unread] = await Promise.all([
    supabase.from("complaints").select("status").eq("user_id", userId),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false),
  ]);

  const rows = complaints.data ?? [];
  const countOf = (status: ComplaintStatus) =>
    rows.filter((row) => row.status === status).length;

  return {
    total: rows.length,
    submitted: countOf("Submitted"),
    underReview: countOf("Under Review"),
    inProgress: countOf("In Progress") + countOf("Assigned"),
    resolved: countOf("Resolved"),
    closed: countOf("Closed"),
    rejected: countOf("Rejected"),
    unreadNotifications: unread.count ?? 0,
  };
}

export async function getRecentUserComplaints(
  userId: string,
  limit = 5,
): Promise<ComplaintWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("complaints")
    .select(COMPLAINT_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Read — single complaint
// ---------------------------------------------------------------------------
export const getComplaintById = cache(
  async (complaintId: string): Promise<ComplaintDetail | null> => {
    const supabase = await createSupabaseServerClient();

    const { data: complaint, error } = await supabase
      .from("complaints")
      .select(COMPLAINT_SELECT)
      .eq("id", complaintId)
      .maybeSingle();

    // RLS silently returns no rows for complaints the caller may not see,
    // which is exactly the behaviour we want (no information leak).
    if (error || !complaint) return null;

    const [historyResult, feedbackResult] = await Promise.all([
      supabase
        .from("complaint_status_history")
        .select(
          `*,
           actor:profiles!complaint_status_history_changed_by_fkey ( id, full_name, email, avatar_url )`,
        )
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: true }),
      supabase
        .from("feedback")
        .select(
          `*,
           author:profiles!feedback_user_id_fkey ( id, full_name, email, avatar_url )`,
        )
        .eq("complaint_id", complaintId)
        .maybeSingle(),
    ]);

    return {
      ...complaint,
      history: (historyResult.data ?? []) as StatusHistoryEntry[],
      feedback: feedbackResult.data ?? null,
    };
  },
);

export async function getComplaintHistory(
  complaintId: string,
): Promise<StatusHistoryEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("complaint_status_history")
    .select(
      `*,
       actor:profiles!complaint_status_history_changed_by_fkey ( id, full_name, email, avatar_url )`,
    )
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });

  return (data ?? []) as StatusHistoryEntry[];
}

// ---------------------------------------------------------------------------
// Read — staff
// ---------------------------------------------------------------------------
export async function getStaffComplaints(
  staffId: string,
  filter: ComplaintFilterInput,
): Promise<PaginatedResult<ComplaintWithRelations>> {
  const supabase = await createSupabaseServerClient();
  const builder = buildComplaintQuery(supabase, filter, { assignedTo: staffId });

  const { data, error, count } = await builder.run();
  if (error) {
    throw new Error("Your assigned complaints could not be loaded.");
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

export async function getStaffDashboardStats(
  staffId: string,
): Promise<StaffDashboardStats> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("complaints")
    .select("status")
    .eq("assigned_to", staffId);

  const rows = data ?? [];
  return {
    assigned: rows.length,
    open: rows.filter((row) =>
      (OPEN_STATUSES as readonly string[]).includes(row.status),
    ).length,
    inProgress: rows.filter((row) => row.status === "In Progress").length,
    resolved: rows.filter(
      (row) => row.status === "Resolved" || row.status === "Closed",
    ).length,
  };
}

// ---------------------------------------------------------------------------
// Write — status & assignment
// ---------------------------------------------------------------------------
/**
 * Changes a complaint's status.
 *
 * Transition legality is checked here (friendly message) AND is backed by the
 * `guard_complaint_update` trigger plus RLS, so a forged request still fails.
 * The database trigger writes the history row and the notification.
 */
export async function updateComplaintStatus(
  input: UpdateComplaintStatusInput,
): Promise<{ status: ComplaintStatus }> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthorizationError("You must be signed in.");

  const profile = await getUserProfile(user.id);
  if (!profile || !["admin", "staff"].includes(profile.role)) {
    throw new AuthorizationError(
      "Only administrators and staff can update complaints.",
    );
  }

  const { data: current, error: readError } = await supabase
    .from("complaints")
    .select("id, status, assigned_to, complaint_number")
    .eq("id", input.complaintId)
    .maybeSingle();

  if (readError || !current) {
    throw new Error("That complaint could not be found.");
  }

  if (profile.role === "staff" && current.assigned_to !== user.id) {
    throw new AuthorizationError(
      "You can only update complaints that are assigned to you.",
    );
  }

  if (current.status === input.status) {
    throw new Error(`This complaint is already marked as "${input.status}".`);
  }

  if (!canTransition(current.status, input.status)) {
    throw new Error(
      `Invalid status change. A complaint that is "${current.status}" cannot move directly to "${input.status}".`,
    );
  }

  if (input.status === "Rejected" && !input.remarks) {
    throw new Error(
      "Please add a remark explaining why this complaint is rejected.",
    );
  }

  const { error } = await supabase
    .from("complaints")
    .update({
      status: input.status,
      // Keep existing remarks when the caller did not supply new ones.
      ...(input.remarks ? { admin_remarks: input.remarks } : {}),
      ...(input.resolutionNotes
        ? { resolution_notes: input.resolutionNotes }
        : {}),
      ...(input.status === "Resolved"
        ? { resolved_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", input.complaintId);

  if (error) {
    // Trigger messages ("You are not allowed to…") are safe and useful; raw
    // Postgres internals are not.
    const message = error.message ?? "";
    const isPolicyMessage =
      /not allowed|assigned to you|cannot/i.test(message) && message.length < 200;

    throw new Error(
      isPolicyMessage
        ? message
        : "The status could not be updated. Please try again.",
    );
  }

  return { status: input.status };
}

/** Admin-only: assign (or unassign) a complaint. */
export async function assignComplaint(input: AssignComplaintInput): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthorizationError("You must be signed in.");

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== "admin") {
    throw new AuthorizationError("Only administrators can assign complaints.");
  }

  const { data: current, error: readError } = await supabase
    .from("complaints")
    .select("status")
    .eq("id", input.complaintId)
    .maybeSingle();

  if (readError || !current) throw new Error("That complaint could not be found.");

  // Assigning someone should also move the workflow forward, but only from a
  // state where that makes sense.
  const shouldAdvanceToAssigned =
    input.assignedTo !== null &&
    ["Submitted", "Under Review"].includes(current.status);

  const { error } = await supabase
    .from("complaints")
    .update({
      assigned_to: input.assignedTo,
      ...(shouldAdvanceToAssigned ? { status: "Assigned" as ComplaintStatus } : {}),
      ...(input.remarks ? { admin_remarks: input.remarks } : {}),
    })
    .eq("id", input.complaintId);

  if (error) {
    throw new Error("The complaint could not be assigned. Please try again.");
  }
}

/** Staff/admin: add or update resolution notes without changing status. */
export async function updateResolutionNotes(
  complaintId: string,
  notes: string | null,
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthorizationError("You must be signed in.");

  const profile = await getUserProfile(user.id);
  if (!profile || !["admin", "staff"].includes(profile.role)) {
    throw new AuthorizationError(
      "Only staff and administrators can add resolution notes.",
    );
  }

  const { error } = await supabase
    .from("complaints")
    .update({ resolution_notes: notes })
    .eq("id", complaintId);

  if (error) throw new Error("The resolution notes could not be saved.");
}

export async function deleteDraftComplaint(complaintId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // `.select()` makes PostgREST return the deleted rows. Without it a DELETE
  // that RLS filtered out would look like a success while doing nothing.
  const { data, error } = await supabase
    .from("complaints")
    .delete()
    .eq("id", complaintId)
    .select("id");

  if (error || !data || data.length === 0) {
    throw new Error(
      "This complaint could not be withdrawn. You can only withdraw a complaint while it is still awaiting review.",
    );
  }
}
