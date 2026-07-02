"use client";

import { useState, useTransition } from "react";
import { launchBuggyApi } from "./actions";

/**
 * Dashboard promo card for BuggyAPI — mints a sandbox handoff and opens the
 * API console in a new tab (same UX as launching a BuggyShop lab).
 */
export function BuggyApiCard() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function launch() {
    setError(null);
    startTransition(async () => {
      try {
        const url = await launchBuggyApi();
        window.open(url, "_blank", "noopener");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not launch BuggyAPI");
      }
    });
  }

  return (
    <button
      type="button"
      data-testid="buggyapi-card"
      onClick={launch}
      disabled={pending}
      className="group mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.05] px-5 py-4 text-left transition-colors hover:border-cyan-500/50 disabled:opacity-60"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-400">BuggyAPI</p>
        <p className="mt-1 font-medium text-zinc-100">
          Practice API testing on a live, documented API →
        </p>
        <p className="mt-0.5 text-sm text-zinc-400">
          {error ??
            "TaskFlight: real endpoints, three auth schemes, Swagger docs, your own sandbox."}
        </p>
      </div>
      <span className="hidden shrink-0 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition group-hover:opacity-90 sm:inline">
        {pending ? "Launching…" : "Launch"}
      </span>
    </button>
  );
}
