"use server";

import type { NoteLab } from "@qa-mastery/curriculum";
import { createServiceClient } from "@qa-mastery/db";
import {
  gradeLabRun,
  validateCodeSubmission,
  type LabCheckResult,
  type RunResult,
} from "@qa-mastery/grading";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthedUserId } from "@/lib/auth";
import { assertCodeRunQuota, getCodeRunner } from "@/lib/code-runs";
import { requireNoteLab, topicsRemaining } from "./lab-shared";

/**
 * Note-spine lab submission. The lesson-bound equivalents live in
 * `learn/actions.ts`; this is the same shape keyed by a CHAPTER slug
 * ("module/chapter") instead of a lesson row, because notes have no `lessons`
 * FK — exactly the trade `note_progress` (0029) already made for completion.
 *
 * Invariant 2 holds by construction: every score-bearing write here goes
 * through the service role, and `code_runs` has no learner insert policy.
 */

const XP_LAB_FALLBACK = 40;

export interface NoteLabState {
  chapterSlug: string;
  title: string;
  brief: string;
  kind: NoteLab["kind"];
  language?: string;
  starter?: string;
  xp: number;
  /** bug_report only — which practice app the hunt targets. */
  target?: NoteLab["target"];
  /** bug_report only — distinct bugs required to pass. */
  minValidBugs?: number;
  /** Chapter notes still unread — the lab stays locked until this is empty. */
  topicsRemaining: number;
  /** True once any submission for this chapter has passed. */
  passed: boolean;
}

export interface NoteLabResult {
  passed: boolean;
  score: number;
  checks: LabCheckResult[];
  /** Raw runner output, shown above the check list. */
  console: string;
  /** XP awarded by THIS submission — 0 on a repeat pass. */
  xpAwarded: number;
}

/** Whether this learner has ever passed this chapter's lab. */
async function hasPassed(
  service: SupabaseClient,
  userId: string,
  chapterSlug: string,
  kind: NoteLab["kind"],
  minValidBugs: number,
): Promise<boolean> {
  if (kind === "bug_report") {
    // Distinct bugs, not report rows — a learner can match the same bug once;
    // further attempts on it score 0 as a duplicate (see matchBugReport).
    const { data } = await service
      .from("bug_reports")
      .select("matched_bug_id")
      .eq("user_id", userId)
      .eq("note_slug", chapterSlug)
      .not("matched_bug_id", "is", null);
    const distinct = new Set((data ?? []).map((r) => r.matched_bug_id as string));
    return distinct.size >= minValidBugs;
  }
  const { count } = await service
    .from("code_runs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("note_slug", chapterSlug)
    .eq("passed", true);
  return (count ?? 0) > 0;
}

/** Initial render state for a chapter's lab panel. */
export async function getNoteLabState(chapterSlug: string): Promise<NoteLabState> {
  const { lab, moduleSlug, topicSlugs } = requireNoteLab(chapterSlug);
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  const [remaining, passed] = await Promise.all([
    topicsRemaining(service, userId, moduleSlug, lab.chapterSlug.split("/")[1]!, topicSlugs),
    hasPassed(service, userId, chapterSlug, lab.kind, lab.minValidBugs ?? 1),
  ]);

  return {
    chapterSlug,
    title: lab.title,
    brief: lab.brief,
    kind: lab.kind,
    language: lab.language,
    starter: lab.starter,
    xp: lab.xp,
    target: lab.target,
    minValidBugs: lab.minValidBugs,
    topicsRemaining: remaining,
    passed,
  };
}

/**
 * Run and grade a code_run lab.
 *
 * The runner only reports whether the program exited cleanly — `WandboxRunner`
 * derives `passed` from exit code 0, so an empty `main` would "pass". The
 * verdict that counts comes from `gradeLabRun` asserting on the output, and
 * that is what gets persisted.
 */
export async function submitNoteLab(chapterSlug: string, code: string): Promise<NoteLabResult> {
  const { lab, moduleSlug, topicSlugs } = requireNoteLab(chapterSlug);
  if (lab.kind !== "code_run") throw new Error("This lab is not a code lab.");

  const userId = await getAuthedUserId();
  const service = createServiceClient();

  // Gate on the chapter being read before the closing exercise opens.
  const remaining = await topicsRemaining(
    service,
    userId,
    moduleSlug,
    lab.chapterSlug.split("/")[1]!,
    topicSlugs,
  );
  if (remaining > 0) {
    throw new Error(`Finish the ${remaining} remaining note(s) in this chapter first.`);
  }

  // Validate and rate-limit before forwarding to the (compute-heavy) runner.
  const validated = validateCodeSubmission(code);
  await assertCodeRunQuota(service, userId);

  const alreadyPassed = await hasPassed(service, userId, chapterSlug, "code_run", 1);

  const runner = getCodeRunner();
  const language = lab.language ?? "python";
  const request = { lessonSlug: chapterSlug, userId, payload: { code: validated, language } };

  // Wandbox is synchronous, so the sync path is the real one. An async runner
  // can't grade inline (no output yet), which is why browser labs aren't
  // code_run labs — see getCodeRunner.
  const run: RunResult = runner.executeSync
    ? await runner.executeSync(request)
    : await runner.getResult((await runner.submit(request)).runId);

  const grade = gradeLabRun(lab.checks ?? [], {
    console: run.console,
    source: validated,
    ranCleanly: run.passed,
  });

  const { error } = await service.from("code_runs").insert({
    user_id: userId,
    lesson_id: null,
    note_slug: chapterSlug,
    runner: runner.name,
    run_id: crypto.randomUUID(),
    language,
    // The graded verdict, not the runner's clean-exit flag.
    status: grade.passed ? "passed" : run.status === "passed" ? "failed" : run.status,
    passed: grade.passed,
    result: { ...run, passed: grade.passed, staticChecks: grade.checks },
  });
  if (error) throw new Error(error.message);

  // XP on the FIRST pass only — re-running a solved lab must not farm it.
  let xpAwarded = 0;
  if (grade.passed && !alreadyPassed) {
    xpAwarded = lab.xp || XP_LAB_FALLBACK;
    await service.from("xp_events").insert({
      user_id: userId,
      amount: xpAwarded,
      reason: "note_lab_passed",
      ref_id: chapterSlug,
    });
  }

  // Best-effort audit; a failure here must never fail the submission.
  await service
    .from("audit_events")
    .insert({
      actor_id: userId,
      action: "note_lab.submitted",
      target: chapterSlug,
      metadata: { runner: runner.name, passed: grade.passed, score: grade.score },
    })
    .then(({ error: auditError }) => {
      if (auditError) console.error("audit_events insert failed:", auditError.message);
    });

  return {
    passed: grade.passed,
    score: grade.score,
    checks: grade.checks,
    console: run.console,
    xpAwarded,
  };
}
