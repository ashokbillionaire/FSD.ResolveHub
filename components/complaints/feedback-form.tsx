"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import {
  createFeedbackAction,
  type FeedbackActionState,
} from "@/lib/actions/feedback-actions";
import { initialActionState } from "@/lib/validations/common";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

const RATING_LABELS: Record<number, string> = {
  1: "Very poor",
  2: "Poor",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

export function FeedbackForm({ complaintId }: { complaintId: string }) {
  const [state, formAction, isPending] = React.useActionState<
    FeedbackActionState,
    FormData
  >(createFeedbackAction, initialActionState);

  const [rating, setRating] = React.useState(0);
  const [hovered, setHovered] = React.useState(0);
  const [comment, setComment] = React.useState("");

  // toast() talks to an external system (the toaster), not React state, so this
  // effect does not trigger the cascading-render problem.
  React.useEffect(() => {
    if (state.status === "success") toast.success(state.message);
  }, [state]);

  if (state.status === "success") {
    return (
      <Alert variant="success" title="Thank you for your feedback">
        Your rating has been recorded and is now visible to the administrator
        reviewing this complaint.
      </Alert>
    );
  }

  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const activeRating = hovered || rating;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="complaintId" value={complaintId} />
      <input type="hidden" name="rating" value={rating} />

      {state.status === "error" && !state.fieldErrors ? (
        <Alert variant="error">{state.message}</Alert>
      ) : null}

      <fieldset>
        <legend className="text-sm font-medium text-slate-900">
          How was your complaint handled?
        </legend>
        <p className="mt-0.5 text-xs text-slate-500">
          Your rating helps the administration measure resolution quality.
        </p>

        <div
          className="mt-3 flex items-center gap-1"
          onMouseLeave={() => setHovered(0)}
        >
          <div
            role="radiogroup"
            aria-label="Rating out of 5"
            className="flex items-center gap-1"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} star${star > 1 ? "s" : ""} — ${RATING_LABELS[star]}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onFocus={() => setHovered(star)}
                onBlur={() => setHovered(0)}
                disabled={isPending}
                className="rounded-md p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed"
              >
                <Star
                  className={cn(
                    "size-7 transition-colors",
                    star <= activeRating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-200",
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>

          <span
            className="ml-2 text-sm font-medium text-slate-600"
            aria-live="polite"
          >
            {activeRating > 0 ? RATING_LABELS[activeRating] : "Select a rating"}
          </span>
        </div>

        {fieldErrors.rating ? (
          <p role="alert" className="mt-2 text-xs font-medium text-rose-600">
            {fieldErrors.rating}
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-1.5">
        <label
          htmlFor="feedback-comment"
          className="block text-sm font-medium text-slate-700"
        >
          Comments
          <span className="ml-1.5 text-xs font-normal text-slate-500">
            (optional)
          </span>
        </label>
        <Textarea
          id="feedback-comment"
          name="comment"
          rows={4}
          maxLength={1000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Tell us what went well or what could be improved…"
          disabled={isPending}
          invalid={Boolean(fieldErrors.comment)}
        />
        <div className="flex items-center justify-between gap-3">
          {fieldErrors.comment ? (
            <p role="alert" className="text-xs font-medium text-rose-600">
              {fieldErrors.comment}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-slate-400">{comment.length}/1000</span>
        </div>
      </div>

      <Button
        type="submit"
        loading={isPending}
        loadingText="Submitting…"
        disabled={rating === 0}
      >
        Submit feedback
      </Button>
    </form>
  );
}

/** Read-only card shown once feedback has already been submitted. */
export function SubmittedFeedback({
  rating,
  comment,
  createdAt,
  authorName,
}: {
  rating: number;
  comment: string | null;
  createdAt: string;
  authorName?: string | null;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-0.5" aria-hidden>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "size-5",
                star <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200",
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-slate-900">
          {rating} out of 5 — {RATING_LABELS[rating] ?? ""}
        </span>
      </div>

      {comment ? (
        <p className="rounded-lg bg-slate-50 p-3.5 text-sm text-slate-700">
          {comment}
        </p>
      ) : (
        <p className="text-sm text-slate-500 italic">No comment provided.</p>
      )}

      <p className="text-xs text-slate-500">
        Submitted by {authorName ?? "you"} on{" "}
        {new Date(createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
