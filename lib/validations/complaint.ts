import { z } from "zod";

import { COMPLAINT_PRIORITIES, COMPLAINT_STATUSES } from "@/types/database";
import {
  optionalText,
  trimmedString,
  uuidSchema,
} from "@/lib/validations/common";

const priorityEnum = z.enum(COMPLAINT_PRIORITIES, {
  message: "Select a priority.",
});

const statusEnum = z.enum(COMPLAINT_STATUSES, {
  message: "Select a status.",
});

export const createComplaintSchema = z.object({
  title: trimmedString("Title", 5, 150),
  categoryId: uuidSchema,
  priority: priorityEnum,
  description: trimmedString("Description", 20, 5000),
  location: optionalText(150, "Location"),
  // The storage object path (not a public URL) is what the client sends.
  imagePath: optionalText(512, "Image path"),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

/** Admin / staff status change. */
export const updateComplaintStatusSchema = z.object({
  complaintId: uuidSchema,
  status: statusEnum,
  remarks: optionalText(2000, "Remarks"),
  resolutionNotes: optionalText(3000, "Resolution notes"),
});

export type UpdateComplaintStatusInput = z.infer<
  typeof updateComplaintStatusSchema
>;

export const assignComplaintSchema = z.object({
  complaintId: uuidSchema,
  assignedTo: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || /^[0-9a-f-]{36}$/i.test(value), {
      message: "Select a valid staff member.",
    }),
  remarks: optionalText(2000, "Remarks"),
});

export type AssignComplaintInput = z.infer<typeof assignComplaintSchema>;

export const updateComplaintDetailsSchema = z.object({
  complaintId: uuidSchema,
  title: trimmedString("Title", 5, 150),
  description: trimmedString("Description", 20, 5000),
  categoryId: uuidSchema,
  priority: priorityEnum,
  location: optionalText(150, "Location"),
  adminRemarks: optionalText(2000, "Admin remarks"),
});

export type UpdateComplaintDetailsInput = z.infer<
  typeof updateComplaintDetailsSchema
>;

export const complaintFilterSchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  status: z.union([statusEnum, z.literal("All")]).optional().default("All"),
  priority: z
    .union([priorityEnum, z.literal("All")])
    .optional()
    .default("All"),
  categoryId: z.string().trim().optional().default(""),
  assignedTo: z.string().trim().optional().default(""),
  sort: z
    .enum(["newest", "oldest", "priority", "status"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type ComplaintFilterInput = z.infer<typeof complaintFilterSchema>;

/**
 * Parses raw URL query parameters into a valid filter object.
 *
 * Never throws: an unparseable value simply falls back to the default so a
 * hand-edited URL cannot break the page.
 */
export function parseComplaintFilters(
  raw: Record<string, string | undefined>,
): ComplaintFilterInput {
  const result = complaintFilterSchema.safeParse(raw);
  if (result.success) return result.data;

  // Field-level fallback: keep whatever parsed and reset the rest.
  const fallback = complaintFilterSchema.parse({});
  return {
    ...fallback,
    search: typeof raw.search === "string" ? raw.search.slice(0, 120) : "",
    page:
      typeof raw.page === "string" && /^\d+$/.test(raw.page)
        ? Math.max(1, Number(raw.page))
        : 1,
  };
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------
export const createFeedbackSchema = z.object({
  complaintId: uuidSchema,
  rating: z.coerce
    .number({ message: "Please choose a rating." })
    .int({ message: "Rating must be a whole number." })
    .min(1, { message: "Please choose a rating between 1 and 5." })
    .max(5, { message: "Please choose a rating between 1 and 5." }),
  comment: optionalText(1000, "Comment"),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const createCategorySchema = z.object({
  name: trimmedString("Category name", 2, 60),
  description: optionalText(300, "Description"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.extend({
  id: uuidSchema,
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const deleteCategorySchema = z.object({
  id: uuidSchema,
});
