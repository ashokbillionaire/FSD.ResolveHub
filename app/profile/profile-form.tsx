"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Upload, User } from "lucide-react";
import { toast } from "sonner";

import {
  updateProfileAction,
  type AuthActionState,
} from "@/lib/actions/auth-actions";
import { initialActionState } from "@/lib/validations/common";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  MAX_IMAGE_BYTES,
  cn,
  createStorageObjectName,
  formatFileSize,
  isAllowedImageType,
} from "@/lib/utils";
import { Alert, Avatar } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const AVATAR_BUCKET = "avatars";

export function ProfileForm({
  userId,
  fullName,
  email,
  avatarUrl,
}: {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = React.useActionState<
    AuthActionState,
    FormData
  >(updateProfileAction, initialActionState);

  const [name, setName] = React.useState(fullName);
  const [avatar, setAvatar] = React.useState<string | null>(avatarUrl);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      router.refresh();
    }
  }, [state, router]);

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!isAllowedImageType(file.type)) {
      setUploadError("Please choose a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES / 2) {
      setUploadError(
        `That image is ${formatFileSize(file.size)}. Avatars must be 2 MB or smaller.`,
      );
      return;
    }

    setUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const path = createStorageObjectName(userId, file.name);

      const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (error) {
        setUploadError("The avatar could not be uploaded. Please try again.");
        return;
      }

      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      setAvatar(data.publicUrl);
      toast.success("Avatar uploaded. Save your profile to apply it.");
    } catch {
      setUploadError(
        "Uploads are unavailable because Supabase is not configured.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="avatarUrl" value={avatar ?? ""} />

      {state.status === "error" && !state.fieldErrors ? (
        <Alert variant="error">{state.message}</Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-5">
        <Avatar name={name} src={avatar} size="lg" />

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">Profile picture</p>
          <p className="mt-0.5 text-xs text-slate-500">
            JPG, PNG or WEBP · up to 2 MB
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
              loadingText="Uploading…"
            >
              {uploading ? null : <Upload className="size-3.5" aria-hidden />}
              {avatar ? "Replace image" : "Upload image"}
            </Button>

            {avatar ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAvatar(null)}
                className="text-slate-500"
              >
                Remove
              </Button>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="sr-only"
            aria-label="Upload a profile picture"
          />

          {uploadError ? (
            <p role="alert" className="mt-2 text-xs font-medium text-rose-600">
              {uploadError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
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
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            invalid={Boolean(fieldErrors.fullName)}
            disabled={isPending || uploading}
          />
        </Field>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-slate-700">
            Email address
          </span>
          <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            <User className="size-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{email}</span>
          </div>
          <p className="text-xs text-slate-500">
            Your email address is tied to your account and cannot be changed
            here.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          loading={isPending}
          loadingText="Saving…"
          disabled={uploading || name.trim() === fullName.trim() && avatar === avatarUrl}
        >
          {isPending ? (
            <Loader2 className="hidden" />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          Save changes
        </Button>

        {name.trim() === fullName.trim() && avatar === avatarUrl ? (
          <span className={cn("text-xs text-slate-500")}>
            No changes to save yet.
          </span>
        ) : null}
      </div>
    </form>
  );
}
