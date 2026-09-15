import type { Metadata } from "next";
import { Users } from "lucide-react";

import { requireAdminProfile } from "@/lib/services/auth-service";
import { getStaffList } from "@/lib/services/admin-service";
import { isServiceRoleConfigured } from "@/lib/env";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/ui/primitives";
import { StaffManager } from "@/components/admin/staff-manager";

export const metadata: Metadata = { title: "Staff Management" };

export default async function AdminStaffPage() {
  await requireAdminProfile();

  // Throws a readable error rather than silently showing an empty list.
  const staff = await getStaffList();

  const active = staff.filter((member) => member.is_active).length;
  const totalOpen = staff.reduce((sum, member) => sum + member.open_count, 0);
  const totalResolved = staff.reduce((sum, member) => sum + member.resolved_count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        description="Create staff accounts and monitor how much work each member is carrying."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Staff accounts" value={staff.length} icon={Users} />
        <StatCard label="Active" value={active} icon={Users} tone="success" />
        <StatCard
          label="Open assignments"
          value={totalOpen}
          icon={Users}
          tone="warning"
        />
        <StatCard
          label="Resolved by staff"
          value={totalResolved}
          icon={Users}
          tone="info"
        />
      </div>

      <StaffManager staff={staff} serviceRoleConfigured={isServiceRoleConfigured()} />
    </div>
  );
}
