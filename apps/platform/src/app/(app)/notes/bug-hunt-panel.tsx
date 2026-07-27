"use client";

import { useEffect, useState } from "react";
import { Button } from "@qa-mastery/ui";
import { BugReportLab } from "@/components/bug-report-lab";
import { useHelpAgent } from "@/components/help-agent/help-agent-context";
import {
  getNoteHuntStatus,
  launchNoteSandbox,
  submitNoteBugReport,
  type NoteHuntStatus,
} from "./bug-hunt-actions";

/**
 * The bug-hunt chapter lab. Same shape as the lesson-bound `HuntPanel`
 * (`learn/[slug]/hunt-panel.tsx`) — launch a sandbox, track distinct seeded
 * bugs found against how many the lab requires — keyed by chapter instead of
 * lesson, plus a contextual "stuck?" affordance the lesson version doesn't
 * have, since this is the version learners actually reach.
 */
export function BugHuntPanel({
  chapterSlug,
  title,
  minValidBugs,
}: {
  chapterSlug: string;
  title: string;
  minValidBugs: number;
}) {
  const [status, setStatus] = useState<NoteHuntStatus | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const { openWithPrompt } = useHelpAgent();

  async function onLaunch() {
    setLaunching(true);
    setLaunchError(null);
    try {
      const url = await launchNoteSandbox(chapterSlug);
      window.open(url, "_blank");
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : "Could not launch sandbox");
    } finally {
      setLaunching(false);
    }
  }

  async function refresh() {
    try {
      setStatus(await getNoteHuntStatus(chapterSlug));
    } catch {
      /* progress display is best-effort; never block the hunt */
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      try {
        const next = await getNoteHuntStatus(chapterSlug);
        if (!cancelled) setStatus(next);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chapterSlug]);

  const found = status?.found.length ?? 0;
  const required = status?.required ?? minValidBugs;
  const complete = found >= required;
  const pct = required > 0 ? Math.round((Math.min(found, required) / required) * 100) : 0;

  return (
    <section data-testid="note-bug-hunt" className="my-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Bug hunt · {title}</h3>
          <p className="text-sm text-muted-foreground">
            Launch your sandbox and hunt for {required} seeded bug{required === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              openWithPrompt(
                `I'm stuck on the bug-hunt lab "${title}" in BuggyShop — can you help me think through it?`,
              )
            }
            data-testid="bug-hunt-ask-mentor"
          >
            Stuck? Ask the mentor
          </Button>
          <Button onClick={onLaunch} disabled={launching} data-testid="launch-note-sandbox-btn">
            {launching ? "Provisioning..." : "Launch BuggyShop sandbox"}
          </Button>
        </div>
      </div>

      {launchError && (
        <p data-testid="note-launch-error" className="mt-3 text-sm text-danger-text">
          {launchError}
        </p>
      )}

      <div
        className={
          complete
            ? "rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5"
            : "rounded-2xl border border-border bg-surface/40 p-5"
        }
      >
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-foreground">Bug hunt progress</span>
          <span data-testid="note-hunt-count" className="text-sm text-muted-foreground">
            {Math.min(found, required)} of {required} found
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded bg-surface-raised">
          <div
            className={complete ? "h-2 bg-emerald-400" : "h-2 bg-accent"}
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
        {complete && (
          <p
            data-testid="note-hunt-complete"
            className="mt-3 text-sm font-semibold text-success-text"
          >
            🏅 Lab passed — you found every required bug.
          </p>
        )}
      </div>

      <div className="mt-4">
        <BugReportLab
          onSubmit={(report) => submitNoteBugReport(chapterSlug, report)}
          onGraded={() => void refresh()}
        />
      </div>
    </section>
  );
}
