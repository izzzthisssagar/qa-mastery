"use client";

import { useState, useTransition } from "react";
import { submitFeedback, type FeedbackInput } from "@/app/(app)/feedback/actions";

type FeedbackType = FeedbackInput["type"];

const TYPES: { value: FeedbackType; label: string }[] = [
  { value: "feature", label: "Feature idea" },
  { value: "bug", label: "Something's broken" },
  { value: "ux", label: "Confusing" },
  { value: "content", label: "Content" },
  { value: "pricing", label: "Pricing" },
  { value: "praise", label: "Praise" },
];

/**
 * Floating feedback widget (bottom-left, so it never collides with the
 * help-agent button at bottom-right). Learner-authored feedback flows straight
 * into the `feedback` table via the RLS-enforced server action, where it feeds
 * the marketing triage loop. Plain anchor-free button so it stays out of the
 * routing/e2e surface.
 */
export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<FeedbackType>("feature");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  function reset() {
    setMessage("");
    setRating(undefined);
    setType("feature");
    setError(null);
    setDone(false);
  }

  function send() {
    setError(null);
    startTransition(async () => {
      const context =
        typeof window !== "undefined" ? window.location.pathname : undefined;
      const res = await submitFeedback({ type, message, rating, context });
      if (res.ok) {
        setDone(true);
        setMessage("");
        setRating(undefined);
      } else {
        setError(res.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-200 shadow-lg backdrop-blur transition-colors hover:border-accent/60 hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:left-6"
      >
        <span aria-hidden className="text-accent">✦</span> Feedback
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[min(92vw,22rem)] rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur sm:left-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-100">
          Tell us what to build next
        </h2>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          aria-label="Close feedback"
          className="rounded-md px-1.5 text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          ✕
        </button>
      </div>

      {done ? (
        <div className="space-y-3 py-2">
          <p className="text-sm text-zinc-300">
            <span className="text-accent">Got it.</span> We read every one — and
            a lot of them turn into things we ship.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-accent/20 transition-shadow hover:shadow-accent/30"
          >
            Send another
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  type === t.value
                    ? "bg-accent text-zinc-950"
                    : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder={
              type === "praise"
                ? "What did you love?"
                : "What do you want, or what went wrong?"
            }
            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />

          <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
            <span className="mr-1 text-xs text-zinc-500">Rate (optional):</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRating(rating === n ? undefined : n)}
                className={`text-base leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  rating && n <= rating ? "text-bug" : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="button"
            onClick={send}
            disabled={pending || message.trim().length === 0}
            className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-accent/20 transition-shadow hover:shadow-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send feedback"}
          </button>
        </div>
      )}
    </div>
  );
}
