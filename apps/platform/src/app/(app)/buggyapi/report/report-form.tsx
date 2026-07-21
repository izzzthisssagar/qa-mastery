"use client";

import { useState } from "react";
import { Button } from "@qa-mastery/ui";
import {
  API_BUG_SURFACES,
  API_BUG_ENDPOINTS,
  API_BUG_CATEGORIES,
  SEVERITIES,
  type Severity,
} from "@qa-mastery/grading";
import { submitApiBugReport, type ApiBugReportResult } from "../../dashboard/actions";

const FIELD =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

/**
 * File a BuggyAPI (TaskFlight) bug-hunt report. Mirrors BuggyShop's lab form,
 * but the "where" is surface (rest/graphql/soap/ws) + endpoint. Only visible in
 * bug-hunt mode — the clean reference API has nothing to report. Grading and
 * the score write happen server-side in submitApiBugReport (invariants 1 & 2).
 */
export function ApiBugReportForm() {
  const [surface, setSurface] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [result, setResult] = useState<ApiBugReportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete =
    surface && endpoint && category && severity && title && steps && expected && actual;

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitApiBugReport({
        surface,
        endpoint,
        category,
        severity: severity as Severity,
        title,
        steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
        expected,
        actual,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  }

  function fileAnother() {
    setResult(null);
    setError(null);
    setSurface("");
    setEndpoint("");
    setCategory("");
    setSeverity("");
    setTitle("");
    setSteps("");
    setExpected("");
    setActual("");
  }

  return (
    <section
      data-testid="api-bug-report-lab"
      className="my-6 rounded-2xl border border-border bg-surface/40 p-6"
    >
      <p className="text-sm font-semibold text-foreground">File an API bug report</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Hunt the contract violations in TaskFlight&apos;s bug-hunt mode, then report each the
        way a real API tester would. Surface + endpoint must be right to match; category and
        severity affect your score.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Surface
          <select data-testid="api-bug-surface" className={FIELD} value={surface} onChange={(e) => setSurface(e.target.value)} disabled={!!result}>
            <option value="">Select…</option>
            {API_BUG_SURFACES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Endpoint
          <select data-testid="api-bug-endpoint" className={FIELD} value={endpoint} onChange={(e) => setEndpoint(e.target.value)} disabled={!!result}>
            <option value="">Select…</option>
            {API_BUG_ENDPOINTS.map((e2) => <option key={e2} value={e2}>{e2}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Category
          <select data-testid="api-bug-category" className={FIELD} value={category} onChange={(e) => setCategory(e.target.value)} disabled={!!result}>
            <option value="">Select…</option>
            {API_BUG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Severity
          <select data-testid="api-bug-severity" className={FIELD} value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} disabled={!!result}>
            <option value="">Select…</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3 space-y-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Title
          <input data-testid="api-bug-title" className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="One-line summary" disabled={!!result} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Steps to reproduce (one per line)
          <textarea data-testid="api-bug-steps" className={`${FIELD} min-h-16`} value={steps} onChange={(e) => setSteps(e.target.value)} disabled={!!result} />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Expected (per the OpenAPI contract)
            <textarea data-testid="api-bug-expected" className={`${FIELD} min-h-16`} value={expected} onChange={(e) => setExpected(e.target.value)} disabled={!!result} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Actual (what the API returned)
            <textarea data-testid="api-bug-actual" className={`${FIELD} min-h-16`} value={actual} onChange={(e) => setActual(e.target.value)} disabled={!!result} />
          </label>
        </div>
      </div>

      {result && (
        <div
          data-testid="api-bug-result"
          className={
            result.matched && !result.duplicate
              ? "mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3"
              : "mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3"
          }
        >
          <p className="text-sm font-semibold text-foreground">
            {result.matched
              ? result.duplicate
                ? "Already reported"
                : `Matched ${result.matchedBugId} · ${result.score} pts`
              : "No match"}
          </p>
          <ul data-testid="api-bug-feedback" className="mt-2 space-y-1 text-xs text-muted-foreground">
            {result.feedback.map((line, i) => <li key={i}>• {line}</li>)}
          </ul>
        </div>
      )}

      {error && <p data-testid="api-bug-error" className="mt-4 text-sm text-danger-text">{error}</p>}

      <div className="mt-5">
        {result ? (
          <Button variant="secondary" onClick={fileAnother} data-testid="api-bug-file-another">
            File another report
          </Button>
        ) : (
          <Button onClick={onSubmit} disabled={!complete || submitting} data-testid="api-bug-submit">
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        )}
      </div>
    </section>
  );
}
