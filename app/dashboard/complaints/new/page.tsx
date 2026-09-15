import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/services/auth-service";
import { getCategories } from "@/lib/services/category-service";
import { PageHeader, Alert } from "@/components/ui/primitives";
import { NewComplaintForm } from "@/app/dashboard/complaints/new/new-complaint-form";

export const metadata: Metadata = { title: "Submit Complaint" };

export default async function NewComplaintPage({
  searchParams,
}: PageProps<"/dashboard/complaints/new">) {
  const params = await searchParams;
  const profile = await requireProfile();

  if (profile.role === "staff") {
    redirect(
      "/dashboard/assigned?error=" +
        encodeURIComponent(
          "Staff accounts cannot raise complaints. Please contact an administrator.",
        ),
    );
  }

  const categories = await getCategories();

  const presetCategoryId =
    typeof params.category === "string" ? params.category : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submit a Complaint"
        description="Give us as much detail as you can. Fields marked with an asterisk are required."
      />

      {categories.length === 0 ? (
        <Alert variant="warning" title="No categories are available">
          An administrator needs to add at least one complaint category before a
          complaint can be submitted.
        </Alert>
      ) : (
        <NewComplaintForm
          userId={profile.id}
          categories={categories}
          presetCategoryId={presetCategoryId}
        />
      )}
    </div>
  );
}
