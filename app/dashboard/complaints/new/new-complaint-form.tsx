"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Send,
} from "lucide-react";

import {
  createComplaintAction,
  type ComplaintActionState,
} from "@/lib/actions/complaint-actions";
import { initialActionState } from "@/lib/validations/common";
import { COMPLAINT_PRIORITIES } from "@/types/database";
import { PRIORITY_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Alert, Card } from "@/components/ui/primitives";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ImageUpload } from "@/components/complaints/image-upload";
import type { CategoryRow } from "@/types/database";

const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;
const DESCRIPTION_MIN = 20;

export function NewComplaintForm({
  userId,
  categories,
  presetCategoryId,
}: {
  userId: string;
  categories: Pick<CategoryRow, "id" | "name" | "description">[];
  presetCategoryId?: string;
}) {
  const [state, formAction, isPending] = React.useActionState<
    ComplaintActionState,
    FormData
  >(createComplaintAction, initialActionState);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categoryId, setCategoryId] = React.useState(presetCategoryId ?? "");
  const [priority, setPriority] = React.useState<string>("Medium");

  // --------------------------------------------------------- Success view
  if (state.status === "success" && state.data.complaintId) {
    return (
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="size-7 text-emerald-600" aria-hidden />
          </span>

          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            Complaint submitted successfully.
          </h2>

          <p className="mt-3 text-sm text-slate-600">Your complaint ID is</p>
          <p className="mt-1.5 rounded-lg bg-slate-900 px-4 py-2 font-mono text-lg font-semibold tracking-wider text-white">
            {state.data.complaintNumber}
          </p>

          <p className="mt-4 max-w-md text-sm text-slate-600">
            Keep this number for reference. You will receive a notification the
            moment an administrator reviews your complaint.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href={`/dashboard/complaints/${state.data.complaintId}`}
              className={buttonClasses("primary", "md")}
            >
              <Eye className="size-4" aria-hidden />
              View Complaint
            </Link>
            <Link
              href="/dashboard/complaints"
              className={buttonClasses("outline", "md")}
            >
              Back to my complaints
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" && !state.fieldErrors ? (
        <Alert variant="error" title="Complaint not submitted">
          {state.message}
        </Alert>
      ) : null}

      <Card className="p-5 sm:p-6">
        <div className="space-y-5">
          <Field
            label="Complaint title"
            htmlFor="title"
            required
            error={fieldErrors.title}
            hint="A short summary — for example “Projector in Lab 3 is not switching on”."
          >
            <Input
              id="title"
              name="title"
              type="text"
              required
              maxLength={TITLE_MAX}
              placeholder="Briefly describe the issue"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              invalid={Boolean(fieldErrors.title)}
              disabled={isPending}
            />
            <div className="flex justify-end">
              <span className="text-xs text-slate-400">
                {title.length}/{TITLE_MAX}
              </span>
            </div>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Category"
              htmlFor="categoryId"
              required
              error={fieldErrors.categoryId}
            >
              <Select
                id="categoryId"
                name="categoryId"
                required
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                invalid={Boolean(fieldErrors.categoryId)}
                disabled={isPending}
              >
                <option value="">Select a category…</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Priority"
              htmlFor="priority"
              required
              error={fieldErrors.priority}
              hint={PRIORITY_META[priority as keyof typeof PRIORITY_META]?.description}
            >
              <Select
                id="priority"
                name="priority"
                required
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                invalid={Boolean(fieldErrors.priority)}
                disabled={isPending}
              >
                {COMPLAINT_PRIORITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Description"
            htmlFor="description"
            required
            error={fieldErrors.description}
            hint={`At least ${DESCRIPTION_MIN} characters. Include what happened, how long it has been an issue, and any impact.`}
          >
            <Textarea
              id="description"
              name="description"
              required
              rows={6}
              maxLength={DESCRIPTION_MAX}
              placeholder="Describe the problem in detail…"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              invalid={Boolean(fieldErrors.description)}
              disabled={isPending}
            />
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "text-xs",
                  description.length > 0 && description.length < DESCRIPTION_MIN
                    ? "text-amber-600"
                    : "text-slate-400",
                )}
              >
                {description.length < DESCRIPTION_MIN
                  ? `${DESCRIPTION_MIN - description.length} more character${
                      DESCRIPTION_MIN - description.length === 1 ? "" : "s"
                    } needed`
                  : "Looks good"}
              </span>
              <span className="text-xs text-slate-400">
                {description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
          </Field>

          <Field
            label="Location"
            htmlFor="location"
            error={fieldErrors.location}
            hint="Where is the issue? For example “Block B, Computer Lab 3”."
          >
            <Input
              id="location"
              name="location"
              type="text"
              maxLength={150}
              placeholder="Building, room or area (optional)"
              invalid={Boolean(fieldErrors.location)}
              disabled={isPending}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <ImageUpload userId={userId} />
      </Card>

      <Alert variant="info">
        <span className="inline-flex items-start gap-1.5">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Make sure the details are accurate. Once an administrator starts
          reviewing your complaint it can no longer be edited or withdrawn.
        </span>
      </Alert>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="lg"
          loading={isPending}
          loadingText="Submitting complaint…"
        >
          <Send className="size-4" aria-hidden />
          Submit complaint
        </Button>
        <Link href="/dashboard/complaints" className={buttonClasses("outline", "lg")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
