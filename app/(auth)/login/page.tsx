import type { Metadata } from "next";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { Alert } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to ResolveHub to submit and track your complaints.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;

  const next = typeof params.next === "string" ? params.next : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Sign in to submit complaints and follow their progress.
        </p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <LoginForm nextPath={next} />
    </div>
  );
}
