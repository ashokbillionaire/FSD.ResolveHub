import { z } from "zod";

/** Flat `{ field: message }` map consumed by form components. */
export type FieldErrors = Record<string, string>;

/** Uniform result shape returned by every server action. */
export type ActionState<T = undefined> =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: FieldErrors }
  | { status: "success"; message: string; data: T };

export const initialActionState: ActionState<never> = { status: "idle" };

/** Converts a ZodError into the flat field-error map used by the UI. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/** First error message, used as the form-level banner. */
export function firstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the highlighted fields.";
}

export const trimmedString = (label: string, min: number, max: number) =>
  z
    .string({ message: `${label} is required.` })
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .refine((value) => value.length >= min, {
      message: `${label} must be at least ${min} characters.`,
    })
    .refine((value) => value.length <= max, {
      message: `${label} must be at most ${max} characters.`,
    });

export const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { message: `${label} must be at most ${max} characters.` })
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

export const emailSchema = z
  .string({ message: "Email is required." })
  .trim()
  .toLowerCase()
  .min(1, { message: "Email is required." })
  .max(254, { message: "Email address is too long." })
  .pipe(z.string().email({ message: "Enter a valid email address." }));

export const passwordSchema = z
  .string({ message: "Password is required." })
  .min(8, { message: "Password must be at least 8 characters long." })
  .max(72, { message: "Password must be at most 72 characters long." })
  .refine((value) => /[A-Za-z]/.test(value), {
    message: "Password must contain at least one letter.",
  })
  .refine((value) => /[0-9]/.test(value), {
    message: "Password must contain at least one number.",
  });

export const uuidSchema = z
  .string()
  .trim()
  .uuid({ message: "Invalid identifier." });

/** Normalises "fieldErrors" coming from a server action into a FieldErrors map. */
export function isFieldErrors(value: unknown): value is FieldErrors {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
