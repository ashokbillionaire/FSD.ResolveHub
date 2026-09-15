"use server";

import { revalidatePath } from "next/cache";

import { AuthorizationError, requireAdmin } from "@/lib/services/auth-service";
import {
  createStaffAccount,
  deleteStaffAccount,
  setStaffActive,
} from "@/lib/services/admin-service";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/services/category-service";
import { createNotification } from "@/lib/services/notification-service";
import {
  createStaffSchema,
  deleteStaffSchema,
  setStaffActiveSchema,
} from "@/lib/validations/auth";
import {
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from "@/lib/validations/complaint";
import type { ActionState } from "@/lib/validations/common";
import { firstErrorMessage, toFieldErrors } from "@/lib/validations/common";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/env";
import type { ProfileRow } from "@/types/database";

export type AdminActionState = ActionState<Record<string, unknown>>;

function toFailure(error: unknown, fallback: string): AdminActionState {
  if (error instanceof AuthorizationError) {
    return { status: "error", message: error.message };
  }
  const message = error instanceof Error ? error.message : "";
  return {
    status: "error",
    message:
      message.length > 0 && message.length < 300 ? message : fallback,
  };
}

// ---------------------------------------------------------------------------
// Staff accounts
// ---------------------------------------------------------------------------
export async function createStaffAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = createStaffSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstErrorMessage(parsed.error),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    // Server-side authorisation check — never rely on the client hiding a button.
    const admin = await requireAdmin();

    if (!isServiceRoleConfigured()) {
      return {
        status: "error",
        message:
          "Creating staff accounts requires SUPABASE_SERVICE_ROLE_KEY to be set in .env.local (server-only). Add it and restart the server.",
      };
    }

    const created = await createStaffAccount(parsed.data, admin.role === "admin");

    await createNotification({
      userId: created.id,
      title: "Welcome to ResolveHub",
      message:
        "Your staff account has been created. Assigned complaints will appear on your dashboard.",
    });

    revalidatePath("/admin/staff");
    revalidatePath("/admin");

    return {
      status: "success",
      message: `Staff account created for ${created.email}.`,
      data: { id: created.id },
    };
  } catch (error) {
    return toFailure(error, "The staff account could not be created.");
  }
}

export async function setStaffActiveAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = setStaffActiveSchema.safeParse({
    staffId: formData.get("staffId"),
    isActive: formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstErrorMessage(parsed.error),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    const admin = await requireAdmin();
    await setStaffActive(parsed.data.staffId, parsed.data.isActive, admin.role === "admin");

    revalidatePath("/admin/staff");

    return {
      status: "success",
      message: parsed.data.isActive
        ? "Staff account activated."
        : "Staff account deactivated. They will no longer be able to sign in.",
      data: {},
    };
  } catch (error) {
    return toFailure(error, "The account status could not be updated.");
  }
}

export async function deleteStaffAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = deleteStaffSchema.safeParse({
    staffId: formData.get("staffId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstErrorMessage(parsed.error),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    const admin = await requireAdmin();

    if (parsed.data.staffId === admin.id) {
      return { status: "error", message: "You cannot delete your own account." };
    }

    if (!isServiceRoleConfigured()) {
      return {
        status: "error",
        message:
          "Deleting staff accounts requires SUPABASE_SERVICE_ROLE_KEY to be set in .env.local.",
      };
    }

    await deleteStaffAccount(parsed.data.staffId, admin.role === "admin");

    revalidatePath("/admin/staff");
    revalidatePath("/admin");

    return {
      status: "success",
      message: "Staff account deleted.",
      data: {},
    };
  } catch (error) {
    return toFailure(error, "The staff account could not be deleted.");
  }
}

/** Change any profile's role. Admin only, protected by RLS + trigger. */
export async function changeUserRoleAction(
  profileId: string,
  role: "user" | "staff" | "admin",
): Promise<{ ok: boolean; message: string }> {
  try {
    await requireAdmin();

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", profileId);

    if (error) {
      return { ok: false, message: "The role could not be updated." };
    }

    revalidatePath("/admin/staff");
    return { ok: true, message: `Role updated to ${role}.` };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "The role could not be updated.",
    };
  }
}

/** Search registered users — used by the staff management screen. */
export async function searchUsersAction(
  term: string,
): Promise<Pick<ProfileRow, "id" | "full_name" | "email" | "role">[]> {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();

    const cleaned = term.replace(/[%,()]/g, " ").trim();
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .order("created_at", { ascending: false })
      .limit(20);

    if (cleaned) {
      query = query.or(`full_name.ilike.%${cleaned}%,email.ilike.%${cleaned}%`);
    }

    const { data } = await query;
    return data ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function createCategoryAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstErrorMessage(parsed.error),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    await requireAdmin();
    const created = await createCategory(parsed.data);

    revalidatePath("/admin/categories");
    revalidatePath("/dashboard/complaints/new");

    return {
      status: "success",
      message: `Category "${created.name}" created.`,
      data: { id: created.id },
    };
  } catch (error) {
    return toFailure(error, "The category could not be created.");
  }
}

export async function updateCategoryAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = updateCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstErrorMessage(parsed.error),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    await requireAdmin();
    const updated = await updateCategory(parsed.data);

    revalidatePath("/admin/categories");
    revalidatePath("/dashboard/complaints/new");

    return {
      status: "success",
      message: `Category "${updated.name}" updated.`,
      data: { id: updated.id },
    };
  } catch (error) {
    return toFailure(error, "The category could not be updated.");
  }
}

export async function deleteCategoryAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = deleteCategorySchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstErrorMessage(parsed.error),
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    await requireAdmin();
    await deleteCategory(parsed.data.id);

    revalidatePath("/admin/categories");
    revalidatePath("/dashboard/complaints/new");

    return { status: "success", message: "Category deleted.", data: {} };
  } catch (error) {
    return toFailure(error, "The category could not be deleted.");
  }
}
