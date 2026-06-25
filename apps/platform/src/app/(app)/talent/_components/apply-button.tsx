"use client";

import { useState, useTransition } from "react";
import { Button } from "@qa-mastery/ui";
import { applyToProject } from "@/app/(app)/talent/actions";

export function ApplyButton({ projectId, applied }: { projectId: string; applied: boolean }) {
  const [done, setDone] = useState(applied);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return <p className="text-sm text-emerald-300">You&apos;ve applied to this project.</p>;
  }

  function apply() {
    setError(null);
    startTransition(async () => {
      const res = await applyToProject(projectId, note);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  return (
    <div className="space-y-3">
      {open && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Optional: why you're a fit (your relevant proof)."
          aria-label="Application note"
          className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:border-zinc-500"
        />
      )}
      <div className="flex items-center gap-3">
        <Button onClick={open ? apply : () => setOpen(true)} disabled={pending}>
          {pending ? "Applying…" : open ? "Submit application" : "Apply"}
        </Button>
        {error && <span className="text-sm text-red-300">{error}</span>}
      </div>
    </div>
  );
}
