import "server-only";

import type { ServerSupabaseClient } from "@/lib/supabase/server";
import { ADMIN_PAGE_SIZE, PROFILE_PAGE_SIZE } from "@/lib/constants";
import type { ComplaintFilterInput } from "@/lib/validations/complaint";

/** Shared projection: a complaint plus its resolved relations. */
export const COMPLAINT_SELECT = `
  *,
  category:categories ( id, name ),
  submitter:profiles!complaints_user_id_fkey ( id, full_name, email, avatar_url ),
  assignee:profiles!complaints_assigned_to_fkey ( id, full_name, email, avatar_url )
`;

/**
 * Builds the filtered, sorted and paginated complaint query.
 *
 * Centralising this means the user, staff and admin listings all share exactly
 * the same search, filter, sort and paging behaviour — RLS is what decides
 * which rows each caller actually receives.
 */
export function buildComplaintQuery(
  supabase: ServerSupabaseClient,
  filter: ComplaintFilterInput,
  options: {
    ownerId?: string;
    assignedTo?: string;
    pageSize?: number;
  } = {},
) {
  const pageSize = options.pageSize ?? PROFILE_PAGE_SIZE;

  let query = supabase
    .from("complaints")
    .select(COMPLAINT_SELECT, { count: "exact" });

  if (options.ownerId) {
    query = query.eq("user_id", options.ownerId);
  }

  if (options.assignedTo) {
    query = query.eq("assigned_to", options.assignedTo);
  }

  if (filter.search) {
    // Strip PostgREST filter syntax characters so a crafted search term cannot
    // alter the shape of the query.
    const term = filter.search.replace(/[%,().*:"'\\]/g, " ").trim();
    if (term) {
      query = query.or(
        [
          `title.ilike.%${term}%`,
          `description.ilike.%${term}%`,
          `complaint_number.ilike.%${term}%`,
          `location.ilike.%${term}%`,
        ].join(","),
      );
    }
  }

  if (filter.status !== "All") {
    query = query.eq("status", filter.status);
  }

  if (filter.priority !== "All") {
    query = query.eq("priority", filter.priority);
  }

  if (filter.categoryId) {
    query = query.eq("category_id", filter.categoryId);
  }

  if (filter.assignedTo) {
    query =
      filter.assignedTo === "unassigned"
        ? query.is("assigned_to", null)
        : query.eq("assigned_to", filter.assignedTo);
  }

  switch (filter.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "priority":
      query = query
        .order("priority_rank", { ascending: true })
        .order("created_at", { ascending: false });
      break;
    case "status":
      query = query
        .order("status_rank", { ascending: true })
        .order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (filter.page - 1) * pageSize;
  return {
    pageSize,
    run: () => query.range(from, from + pageSize - 1),
  };
}

export { ADMIN_PAGE_SIZE };
