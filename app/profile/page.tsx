import type { Metadata } from "next";
import {
  CalendarDays,
  CheckCircle2,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { requireProfile } from "@/lib/services/auth-service";
import { formatDateTime } from "@/lib/utils";
import { RoleBadge } from "@/components/ui/badges";
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  DetailItem,
  PageHeader,
} from "@/components/ui/primitives";
import { ProfileForm } from "@/app/profile/profile-form";

export const metadata: Metadata = { title: "Profile" };

const ROLE_DESCRIPTIONS: Record<string, string> = {
  user: "You can submit complaints, track their progress and leave feedback once they are resolved.",
  staff:
    "You can view and update complaints that an administrator assigns to you.",
  admin:
    "You can review every complaint, assign staff, manage categories and read the analytics.",
};

export default async function ProfilePage() {
  const profile = await requireProfile();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your account details. Your role is assigned by an administrator."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Account details"
              description="Update your display name and profile picture."
            />
            <CardBody>
              <ProfileForm
                userId={profile.id}
                fullName={profile.full_name}
                email={profile.email}
                avatarUrl={profile.avatar_url}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Account information" />
            <CardBody>
              <dl className="space-y-4">
                <DetailItem label="Email address">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5 text-slate-400" aria-hidden />
                    <span className="truncate">{profile.email}</span>
                  </span>
                </DetailItem>

                <DetailItem label="Role">
                  <RoleBadge role={profile.role} />
                  <p className="mt-1.5 text-xs text-slate-500">
                    {ROLE_DESCRIPTIONS[profile.role]}
                  </p>
                </DetailItem>

                <DetailItem label="Account status">
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <CheckCircle2
                      className="size-3.5 text-emerald-500"
                      aria-hidden
                    />
                    {profile.is_active ? "Active" : "Deactivated"}
                  </span>
                </DetailItem>

                <DetailItem label="Member since">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-slate-400" aria-hidden />
                    {formatDateTime(profile.created_at)}
                  </span>
                </DetailItem>

                <DetailItem label="Last profile update">
                  {formatDateTime(profile.updated_at)}
                </DetailItem>
              </dl>
            </CardBody>
          </Card>

          <Alert variant="info" title="Your role cannot be changed here">
            <span className="inline-flex items-start gap-1.5">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Roles are protected by a database trigger. If you need staff or
              administrator access, contact an administrator.
            </span>
          </Alert>

          <Alert variant="success" title="Your data is protected">
            <span className="inline-flex items-start gap-1.5">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Row Level Security in PostgreSQL decides which rows you can read
              and write — not the interface.
            </span>
          </Alert>
        </div>
      </div>
    </div>
  );
}
