"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";

import { loginAction, type AuthActionState } from "@/lib/actions/auth-actions";
import { initialActionState } from "@/lib/validations/common";
import { Alert } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = React.useActionState<
    AuthActionState,
    FormData
  >(loginAction, initialActionState);

  const [showPassword, setShowPassword] = React.useState(false);
  const [next] = React.useState(() => nextPath ?? "");

  React.useEffect(() => {
    if (state.status === "success") {
      const target = state.data.redirectTo ?? "/dashboard";
      toast.success(state.message);
      router.replace(target);
      router.refresh();
    }
  }, [state, router]);

  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.status === "error" && !state.fieldErrors ? (
        <Alert variant="error">{state.message}</Alert>
      ) : null}

      <input type="hidden" name="next" value={next} />

      <Field
        label="Email address"
        htmlFor="email"
        required
        error={fieldErrors.email}
      >
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@college.edu"
          required
          invalid={Boolean(fieldErrors.email)}
          disabled={isPending}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        required
        error={fieldErrors.password}
      >
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            invalid={Boolean(fieldErrors.password)}
            disabled={isPending}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </Field>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={isPending}
        loadingText="Signing in…"
      >
        <LogIn className="size-4" aria-hidden />
        Sign in
      </Button>

      <p className="text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
