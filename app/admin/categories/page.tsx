import type { Metadata } from "next";
import { FolderTree, Layers, TrendingUp, XCircle } from "lucide-react";

import { requireAdminProfile } from "@/lib/services/auth-service";
import { getCategoriesWithCounts } from "@/lib/services/category-service";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/ui/primitives";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requireAdminProfile();

  const categories = await getCategoriesWithCounts();

  const totalComplaints = categories.reduce(
    (sum, category) => sum + category.complaint_count,
    0,
  );
  const unused = categories.filter((c) => c.complaint_count === 0).length;
  const mostUsed = [...categories].sort(
    (a, b) => b.complaint_count - a.complaint_count,
  )[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        description="Categories determine how complaints are classified, routed and reported on."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Categories" value={categories.length} icon={FolderTree} />
        <StatCard
          label="Total complaints"
          value={totalComplaints}
          icon={Layers}
        />
        <StatCard
          label="Most used"
          value={mostUsed && mostUsed.complaint_count > 0 ? mostUsed.name : "—"}
          icon={TrendingUp}
          tone="info"
          hint={
            mostUsed && mostUsed.complaint_count > 0
              ? `${mostUsed.complaint_count} complaint(s)`
              : "No complaints yet"
          }
        />
        <StatCard
          label="Unused"
          value={unused}
          icon={XCircle}
          tone={unused > 0 ? "warning" : "success"}
          hint="Can be deleted safely"
        />
      </div>

      <CategoryManager
        categories={categories}
        totalComplaints={totalComplaints}
      />
    </div>
  );
}
