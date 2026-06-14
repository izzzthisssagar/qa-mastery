"use client";

import { useState } from "react";
import { Button } from "@qa-mastery/ui";
import type { CapstoneResult, ShipRecommendation } from "@qa-mastery/grading";
import { submitCapstone } from "../actions";

const FIELD =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-accent focus:outline-none";

export function CapstonePanel({ slug }: { slug: string }) {
  const [scope, setScope] = useState("");
  const [risks, setRisks] = useState("");
  const [approach, setApproach] = useState("");
  const [recommendation, setRecommendation] = useState<ShipRecommendation | "">("");
  const [result, setResult] = useState<CapstoneResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = scope.trim() && risks.trim() && approach.trim() && recommendation;

  async function onSubmit() {
    if (!complete) return;
    setSubmitting(true);
    setError(null);
    try {
      setResult(
        await submitCapstone(slug, {
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
      data-testid="capstone-panel"
      className="my-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
    >
      <p className="text-sm font-semibold text-zinc-100">Submit your test plan</p>
      <p className="mt-1 text-xs text-zinc-500">
        The deliverable: scope, risks, a technique-led approach, and a ship call. It&apos;s checked
        against a rubric on submit.
      </p>

      <div className="mt-4 space-y-3">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Scope (what&apos;s in / out of test)
          <textarea data-testid="cap-scope" className={`${FIELD} min-h-16`} value={scope} onChange={(e) => setScope(e.target.value)} disabled={!!result} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Risks (one per line, ranked)
          <textarea data-testid="cap-risks" className={`${FIELD} min-h-20`} value={risks} onChange={(e) => setRisks(e.target.value)} disabled={!!result} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Approach (name the techniques per requirement)
          <textarea data-testid="cap-approach" className={`${FIELD} min-h-16`} value={approach} onChange={(e) => setApproach(e.target.value)} disabled={!!result} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Ship recommendation
          <select data-testid="cap-recommendation" className={FIELD} value={recommendation} onChange={(e) => setRecommendation(e.target.value as ShipRecommendation)} disabled={!!result}>
            <option value="">Select…</option>
            <option value="go">Go</option>
            <option value="go-with-conditions">Go with conditions</option>
            <option value="no-go">No-go</option>
          </select>
        </label>
      </div>

      {result && (
        <div
          data-testid="capstone-result"
          role="status"
          aria-live="polite"
          className="mt-4 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3"
        >
          <p className="text-sm font-semibold text-zinc-100">Rubric — {result.score}%</p>
          <ul data-testid="capstone-checklist" className="mt-2 space-y-1 text-xs">
            {result.checklist.map((c) => (
              <li key={c.label} className={c.passed ? "text-accent" : "text-amber-300"}>
                <span className="sr-only">{c.passed ? "Passed: " : "Failed: "}</span>
                <span aria-hidden="true">{c.passed ? "✓" : "✗"}</span> {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p data-testid="capstone-error" role="alert" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}

      {!result && (
        <div className="mt-5">
          <Button onClick={onSubmit} disabled={!complete || submitting} data-testid="cap-submit">
            {submitting ? "Submitting…" : "Submit capstone"}
          </Button>
        </div>
      )}
    </section>
  );
}
