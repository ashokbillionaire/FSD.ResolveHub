"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ButtonProps["variant"];
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

/**
 * Accessible confirmation dialog.
 *
 * Used before every destructive or irreversible action (rejecting a complaint,
 * closing a complaint, deleting a category or staff account).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
}: DialogProps) {
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    if (!open) return;

    confirmRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-sm"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl",
          "animate-in fade-in zoom-in-95 duration-150",
        )}
      >
        <div className="flex gap-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle className="size-5 text-rose-600" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description ? (
              <div id={descriptionId} className="mt-1.5 text-sm text-slate-600">
                {description}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={variant}
            loading={loading}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * A button that asks for confirmation before submitting another form on the
 * page. Confirm-on-submit is implemented with `requestSubmit()`, so it works
 * with `useActionState` forms where the real button is a normal submit button.
 */
export function ConfirmSubmit({
  formId,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  children,
  ...buttonProps
}: Omit<ButtonProps, "onClick"> & {
  formId: string;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  function handleConfirm() {
    const form = document.getElementById(formId);
    setPending(true);
    setOpen(false);
    if (form instanceof HTMLFormElement) {
      // Clearing the flag as soon as the submit event is dispatched keeps the
      // button from staying in a loading state if validation blocks it.
      form.requestSubmit();
    }
    window.setTimeout(() => setPending(false), 600);
  }

  return (
    <>
      <Button
        variant={variant}
        loading={pending}
        onClick={() => setOpen(true)}
        {...buttonProps}
      >
        {children}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant={variant}
        onConfirm={handleConfirm}
      />
    </>
  );
}
