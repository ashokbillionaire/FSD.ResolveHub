import { z } from "zod";

import {
  emailSchema,
  optionalText,
  passwordSchema,
  trimmedString,
} from "@/lib/validations/common";

export const fullNameSchema = trimmedString("Full name", 2, 80);

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    // There is deliberately NO role field. Self-registration is always a
    // "user"; the database trigger hard-codes that value.
    password: passwordSchema,
    confirmPassword: z.string({ message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ message: "Password is required." })
    .min(1, { message: "Password is required." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  fullName: fullNameSchema,
  avatarUrl: optionalText(2048, "Avatar URL"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Admin-only: create a staff account.
 *
 * This is the ONLY place a non-"user" role can be requested, and the server
 * action behind it verifies the caller is an admin before touching the
 * service-role key.
 */
export const createStaffSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const setStaffActiveSchema = z.object({
  staffId: z.string().uuid({ message: "Invalid staff account." }),
  isActive: z.coerce.boolean(),
});

export const deleteStaffSchema = z.object({
  staffId: z.string().uuid({ message: "Invalid staff account." }),
});

export const changeRoleSchema = z.object({
  profileId: z.string().uuid({ message: "Invalid account." }),
  role: z.enum(["user", "staff", "admin"], {
    message: "Choose a valid role.",
  }),
});
