"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { launchBuggyApi } from "./actions";

/**
 * Dashboard promo card for BuggyAPI — mints a sandbox handoff and opens the
 * API console in a new tab. Two launches: the clean reference API, or
 * bug-hunt mode with seeded contract violations to find and report.
 */
export function BuggyApiCard() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function launch(mode: "clean" | "bughunt") {
    setError(null);
    startTransition(async () => {
      try {
        const res = await launchBuggyApi(mode);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        window.open(res.url, "_blank", "noopener");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not launch BuggyAPI");
      }
    });
  }

  return (
    <div
      data-testid="buggyapi-card"
      className="mt-4 flex w-full flex-col gap-4 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.05] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-400">BuggyAPI</p>
        <p className="mt-1 font-medium text-foreground">
          Practice API testing on a live, documented API →
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {error ??
            "TaskFlight: REST, OAuth2, GraphQL, SOAP & WebSocket — Swagger docs, your own sandbox."}
        </p>
        <Link
          href="/buggyapi/report"
          data-testid="buggyapi-report-link"
          className="mt-2 inline-block text-xs font-medium text-cyan-300 underline-offset-2 hover:underline"
        >
          Found a bug? File a report →
        </Link>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          data-testid="buggyapi-launch-clean"
          onClick={() => launch("clean")}
          disabled={pending}
          className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Launching…" : "Explore"}
        </button>
        <button
          type="button"
          data-testid="buggyapi-launch-bughunt"
          onClick={() => launch("bughunt")}
          disabled={pending}
          className="rounded-lg border border-cyan-500/40 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-60"
        >
          Bug hunt
        </button>
      </div>
    </div>
  );
}
