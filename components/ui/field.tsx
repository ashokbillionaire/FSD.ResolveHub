import * as React from "react";

import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 " +
  "placeholder:text-slate-400 transition-colors " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 " +
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 " +
  "aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:ring-rose-500/25";

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("block text-sm font-medium text-slate-700", className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-rose-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(controlBase, "h-10", className)}
        {...props}
      />
    );
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, rows = 5, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(controlBase, "resize-y", className)}
        {...props}
      />
    );
  },
);

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(controlBase, "h-10 cursor-pointer pr-8", className)}
        {...props}
      >
        {children}
      </select>
    );
  },
);

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-xs font-medium text-rose-600">
      {children}
    </p>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-500">{children}</p>;
}

/** Label + control + error, with the wiring for accessibility done for you. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      <FieldError>{error}</FieldError>
      {!error && hint ? <FieldHint>{hint}</FieldHint> : null}
      <span id={errorId} className="sr-only" aria-live="polite">
        {error ?? ""}
      </span>
      {hint && !error ? (
        <span id={hintId} className="sr-only">
          {typeof hint === "string" ? hint : ""}
        </span>
      ) : null}
    </div>
  );
}
