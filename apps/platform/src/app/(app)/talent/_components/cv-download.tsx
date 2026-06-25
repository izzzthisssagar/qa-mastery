"use client";

import { useState, useTransition } from "react";
import { getCvSignedUrl } from "@/app/(app)/talent/actions";

/** Fetches a short-lived signed URL for a public tester's CV and opens it. */
export function CvDownload({ handle }: { handle: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function open() {
    setError(null);
    startTransition(async () => {
      const res = await getCvSignedUrl(handle);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.open(res.data.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={open}
        disabled={pending}
        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500 disabled:opacity-50"
      >
        {pending ? "Preparing…" : "Download CV"}
      </button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </span>
  );
}
