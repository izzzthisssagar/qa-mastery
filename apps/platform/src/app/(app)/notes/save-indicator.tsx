"use client";

import type { SaveStatus } from "./autosave";

const COPY: Record<Exclude<SaveStatus, "idle">, string> = {
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save",
};

/** Tri-state honesty about a background save — never lands on a silent
 *  "saved" that isn't true, and always offers a way out of "error". */
export function SaveIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus;
  onRetry?: () => void;
}) {
  if (status === "idle") return null;
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        status === "error"
          ? "text-danger-text"
          : status === "saved"
            ? "text-success-text"
            : "text-muted-foreground"
      }`}
    >
      {COPY[status]}
      {status === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="underline underline-offset-2 hover:text-foreground"
        >
          Retry
        </button>
      )}
    </span>
  );
}
