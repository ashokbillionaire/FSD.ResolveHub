"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Plus,
  Power,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import {
  createStaffAction,
  deleteStaffAction,
  setStaffActiveAction,
  type AdminActionState,
} from "@/lib/actions/admin-actions";
import { initialActionState } from "@/lib/validations/common";
import { cn, formatDate, getInitials } from "@/lib/utils";
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
} from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ConfirmSubmit } from "@/components/ui/confirm-dialog";
import type { StaffMember } from "@/types";

const CREATE_FORM_ID = "create-staff-form";

export function StaffManager({
  staff,
  serviceRoleConfigured,
}: {
  staff: StaffMember[];
  serviceRoleConfigured: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = React.useState(staff.length === 0);

  const [state, formAction, isPending] = React.useActionState<
    AdminActionState,
    FormData
  >(createStaffAction, initialActionState);

  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      router.refresh();
    }
  }, [state, router]);

  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <div className="space-y-6">
      {!serviceRoleConfigured ? (
        <Alert variant="warning" title="Service-role key is not configured">
          Creating or deleting staff accounts requires the server-only{" "}
          <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in{" "}
          <code className="font-mono">.env.local</code>. Existing staff accounts
          are still listed and can be activated or deactivated.
        </Alert>
      ) : null}

      {/* ------------------------------------------------------ Create form */}
      <Card>
        <CardHeader
          title="Add a staff account"
          description="Staff can only see and update complaints assigned to them."
          action={
            <Button
              variant={showForm ? "ghost" : "primary"}
              size="sm"
              onClick={() => setShowForm((value) => !value)}
              aria-expanded={showForm}
            >
              {showForm ? "Hide form" : (
                <>
                  <Plus className="size-3.5" aria-hidden />
                  Add staff
                </>
              )}
            </Button>
          }
        />

        {showForm ? (
          <CardBody>
            {state.status === "error" && !state.fieldErrors ? (
              <Alert variant="error" className="mb-4">
                {state.message}
              </Alert>
            ) : null}

            <form id={CREATE_FORM_ID} action={formAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Full name"
                  htmlFor="staff-fullName"
                  required
                  error={fieldErrors.fullName}
                >
                  <Input
                    id="staff-fullName"
                    name="fullName"
                    type="text"
                    required
                    maxLength={80}
                    placeholder="e.g. Priya Nair"
                    disabled={isPending}
                    invalid={Boolean(fieldErrors.fullName)}
                  />
                </Field>

                <Field
                  label="Email address"
                  htmlFor="staff-email"
                  required
                  error={fieldErrors.email}
                >
                  <Input
                    id="staff-email"
                    name="email"
                    type="email"
                    required
                    placeholder="staff@college.edu"
                    disabled={isPending}
                    invalid={Boolean(fieldErrors.email)}
                  />
                </Field>

                <Field
                  label="Temporary password"
                  htmlFor="staff-password"
                  required
                  error={fieldErrors.password}
                  hint="At least 8 characters, with a letter and a number."
                >
                  <div className="relative">
                    <Input
                      id="staff-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Set an initial password"
                      disabled={isPending}
                      invalid={Boolean(fieldErrors.password)}
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
                </Field>
              </div>

              <Alert variant="info">
                <span className="inline-flex items-start gap-1.5">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  The account is created with a confirmed email address and the
                  staff role. Share the password securely and ask them to change
                  it after their first sign-in.
                </span>
              </Alert>

              <Button
                type="submit"
                loading={isPending}
                loadingText="Creating account…"
                disabled={!serviceRoleConfigured}
              >
                <UserPlus className="size-4" aria-hidden />
                Create staff account
              </Button>
            </form>
          </CardBody>
        ) : null}
      </Card>

      {/* ------------------------------------------------------- Staff table */}
      <Card>
        <CardHeader
          title="Staff accounts"
          description={`${staff.length} staff member${staff.length === 1 ? "" : "s"} in total.`}
        />

        {staff.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No staff accounts yet"
            description="Add a staff account so complaints can be assigned and resolved."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs tracking-wide text-slate-500 uppercase">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Assigned</th>
                    <th className="px-4 py-3 font-medium">Open</th>
                    <th className="px-4 py-3 font-medium">Resolved</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                            {getInitials(member.full_name)}
                          </span>
                          <span className="font-medium text-slate-900">
                            {member.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{member.email}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {member.assigned_count}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "font-medium",
                            member.open_count > 0
                              ? "text-amber-700"
                              : "text-slate-500",
                          )}
                        >
                          {member.open_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-emerald-700">
                        {member.resolved_count}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                            member.is_active
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-slate-100 text-slate-500 ring-slate-200",
                          )}
                        >
                          {member.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(member.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <StaffRowActions member={member} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {staff.map((member) => (
                <li key={member.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                        {getInitials(member.full_name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {member.full_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                        member.is_active
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-100 text-slate-500 ring-slate-200",
                      )}
                    >
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{member.assigned_count} assigned</span>
                    <span>{member.open_count} open</span>
                    <span>{member.resolved_count} resolved</span>
                    <span>Joined {formatDate(member.created_at)}</span>
                  </div>

                  <div className="mt-3">
                    <StaffRowActions member={member} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}

/** Activate / deactivate and delete, each with the right confirmation. */
function StaffRowActions({ member }: { member: StaffMember }) {
  const router = useRouter();

  const toggleFormId = `staff-toggle-${member.id}`;
  const deleteFormId = `staff-delete-${member.id}`;

  // The third element of useActionState is the pending flag — no need to mirror
  // it into local state.
  const [toggleState, toggleAction, togglePending] = React.useActionState<
    AdminActionState,
    FormData
  >(setStaffActiveAction, initialActionState);

  const [deleteState, deleteAction, deletePending] = React.useActionState<
    AdminActionState,
    FormData
  >(deleteStaffAction, initialActionState);

  React.useEffect(() => {
    if (toggleState.status === "success") {
      toast.success(toggleState.message);
      router.refresh();
    } else if (toggleState.status === "error") {
      toast.error(toggleState.message);
    }
  }, [toggleState, router]);

  React.useEffect(() => {
    if (deleteState.status === "success") {
      toast.success(deleteState.message);
      router.refresh();
    } else if (deleteState.status === "error") {
      toast.error(deleteState.message);
    }
  }, [deleteState, router]);

  return (
    <div className="flex flex-wrap items-center gap-2 md:justify-end">
      <form id={toggleFormId} action={toggleAction}>
        <input type="hidden" name="staffId" value={member.id} />
        <input
          type="hidden"
          name="isActive"
          value={member.is_active ? "false" : "true"}
        />
      </form>

      <form id={deleteFormId} action={deleteAction}>
        <input type="hidden" name="staffId" value={member.id} />
      </form>

      <Button
        variant="outline"
        size="sm"
        loading={togglePending}
        onClick={() => {
          const form = document.getElementById(toggleFormId);
          if (form instanceof HTMLFormElement) form.requestSubmit();
        }}
      >
        {member.is_active ? (
          <>
            <Power className="size-3.5" aria-hidden />
            Deactivate
          </>
        ) : (
          <>
            <CheckCircle2 className="size-3.5" aria-hidden />
            Activate
          </>
        )}
      </Button>

      <ConfirmSubmit
        formId={deleteFormId}
        variant="ghost"
        size="sm"
        loading={deletePending}
        title={`Delete ${member.full_name}?`}
        confirmLabel="Delete account"
        description="The account will be permanently removed and they will no longer be able to sign in. Complaints they handled keep their history, but will become unassigned."
        className="text-rose-600 hover:bg-rose-50"
      >
        <Trash2 className="size-3.5" aria-hidden />
        Delete
      </ConfirmSubmit>
    </div>
  );
}
