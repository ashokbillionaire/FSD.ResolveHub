import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CategoryRow } from "@/types/database";
import type { CategoryWithCount } from "@/types";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/validations/complaint";

/** All categories, memoised for the duration of a request. */
export const getCategories = cache(async (): Promise<CategoryRow[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) return [];
  return data ?? [];
});

/** Categories with the number of complaints referencing each one. */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = await createSupabaseServerClient();

  const [categoriesResult, complaintsResult] = await Promise.all([
    supabase.from("categories").select("*").order("name", { ascending: true }),
    supabase.from("complaints").select("category_id"),
  ]);

  if (categoriesResult.error) {
    throw new Error("Categories could not be loaded.");
  }

  const counts = new Map<string, number>();
  for (const row of complaintsResult.data ?? []) {
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }

  return (categoriesResult.data ?? []).map((category) => ({
    ...category,
    complaint_count: counts.get(category.id) ?? 0,
  }));
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<CategoryRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: input.name, description: input.description })
    .select()
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("A category with that name already exists.");
    }
    if (error?.code === "42501") {
      throw new Error("Only administrators can create categories.");
    }
    throw new Error("The category could not be created. Please try again.");
  }

  return data;
}

export async function updateCategory(
  input: UpdateCategoryInput,
): Promise<CategoryRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("categories")
    .update({ name: input.name, description: input.description })
    .eq("id", input.id)
    .select()
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("A category with that name already exists.");
    }
    throw new Error("The category could not be updated. Please try again.");
  }

  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("complaints")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    throw new Error(
      `This category is used by ${count} complaint(s) and cannot be deleted. Rename it instead, or reassign those complaints first.`,
    );
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    throw new Error("The category could not be deleted.");
  }
}
