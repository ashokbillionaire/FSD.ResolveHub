import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How ResolveHub collects, uses and protects complaint data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="14 September 2026"
      sections={[
        {
          heading: "What we collect",
          body: [
            "ResolveHub stores the details you provide when registering (your name and email address) and the content of the complaints you submit, including the category, priority, description, optional location and any image you attach.",
            "Every status change on a complaint is recorded with a timestamp and the account that made the change, so a complete audit trail is kept.",
          ],
        },
        {
          heading: "Who can see your data",
          body: [
            "Complaint data is protected by PostgreSQL Row Level Security. You can read your own complaints, their status history and your notifications, and nothing else.",
            "A staff member can only read complaints that have been assigned to them. Administrators can read all complaints in order to triage and manage the service.",
            "Feedback you submit is visible to you, to the administrator reviewing the service, and to the staff member who handled that complaint.",
          ],
        },
        {
          heading: "Authentication and credentials",
          body: [
            "Authentication is handled entirely by Supabase Auth. Passwords are never stored, hashed or handled by ResolveHub's application code.",
            "Sessions are held in HTTP-only cookies and revalidated with Supabase Auth on every request.",
          ],
        },
        {
          heading: "File uploads",
          body: [
            "Attached images are stored in a dedicated Supabase Storage bucket. Uploads are restricted to JPG, JPEG, PNG and WEBP files of up to 5 MB, and the storage policy only permits an account to write into its own folder.",
          ],
        },
        {
          heading: "Retention and deletion",
          body: [
            "Complaint records are retained for as long as the service is in use. You may withdraw a complaint yourself only while it is still awaiting review; after that, contact an administrator.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Questions about this notice can be sent to support@resolvehub.local.",
          ],
        },
      ]}
    />
  );
}
