"use client";

import { useState, useTransition } from "react";
import { getPortfolioSignedUrl } from "@/app/(app)/talent/actions";

/** Fetches a short-lived signed URL on click and opens the attached proof file.
 *  The URL is minted server-side only after the RLS visibility check passes. */
export function AssetDownload({ itemId }: { itemId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function open() {
    setError(null);
    startTransition(async () => {
      const res = await getPortfolioSignedUrl(itemId);
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
        className="text-xs text-accent hover:underline disabled:opacity-50"
      >
        {pending ? "Preparing…" : "View attached file →"}
      </button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </span>
  );
}
