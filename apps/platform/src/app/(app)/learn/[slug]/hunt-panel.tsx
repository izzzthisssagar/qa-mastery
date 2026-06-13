"use client";

import { useEffect, useState } from "react";
import { BugReportLab } from "./lab-panel";
import { getHuntStatus, type HuntStatus } from "../actions";

/**
 * The Bug Hunt milestone surface. Reuses the bug-report form, but tracks how
 * many distinct seeded bugs the learner has matched on this lesson against the
 * total in the release. The hunt grows automatically as more bugs are seeded.
 */
export function HuntPanel({ slug }: { slug: string }) {
  const [status, setStatus] = useState<HuntStatus | null>(null);

  // Best-effort progress fetch; called from an event handler after each report.
  async function refresh() {
    try {
      setStatus(await getHuntStatus(slug));
    } catch {
      /* progress display is best-effort; never block the hunt */
    }
  }

  useEffect(() => {
    let cancelled = false;
    // Yield once so the first setState never fires synchronously in the effect.
    void (async () => {
      await Promise.resolve();
      try {
        const next = await getHuntStatus(slug);
        if (!cancelled) setStatus(next);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const found = status?.found.length ?? 0;
  const total = status?.total ?? 0;
  const complete = total > 0 && found >= total;
  const pct = total > 0 ? Math.round((found / total) * 100) : 0;

  return (
    <section data-testid="bug-hunt" className="my-6">
      <div
        className={
          complete
            ? "rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5"
            : "rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
        }
      >
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-zinc-100">Bug Hunt progress</span>
          <span data-testid="hunt-count" className="text-sm text-zinc-400">
            {found} of {total} seeded bugs found
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded bg-zinc-800">
          <div
            className={complete ? "h-2 bg-emerald-400" : "h-2 bg-accent"}
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
        {found > 0 && (
          <ul data-testid="hunt-found" className="mt-3 flex flex-wrap gap-2">
            {status?.found.map((id) => (
              <li
                key={id}
                className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200"
              >
                {id}
              </li>
            ))}
          </ul>
        )}
        {complete && (
          <p data-testid="hunt-complete" className="mt-3 text-sm font-semibold text-emerald-300">
            🏅 Milestone complete — you found every seeded bug in this release.
          </p>
        )}
      </div>

      <div className="mt-4">
        <BugReportLab slug={slug} onGraded={() => void refresh()} />
      </div>
    </section>
  );
}
