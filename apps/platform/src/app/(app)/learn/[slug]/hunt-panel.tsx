"use client";

import { useEffect, useState } from "react";
import { Button } from "@qa-mastery/ui";
import { BugReportLab } from "./lab-panel";
import { getHuntStatus, launchSandbox, type HuntStatus } from "../actions";

/**
 * The Bug Hunt milestone surface. Reuses the bug-report form, but tracks how
 * many distinct seeded bugs the learner has matched on this lesson against the
 * total in the release. The hunt grows automatically as more bugs are seeded.
 */
export function HuntPanel({ slug }: { slug: string }) {
  const [status, setStatus] = useState<HuntStatus | null>(null);
  const [launching, setLaunching] = useState(false);

  async function onLaunch() {
    setLaunching(true);
    try {
      const url = await launchSandbox(slug);
      window.open(url, "_blank");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not launch sandbox");
    } finally {
      setLaunching(false);
    }
  }

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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Practice Lab</h2>
          <p className="text-sm text-zinc-400">Launch your sandbox and hunt for the seeded bugs.</p>
        </div>
        <Button onClick={onLaunch} disabled={launching} data-testid="launch-sandbox-btn">
          {launching ? "Provisioning..." : "Launch BuggyShop Sandbox"}
        </Button>
      </div>

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
