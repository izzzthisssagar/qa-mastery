"use client";

import { useState } from "react";
import { Button } from "@qa-mastery/ui";
import type { CapstoneResult, ShipRecommendation } from "@qa-mastery/grading";
import { useHydrated } from "@/hooks/use-hydrated";
import { submitNoteCapstone, type NoteCapstoneState } from "./capstone-actions";

const FIELD =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none";

/**
 * The track-closing capstone panel — same rubric UI as the legacy lesson
 * capstone (learn/[slug]/capstone-panel.tsx), calling the note_slug-keyed
 * action instead. Kept as its own component rather than reusing that one:
 * this reads/writes through capstone-actions.ts, not learn/actions.ts, and a
 * shared component importing from both server-action modules would blur
 * which trust boundary owns which slug shape.
 */
export function TrackCapstone({ state }: { state: NoteCapstoneState }) {
  const hydrated = useHydrated();
  const [scope, setScope] = useState("");
  const [risks, setRisks] = useState("");
  const [approach, setApproach] = useState("");
  const [recommendation, setRecommendation] = useState<ShipRecommendation | "">("");
  const [result, setResult] = useState<CapstoneResult | null>(state.lastResult);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = state.topicsRemaining > 0;
  const complete = scope.trim() && risks.trim() && approach.trim() && recommendation;

  async function onSubmit() {
    if (!complete) return;
    setSubmitting(true);
    setError(null);
    try {
      setResult(
        await submitNoteCapstone(state.chapterSlug, {
          scope: scope.trim(),
          risks: risks.trim(),
          approach: approach.trim(),
          recommendation: recommendation as ShipRecommendation,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit your capstone.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      data-hydrated={hydrated}
      className={`my-10 rounded-2xl border p-5 ${
        result?.score === 100 ? "border-accent/50 bg-accent/5" : "border-accent/30 bg-surface"
      }`}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span aria-hidden>🎓</span>
          <span>Track capstone · {state.title}</span>
        </h2>
        {result?.score === 100 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            passed
          </span>
        )}
      </div>
      <p className="text-[15px] text-foreground/90">{state.brief}</p>

      {locked ? (
        <p className="mt-4 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          Finish the last {state.topicsRemaining} note
          {state.topicsRemaining === 1 ? "" : "s"} in this chapter to unlock the capstone.
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            The deliverable: scope, risks, a technique-led approach, and a ship call. It&apos;s
            checked against a rubric on submit — revise and resubmit as many times as you want.
          </p>
          <div className="mt-4 space-y-3">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Scope (what&apos;s in / out of test)
              <textarea
                className={`${FIELD} min-h-16`}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                disabled={!hydrated}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Risks (one per line, ranked)
              <textarea
                className={`${FIELD} min-h-20`}
                value={risks}
                onChange={(e) => setRisks(e.target.value)}
                disabled={!hydrated}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Approach (name the techniques per requirement)
              <textarea
                className={`${FIELD} min-h-16`}
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                disabled={!hydrated}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Ship recommendation
              <select
                className={FIELD}
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value as ShipRecommendation)}
                disabled={!hydrated}
              >
                <option value="">Select…</option>
                <option value="go">Go</option>
                <option value="go-with-conditions">Go with conditions</option>
                <option value="no-go">No-go</option>
              </select>
            </label>
          </div>

          <div className="mt-5">
            <Button onClick={onSubmit} disabled={!complete || submitting || !hydrated}>
              {submitting ? "Submitting…" : "Submit capstone"}
            </Button>
          </div>
        </>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-bug/40 bg-bug/10 px-3 py-2 text-sm text-foreground"
        >
          {error}
        </p>
      )}

      {result && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3"
        >
          <p className="text-sm font-semibold text-foreground">Rubric — {result.score}%</p>
          <ul className="mt-2 space-y-1 text-xs">
            {result.checklist.map((c) => (
              <li key={c.label} className={c.passed ? "text-accent" : "text-warning-text"}>
                <span className="sr-only">{c.passed ? "Passed: " : "Failed: "}</span>
                <span aria-hidden="true">{c.passed ? "✓" : "✗"}</span> {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
