"use client";

/**
 * The chapter-closing graded lab.
 *
 * Unlike the note components, this is NOT authored in MDX — labs are declared in
 * the curriculum registry (`notes/labs.ts`) and rendered after the last topic of
 * their chapter, so adding a lab never touches an .mdx file. It looks like
 * <CodePlayground> on purpose: the learner has already used that control in
 * every note, and the only new idea here is that this one is graded.
 */

import { useState, useTransition } from "react";
import { Spinner } from "@qa-mastery/ui";
import { BugHuntPanel } from "./bug-hunt-panel";
import { submitNoteLab, type NoteLabResult, type NoteLabState } from "./lab-actions";

export function ChapterLab({ state }: { state: NoteLabState }) {
  const [code, setCode] = useState(state.starter ?? "");
  const [result, setResult] = useState<NoteLabResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Passed on a previous visit, or (code_run only) passed just now in this
  // session — bug_report's own BugHuntPanel tracks live progress internally
  // and shows its own "lab passed" state, so this header badge only reflects
  // state.passed for that kind until the next page load.
  const solved = state.passed || result?.passed === true;
  const locked = state.topicsRemaining > 0;

  return (
    <section
      className={`my-10 rounded-2xl border p-5 ${
        solved ? "border-accent/50 bg-accent/5" : "border-accent/30 bg-surface"
      }`}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span aria-hidden>🧪</span>
          <span>Chapter lab · {state.title}</span>
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {solved ? "passed" : `+${state.xp} XP`}
        </span>
      </div>
      <p className="text-[15px] text-foreground/90">{state.brief}</p>

      {locked ? (
        <p className="mt-4 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          Finish the last {state.topicsRemaining} note
          {state.topicsRemaining === 1 ? "" : "s"} in this chapter to unlock the lab.
        </p>
      ) : state.kind === "bug_report" ? (
        <BugHuntPanel
          chapterSlug={state.chapterSlug}
          title={state.title}
          minValidBugs={state.minValidBugs ?? 1}
        />
      ) : (
        <>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={Math.min(18, Math.max(8, code.split("\n").length + 2))}
            className="mt-4 w-full resize-y rounded-xl border border-border bg-background p-3 font-mono text-[13px] leading-relaxed text-foreground outline-none focus:border-accent"
            aria-label="Your solution"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                start(async () => {
                  try {
                    setResult(await submitNoteLab(state.chapterSlug, code));
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Submission failed — try again.");
                  }
                });
              }}
              aria-busy={pending || undefined}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
            >
              {pending && <Spinner className="size-3.5" />}
              <span>
                {pending ? "Grading…" : solved ? "▶ Run again" : "▶ Submit for grading"}
              </span>
            </button>
            <span className="text-xs text-muted-foreground">
              {solved
                ? "Already passed — re-running will not award XP again."
                : "Runs on the real code runner and checks your output."}
            </span>
          </div>
        </>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-bug/40 bg-bug/10 px-3 py-2 text-sm text-foreground">
          {error}
        </p>
      )}

      {result && !error && (
        <div className="mt-4 space-y-3">
          {result.console && (
            <pre className="overflow-x-auto rounded-xl border border-border bg-background p-3 font-mono text-[13px] text-foreground/90">
              {result.console}
            </pre>
          )}

          <ul className="space-y-1.5">
            {result.checks.map((check) => (
              <li key={check.label} className="flex gap-2 text-sm">
                <span aria-hidden className={check.passed ? "text-accent" : "text-bug"}>
                  {check.passed ? "✓" : "✗"}
                </span>
                <span className="text-foreground/90">
                  {check.label}
                  {check.detail && (
                    <span className="block text-xs text-muted-foreground">{check.detail}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <p
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              result.passed ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
            }`}
          >
            {result.passed
              ? result.xpAwarded > 0
                ? `Lab passed · +${result.xpAwarded} XP`
                : "Lab passed — XP was already awarded."
              : `${result.score}% of checks passing — keep going.`}
          </p>
        </div>
      )}
    </section>
  );
}
