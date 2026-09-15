"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderTree, Info, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type AdminActionState,
} from "@/lib/actions/admin-actions";
import { initialActionState } from "@/lib/validations/common";
import { cn } from "@/lib/utils";
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
} from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ConfirmSubmit } from "@/components/ui/confirm-dialog";
import type { CategoryWithCount } from "@/types";

export function CategoryManager({
  categories,
  totalComplaints,
}: {
  categories: CategoryWithCount[];
  totalComplaints: number;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [createState, createAction, createPending] = React.useActionState<
    AdminActionState,
    FormData
  >(createCategoryAction, initialActionState);

  React.useEffect(() => {
    if (createState.status === "success") {
      toast.success(createState.message);
      router.refresh();
    } else if (createState.status === "error" && !createState.fieldErrors) {
      toast.error(createState.message);
    }
  }, [createState, router]);

  const createErrors =
    createState.status === "error" ? createState.fieldErrors ?? {} : {};

  const unusedCount = categories.filter((c) => c.complaint_count === 0).length;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------ Create form */}
      <Card>
        <CardHeader
          title="Add a category"
          description="Categories group complaints so they can be routed and analysed."
        />
        <CardBody>
          <form action={createAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Category name"
                htmlFor="new-category-name"
                required
                error={createErrors.name}
              >
                <Input
                  id="new-category-name"
                  name="name"
                  type="text"
                  required
                  maxLength={60}
                  placeholder="e.g. Laboratory Equipment"
                  disabled={createPending}
                  invalid={Boolean(createErrors.name)}
                />
              </Field>

              <Field
                label="Description"
                htmlFor="new-category-description"
                error={createErrors.description}
              >
                <Input
                  id="new-category-description"
                  name="description"
                  type="text"
                  maxLength={300}
                  placeholder="What kind of issues belong here?"
                  disabled={createPending}
                  invalid={Boolean(createErrors.description)}
                />
              </Field>
            </div>

            <Button
              type="submit"
              loading={createPending}
              loadingText="Adding…"
            >
              <Plus className="size-4" aria-hidden />
              Add category
            </Button>
          </form>
        </CardBody>
      </Card>

      <Alert variant="info">
        <span className="inline-flex items-start gap-1.5">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          A category that is referenced by any complaint cannot be deleted — the
          database enforces this with a foreign key. {unusedCount} of{" "}
          {categories.length} categories can currently be deleted.
        </span>
      </Alert>

      {/* ------------------------------------------------------- Categories */}
      <Card>
        <CardHeader
          title="Complaint categories"
          description={`${categories.length} categories · ${totalComplaints} complaint${
            totalComplaints === 1 ? "" : "s"
          } across the system`}
        />

        {categories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No categories yet"
            description="Add at least one category before complaints can be submitted."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                editing={editingId === category.id}
                onEdit={() => setEditingId(category.id)}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function CategoryRow({
  category,
  editing,
  onEdit,
  onCancel,
  onSaved,
}: {
  category: CategoryWithCount;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const updateFormId = `update-category-${category.id}`;
  const deleteFormId = `delete-category-${category.id}`;

  const [updateState, updateAction, updatePending] = React.useActionState<
    AdminActionState,
    FormData
  >(updateCategoryAction, initialActionState);

  const [deleteState, deleteAction] = React.useActionState<
    AdminActionState,
    FormData
  >(deleteCategoryAction, initialActionState);

  React.useEffect(() => {
    if (updateState.status === "success") {
      toast.success(updateState.message);
      onSaved();
    } else if (updateState.status === "error" && !updateState.fieldErrors) {
      toast.error(updateState.message);
    }
  }, [updateState, onSaved]);

  React.useEffect(() => {
    if (deleteState.status === "success") {
      toast.success(deleteState.message);
      onSaved();
    } else if (deleteState.status === "error") {
      toast.error(deleteState.message);
    }
  }, [deleteState, onSaved]);

  const updateErrors =
    updateState.status === "error" ? updateState.fieldErrors ?? {} : {};

  const inUse = category.complaint_count > 0;

  if (editing) {
    return (
      <li className="bg-slate-50/70 px-4 py-4 sm:px-5">
        <form id={updateFormId} action={updateAction} className="space-y-4">
          <input type="hidden" name="id" value={category.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Category name"
              htmlFor={`name-${category.id}`}
              required
              error={updateErrors.name}
            >
              <Input
                id={`name-${category.id}`}
                name="name"
                type="text"
                required
                maxLength={60}
                defaultValue={category.name}
                disabled={updatePending}
                invalid={Boolean(updateErrors.name)}
              />
            </Field>

            <Field
              label="Description"
              htmlFor={`description-${category.id}`}
              error={updateErrors.description}
            >
              <Textarea
                id={`description-${category.id}`}
                name="description"
                rows={2}
                maxLength={300}
                defaultValue={category.description ?? ""}
                disabled={updatePending}
                invalid={Boolean(updateErrors.description)}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="submit"
              size="sm"
              loading={updatePending}
              loadingText="Saving…"
            >
              Save changes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={updatePending}
            >
              <X className="size-3.5" aria-hidden />
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 hover:bg-slate-50/70 sm:px-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-slate-900">{category.name}</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
              inUse
                ? "bg-brand-50 text-brand-700 ring-brand-200"
                : "bg-slate-100 text-slate-500 ring-slate-200",
            )}
          >
            {category.complaint_count} complaint
            {category.complaint_count === 1 ? "" : "s"}
          </span>
        </div>
        {category.description ? (
          <p className="mt-1 text-xs text-slate-500">{category.description}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-400 italic">
            No description provided.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <form id={updateFormId} action={updateAction} className="hidden">
          <input type="hidden" name="id" value={category.id} />
        </form>

        <form id={deleteFormId} action={deleteAction} className="hidden">
          <input type="hidden" name="id" value={category.id} />
        </form>

        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </Button>

        <ConfirmSubmit
          formId={deleteFormId}
          variant="ghost"
          size="sm"
          title={`Delete "${category.name}"?`}
          confirmLabel="Delete category"
          description={
            inUse
              ? `This category is used by ${category.complaint_count} complaint(s) and the database will refuse to delete it. Rename it instead, or reassign those complaints first.`
              : "This category is not used by any complaint and will be permanently removed."
          }
          className="text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Delete
        </ConfirmSubmit>
      </div>
    </li>
  );
}
