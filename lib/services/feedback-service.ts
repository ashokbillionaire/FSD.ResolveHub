import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FeedbackWithRelations } from "@/types";
import type { CreateFeedbackInput } from "@/lib/validations/complaint";

/**
 * Submits feedback for the current user's own resolved/closed complaint.
 *
 * Duplicate feedback is prevented at two levels: the `feedback.complaint_id`
 * UNIQUE constraint and the `feedback: create own` RLS policy, which also
 * re-checks ownership and status on the server.
 */
export async function createFeedback(
  input: CreateFeedbackInput,
  userId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Friendly pre-checks (the database enforces the same rules regardless).
  const { data: complaint, error: complaintError } = await supabase
    .from("complaints")
    .select("id, status, user_id")
    .eq("id", input.complaintId)
    .maybeSingle();

  if (complaintError || !complaint) {
    throw new Error("That complaint could not be found.");
  }

  if (complaint.user_id !== userId) {
    throw new Error("You can only leave feedback on your own complaint.");
  }

  if (!["Resolved", "Closed"].includes(complaint.status)) {
    throw new Error(
      "Feedback can only be submitted once your complaint has been resolved.",
    );
  }

  const { data: existing } = await supabase
    .from("feedback")
    .select("id")
    .eq("complaint_id", input.complaintId)
    .maybeSingle();

  if (existing) {
    throw new Error("You have already submitted feedback for this complaint.");
  }

  const { error } = await supabase.from("feedback").insert({
    complaint_id: input.complaintId,
    user_id: userId,
    rating: input.rating,
    comment: input.comment,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already submitted feedback for this complaint.");
    }
    throw new Error("Your feedback could not be saved. Please try again.");
  }
}

export async function getFeedbackForComplaint(complaintId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("feedback")
    .select(
      `*,
       author:profiles!feedback_user_id_fkey ( id, full_name, email, avatar_url )`,
    )
    .eq("complaint_id", complaintId)
    .maybeSingle();

  return data;
}

/** Ids of complaints the user has already rated — used to hide the form. */
export async function getUserFeedbackComplaintIds(
  userId: string,
): Promise<Set<string>> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("feedback")
    .select("complaint_id")
    .eq("user_id", userId);

  return new Set((data ?? []).map((row) => row.complaint_id));
}

export async function getUserFeedback(
  userId: string,
  limit = 10,
): Promise<FeedbackWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("feedback")
    .select(
      `*,
       author:profiles!feedback_user_id_fkey ( id, full_name, email, avatar_url ),
       complaint:complaints!feedback_complaint_id_fkey ( id, complaint_number, title, category:categories ( name ) )`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as FeedbackWithRelations[];
}
