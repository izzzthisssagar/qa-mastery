"use client";

import { useState, useTransition } from "react";
import { reportContent } from "@/app/(app)/talent/actions";

/** Lightweight report control — opens a reason box, files to the moderation
 *  queue (service-role triage). */
export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "profile" | "project" | "message";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) return <span className="text-xs text-muted-foreground">Reported — thanks.</span>;

  function submit() {
    const r = reason.trim();
    if (!r) return;
    setError(null);
    startTransition(async () => {
      const res = await reportContent(targetType, targetId, r);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-muted-foreground"
      >
        Report
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder="What's wrong with this?"
        aria-label="Report reason"
        className="w-full resize-y rounded-lg border border-border bg-surface/60 px-2 py-1.5 text-xs text-foreground outline-none focus-visible:border-border"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !reason.trim()}
          className="rounded-md border border-border px-2 py-1 text-xs text-foreground hover:border-border disabled:opacity-40"
        >
          Submit report
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-muted-foreground">
          Cancel
        </button>
        {error && <span className="text-xs text-danger-text">{error}</span>}
      </div>
    </div>
  );
}
