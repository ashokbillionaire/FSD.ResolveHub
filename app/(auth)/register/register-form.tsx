"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  registerAction,
  type AuthActionState,
} from "@/lib/actions/auth-actions";
import { initialActionState } from "@/lib/validations/common";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "Contains a letter", test: (value: string) => /[A-Za-z]/.test(value) },
  { label: "Contains a number", test: (value: string) => /[0-9]/.test(value) },
];

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, isPending] = React.useActionState<
    AuthActionState,
    FormData
  >(registerAction, initialActionState);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    if (state.status !== "success") return;

    if (state.data.requiresEmailConfirmation) {
      toast.success(state.message, { duration: 8000 });
      router.replace("/login");
      return;
    }

    toast.success(state.message);
    router.replace(state.data.redirectTo ?? "/dashboard");
    router.refresh();
  }, [state, router]);

  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.status === "error" && !state.fieldErrors ? (
        <Alert variant="error">{state.message}</Alert>
      ) : null}

      <Field
        label="Full name"
        htmlFor="fullName"
        required
        error={fieldErrors.fullName}
      >
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="e.g. Rahul Verma"
          required
          invalid={Boolean(fieldErrors.fullName)}
          disabled={isPending}
        />
      </Field>

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
            autoComplete="new-password"
            placeholder="Create a password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>

        {password.length > 0 ? (
          <ul className="mt-2 grid gap-1">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    passed ? "text-emerald-600" : "text-slate-500",
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      "size-3.5",
                      passed ? "text-emerald-500" : "text-slate-300",
                    )}
                    aria-hidden
                  />
                  {rule.label}
                </li>
              );
            })}
          </ul>
        ) : null}
      </Field>

      <Field
        label="Confirm password"
        htmlFor="confirmPassword"
        required
        error={fieldErrors.confirmPassword}
      >
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            invalid={Boolean(fieldErrors.confirmPassword)}
            disabled={isPending}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 hover:text-slate-600"
            aria-label={showConfirm ? "Hide password" : "Show password"}
            aria-pressed={showConfirm}
          >
            {showConfirm ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
        {passwordsMatch && !fieldErrors.confirmPassword ? (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Passwords match
          </p>
        ) : null}
      </Field>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={isPending}
        loadingText="Creating account…"
      >
        <UserPlus className="size-4" aria-hidden />
        Create account
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
