"use client";

import * as React from "react";
import { Image as ImageIcon, Trash2, UploadCloud } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { IMAGE_BUCKET } from "@/lib/constants";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  cn,
  createStorageObjectName,
  formatFileSize,
  isAllowedImageType,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";

type UploadStatus = "idle" | "uploading" | "ready" | "error";

/**
 * Complaint image attachment.
 *
 * The file is uploaded to Supabase Storage as soon as it is chosen, and the
 * resulting object path is submitted with the form. Storage RLS only allows a
 * user to write inside their own folder, and the server rebuilds the public URL
 * from this path rather than trusting a client-supplied one.
 */
export function ImageUpload({
  userId,
  label = "Supporting image",
  hint = "JPG, JPEG, PNG or WEBP · up to 5 MB",
}: {
  userId: string;
  label?: string;
  hint?: string;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [objectPath, setObjectPath] = React.useState<string>("");
  const [status, setStatus] = React.useState<UploadStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [progressLabel, setProgressLabel] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Release the object URL when the preview changes or unmounts.
  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setObjectPath("");
    setStatus("idle");
    setError(null);
    setProgressLabel("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setError(null);

    // ---- Client-side validation (the bucket enforces the same limits) ----
    if (!isAllowedImageType(selected.type)) {
      setStatus("error");
      setError(
        `${selected.name} is not a supported image. Please choose a JPG, PNG or WEBP file.`,
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (selected.size > MAX_IMAGE_BYTES) {
      setStatus("error");
      setError(
        `That image is ${formatFileSize(selected.size)}. The maximum allowed size is ${formatFileSize(MAX_IMAGE_BYTES)}.`,
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (selected.size === 0) {
      setStatus("error");
      setError("That file is empty. Please choose another image.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStatus("uploading");
    setProgressLabel("Uploading image…");

    try {
      const supabase = getSupabaseBrowserClient();
      const path = createStorageObjectName(userId, selected.name);

      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, selected, {
          cacheControl: "3600",
          upsert: false,
          contentType: selected.type,
        });

      if (uploadError) {
        // A friendly message — the raw storage error is never shown.
        setStatus("error");
        setError(
          uploadError.message.toLowerCase().includes("size")
            ? "The image is too large to upload. Please choose a smaller file."
            : "The image could not be uploaded. Check your connection and try again.",
        );
        setObjectPath("");
        return;
      }

      setObjectPath(path);
      setStatus("ready");
      setProgressLabel("Image ready to attach.");
    } catch {
      setStatus("error");
      setError(
        "Uploads are unavailable because Supabase is not configured. You can still submit the complaint without an image.",
      );
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">Optional</span>
      </div>

      <input type="hidden" name="imagePath" value={objectPath} />

      {!file ? (
        <label
          htmlFor="complaint-image"
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors",
            "border-slate-300 bg-slate-50/60 hover:border-brand-400 hover:bg-brand-50/40",
            status === "error" && "border-rose-300 bg-rose-50/40",
          )}
        >
          <UploadCloud className="size-6 text-slate-400" aria-hidden />
          <span className="mt-2 text-sm font-medium text-slate-700">
            Click to attach an image
          </span>
          <span className="mt-0.5 text-xs text-slate-500">{hint}</span>
          <input
            ref={inputRef}
            id="complaint-image"
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleSelect}
            className="sr-only"
            aria-describedby="complaint-image-hint"
          />
          <span id="complaint-image-hint" className="sr-only">
            {hint}. Accepted formats: JPG, JPEG, PNG and WEBP.
          </span>
        </label>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex gap-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt={`Preview of ${file.name}`}
                className="size-20 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
              />
            ) : (
              <span className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <ImageIcon className="size-5 text-slate-400" aria-hidden />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatFileSize(file.size)}
              </p>

              <p
                className={cn(
                  "mt-1.5 text-xs font-medium",
                  status === "uploading" && "text-slate-500",
                  status === "ready" && "text-emerald-600",
                  status === "error" && "text-rose-600",
                )}
                role="status"
              >
                {status === "ready"
                  ? "Uploaded — will be attached to your complaint."
                  : status === "uploading"
                    ? progressLabel
                    : error}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={status === "uploading"}
                >
                  <ImageIcon className="size-3.5" aria-hidden />
                  Change
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  disabled={status === "uploading"}
                  className="text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Remove
                </Button>
              </div>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleSelect}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      )}

      {status === "error" && !file ? (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
