"use client";

import { useState } from "react";
import { Button } from "@qa-mastery/ui";
import {
  BUG_PAGES,
  BUG_FEATURES,
  BUG_CATEGORIES,
  SEVERITIES,
  type Severity,
} from "@qa-mastery/grading";
import { createBrowserSupabase } from "@qa-mastery/db";
import { submitBugReport, type BugReportResult } from "../actions";

const FIELD = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-accent focus:outline-none";

export function BugReportLab({
  slug,
  onGraded,
}: {
  slug: string;
  onGraded?: (result: BugReportResult) => void;
}) {
  const [page, setPage] = useState("");
  const [feature, setFeature] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [result, setResult] = useState<BugReportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete =
    page && feature && category && severity && title.trim() && expected.trim() && actual.trim();

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEvidence(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop();
      const filename = `${Math.random().toString(36).slice(2)}.${ext}`;
      const supabase = createBrowserSupabase();
      
      const { error: uploadError } = await supabase.storage.from("evidence").upload(filename, file);
      if (uploadError) throw new Error(uploadError.message);
      
      const { data: { publicUrl } } = supabase.storage.from("evidence").getPublicUrl(filename);
      setEvidenceUrl(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evidence upload failed.");
    } finally {
      setUploadingEvidence(false);
    }
  }

  async function onSubmit() {
    if (!complete) return;
    setSubmitting(true);
    setError(null);
    try {
      const graded = await submitBugReport(slug, {
        page,
        feature,
        category,
        severity: severity as Severity,
        title: title.trim(),
        steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
        expected: expected.trim(),
        actual: actual.trim(),
        evidenceUrl: evidenceUrl || undefined,
      });
      setResult(graded);
      onGraded?.(graded);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit your report.");
    } finally {
      setSubmitting(false);
    }
  }

  function fileAnother() {
    setResult(null);
    setError(null);
    setPage("");
    setFeature("");
    setCategory("");
    setSeverity("");
    setTitle("");
    setSteps("");
    setExpected("");
    setActual("");
    setEvidenceUrl("");
  }

  return (
    <section
      data-testid="bug-report-lab"
      className="my-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
    >
      <p className="text-sm font-semibold text-zinc-100">File a bug report</p>
      <p className="mt-1 text-xs text-zinc-500">
        Find the bug on BuggyShop&apos;s Products page, then report it the way a real tester
        would. Page + feature must be right to match; category and severity affect your score.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Page
          <select data-testid="bug-page" className={FIELD} value={page} onChange={(e) => setPage(e.target.value)} disabled={!!result}>
            <option value="">Select…</option>
            {BUG_PAGES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Feature
          <select data-testid="bug-feature" className={FIELD} value={feature} onChange={(e) => setFeature(e.target.value)} disabled={!!result}>
            <option value="">Select…</option>
            {BUG_FEATURES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Category
          <select data-testid="bug-category" className={FIELD} value={category} onChange={(e) => setCategory(e.target.value)} disabled={!!result}>
            <option value="">Select…</option>
            {BUG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Severity
          <select data-testid="bug-severity" className={FIELD} value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} disabled={!!result}>
            <option value="">Select…</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3 space-y-3">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Title
          <input data-testid="bug-title" className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="One-line summary" disabled={!!result} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Steps to reproduce (one per line)
          <textarea data-testid="bug-steps" className={`${FIELD} min-h-16`} value={steps} onChange={(e) => setSteps(e.target.value)} disabled={!!result} />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Expected
            <textarea data-testid="bug-expected" className={`${FIELD} min-h-16`} value={expected} onChange={(e) => setExpected(e.target.value)} disabled={!!result} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Actual
            <textarea data-testid="bug-actual" className={`${FIELD} min-h-16`} value={actual} onChange={(e) => setActual(e.target.value)} disabled={!!result} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Evidence (Screenshot)
          {evidenceUrl ? (
            <div className="mt-1 flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
              <span className="truncate">Uploaded successfully</span>
              <Button variant="secondary" onClick={() => setEvidenceUrl("")} disabled={!!result} className="ml-auto text-xs py-1 px-2 h-auto">Remove</Button>
            </div>
          ) : (
            <div className="relative">
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg" 
                onChange={handleFileUpload} 
                disabled={uploadingEvidence || !!result} 
                className={`${FIELD} file:mr-4 file:rounded-md file:border-0 file:bg-zinc-800 file:px-4 file:py-1 file:text-xs file:font-semibold file:text-zinc-300 hover:file:bg-zinc-700`}
                data-testid="bug-evidence"
              />
              {uploadingEvidence && <span className="absolute right-3 top-2.5 text-xs text-accent">Uploading...</span>}
            </div>
          )}
        </label>
      </div>

      {result && (
        <div
          data-testid="bug-result"
          className={
            result.matched && !result.duplicate
              ? "mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3"
              : "mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3"
          }
        >
          <p className="text-sm font-semibold text-zinc-100">
            {result.matched
              ? result.duplicate
                ? "Already reported"
                : `Matched ${result.matchedBugId} · ${result.score} pts`
              : "No match"}
          </p>
          <ul data-testid="bug-feedback" className="mt-2 space-y-1 text-xs text-zinc-400">
            {result.feedback.map((line, i) => <li key={i}>• {line}</li>)}
          </ul>
        </div>
      )}

      {error && <p data-testid="bug-error" className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-5">
        {result ? (
          <Button variant="secondary" onClick={fileAnother} data-testid="bug-file-another">
            File another report
          </Button>
        ) : (
          <Button onClick={onSubmit} disabled={!complete || submitting || uploadingEvidence} data-testid="bug-submit">
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        )}
      </div>
    </section>
  );
}
