import type { Metadata } from "next";

import { RegisterForm } from "@/app/(auth)/register/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a ResolveHub account to submit and track complaints transparently.",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          New accounts are created with the standard user role. Administrator and
          staff access is granted separately.
        </p>
      </div>

      <RegisterForm />
    </div>
  );
}
