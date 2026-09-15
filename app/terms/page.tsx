import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for the ResolveHub complaint management system.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="14 September 2026"
      sections={[
        {
          heading: "Acceptable use",
          body: [
            "ResolveHub exists to report and resolve genuine issues. Submit complaints in good faith, with accurate details, and only for matters relating to the institution or service the platform covers.",
            "Do not submit abusive, defamatory, discriminatory or deliberately false complaints. Image attachments must relate to the complaint and must not contain unlawful content.",
          ],
        },
        {
          heading: "Your account",
          body: [
            "You are responsible for keeping your password confidential and for everything done through your account. Report suspected unauthorised access to an administrator immediately.",
            "Accounts are created with the standard user role. Staff and administrator roles are assigned by an administrator and may be changed or deactivated at any time.",
          ],
        },
        {
          heading: "Complaint handling",
          body: [
            "Complaints follow a defined workflow: Submitted, Under Review, Assigned, In Progress, Resolved and Closed. A complaint may also be Rejected, with a reason recorded in the administrator's remarks.",
            "Submitting a complaint does not guarantee a particular outcome or a specific resolution time.",
          ],
        },
        {
          heading: "Feedback",
          body: [
            "Once a complaint is resolved you may submit a single rating and comment. Feedback is recorded permanently against that complaint and cannot be edited after submission.",
          ],
        },
        {
          heading: "Availability",
          body: [
            "This platform is provided as an academic project without warranty of any kind. Features, data and availability may change without notice.",
          ],
        },
      ]}
    />
  );
}
