"use server";

import { createServiceClient } from "@qa-mastery/db";
import { findLessonBySlug, loadQuiz } from "@qa-mastery/curriculum";
import {
  scoreQuiz,
  matchBugReport,
  type QuizAnswers,
  type QuizQuestion,
  type BugReportInput,
  type ManifestBug,
} from "@qa-mastery/grading";
import { DEFAULT_RELEASE, isRelease } from "@qa-mastery/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthedUserId } from "@/lib/auth";

type Step = "see" | "try" | "do" | "prove";

interface LessonRegistryRow {
  id: string;
  free: boolean;
  status: string;
}

const XP_LESSON_COMPLETED = 50;

/** Does this learner hold the Pro entitlement? */
async function hasProEntitlement(service: SupabaseClient, userId: string): Promise<boolean> {
  const { count } = await service
    .from("entitlements")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "pro");
  return (count ?? 0) > 0;
}

/** Look up a published, accessible lesson by slug. Free lessons are open to all;
 *  paid lessons require the learner's Pro entitlement. Throws otherwise. */
async function requireAccessibleLesson(
  service: SupabaseClient,
  slug: string,
  userId: string,
): Promise<LessonRegistryRow> {
  const { data, error } = await service
    .from("lessons")
    .select("id, free, status")
    .eq("slug", slug)
    .maybeSingle<LessonRegistryRow>();
  if (error) throw new Error(error.message);
  if (!data || data.status !== "published") throw new Error("Lesson not available");
  if (!data.free && !(await hasProEntitlement(service, userId))) {
    throw new Error("Lesson requires Pro");
  }
  return data;
}

/** Whether the current learner has Pro (for UI gating). */
export async function getProStatus(): Promise<{ pro: boolean }> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  return { pro: await hasProEntitlement(service, userId) };
}

/** Mock "upgrade to Pro" — grants the entitlement via the service role. A real
 *  billing webhook would write the same row. */
export async function grantPro(): Promise<{ ok: true }> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const { error } = await service
    .from("entitlements")
    .upsert({ user_id: userId, kind: "pro" }, { onConflict: "user_id,kind" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

/** Record progress. `step` marks one of the see/try/do/prove milestones; no
 *  step just ensures a 'started' row exists. Completion is owned by submitQuiz. */
export async function saveProgress(slug: string, step?: Step): Promise<{ ok: true }> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const lesson = await requireAccessibleLesson(service, slug, userId);

  const { data: existing } = await service
    .from("progress")
    .select("step_state, status")
    .eq("user_id", userId)
    .eq("lesson_id", lesson.id)
    .maybeSingle<{ step_state: Record<string, boolean>; status: string }>();

  const stepState = { ...(existing?.step_state ?? {}) };
  if (step) stepState[step] = true;

  const { error } = await service.from("progress").upsert(
    {
      user_id: userId,
      lesson_id: lesson.id,
      status: existing?.status ?? "started",
      step_state: stepState,
    },
    { onConflict: "user_id,lesson_id" },
  );
  if (error) throw new Error(error.message);
  return { ok: true };
}

export interface QuizQuestionResultForClient {
  id: string;
  correct: boolean;
  correctIndices: number[];
  explanation: string | null;
}

export interface SubmitQuizResult {
  score: number;
  maxScore: number;
  passed: boolean;
  passMark: number;
  perQuestion: QuizQuestionResultForClient[];
}

/** Grade a quiz server-side against the answer key (never shipped to the
 *  client), persist the attempt, and on a first pass mark the lesson complete,
 *  award XP, and seed flashcards into the review queue. */
export async function submitQuiz(
  slug: string,
  answers: QuizAnswers,
): Promise<SubmitQuizResult> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const lesson = await requireAccessibleLesson(service, slug, userId);

  const quiz = loadQuiz(slug);
  const questions = quiz.questions as QuizQuestion[];
  const result = scoreQuiz(questions, answers);

  const { count } = await service
    .from("quiz_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("lesson_id", lesson.id);
  const attemptNo = (count ?? 0) + 1;

  const { error: insertError } = await service.from("quiz_attempts").insert({
    user_id: userId,
    lesson_id: lesson.id,
    attempt_no: attemptNo,
    score: result.score,
    max_score: result.maxScore,
    passed: result.passed,
    answers,
  });
  if (insertError) throw new Error(insertError.message);

  if (result.passed) {
    const { data: prog } = await service
      .from("progress")
      .select("status, step_state")
      .eq("user_id", userId)
      .eq("lesson_id", lesson.id)
      .maybeSingle<{ status: string; step_state: Record<string, boolean> }>();

    const firstCompletion = prog?.status !== "completed";

    await service.from("progress").upsert(
      {
        user_id: userId,
        lesson_id: lesson.id,
        status: "completed",
        step_state: { ...(prog?.step_state ?? {}), prove: true },
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );

    if (firstCompletion) {
      await service.from("xp_events").insert({
        user_id: userId,
        amount: XP_LESSON_COMPLETED,
        reason: "lesson_completed",
        ref_id: slug,
      });

      const flashcards = findLessonBySlug(slug)?.frontmatter.flashcards ?? [];
      if (flashcards.length > 0) {
        const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await service.from("review_queue").upsert(
          flashcards.map((card, i) => ({
            user_id: userId,
            card_key: `${slug}:${i}`,
            lesson_id: lesson.id,
            front: card.front,
            back: card.back,
            due_at: dueAt,
          })),
          { onConflict: "user_id,card_key", ignoreDuplicates: true },
        );
      }
    }
  }

  return {
    score: result.score,
    maxScore: result.maxScore,
    passed: result.passed,
    passMark: result.passMark,
    perQuestion: questions.map((q) => {
      const r = result.perQuestion.find((p) => p.id === q.id);
      return {
        id: q.id,
        correct: r?.correct ?? false,
        correctIndices: q.correct,
        explanation: quiz.questions.find((qq) => qq.id === q.id)?.explanation ?? null,
      };
    }),
  };
}

interface BugManifestRow {
  bug_id: string;
  release: string;
  page: string;
  feature: string;
  category: string;
  severity: ManifestBug["severity"];
  points: number;
  title_internal: string;
  expected: string | null;
}

export interface BugReportResult {
  matched: boolean;
  duplicate: boolean;
  score: number;
  feedback: string[];
  matchedBugId: string | null;
}

/** The release this lesson's lab grades against — from its frontmatter, server
 *  side, so the client can't aim grading at a release where the bug is fixed. */
function lessonRelease(slug: string): string {
  const source = findLessonBySlug(slug);
  const declared = source?.frontmatter.requires_release;
  return declared && isRelease(declared) ? declared : DEFAULT_RELEASE;
}

/** Grade a bug-report lab submission against the seeded-bug manifest (read
 *  server-side from the deny-all buggyshop schema), persist it, and mark the
 *  "do" step. The answer key (title_internal, expected) never reaches the
 *  client except as post-match feedback. */
export async function submitBugReport(
  slug: string,
  report: BugReportInput,
): Promise<BugReportResult> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const lesson = await requireAccessibleLesson(service, slug, userId);
  const release = lessonRelease(slug);

  const { data: rows, error: manifestError } = await service
    .schema("buggyshop")
    .from("bs_bug_manifest")
    .select("bug_id, release, page, feature, category, severity, points, title_internal, expected")
    .eq("release", release)
    .returns<BugManifestRow[]>();
  if (manifestError) throw new Error(manifestError.message);

  const manifest: ManifestBug[] = (rows ?? []).map((r) => ({
    id: r.bug_id,
    release: r.release,
    page: r.page,
    feature: r.feature,
    category: r.category,
    severity: r.severity,
    points: r.points,
    titleInternal: r.title_internal,
    expected: r.expected ?? "",
  }));

  // Bugs this learner already matched on this lesson — duplicates score 0.
  const { data: prior } = await service
    .from("bug_reports")
    .select("matched_bug_id")
    .eq("user_id", userId)
    .eq("lesson_id", lesson.id)
    .not("matched_bug_id", "is", null);
  const alreadyMatched = new Set((prior ?? []).map((p) => p.matched_bug_id as string));

  const outcome = matchBugReport(report, manifest, alreadyMatched);

  const { error: insertError } = await service.from("bug_reports").insert({
    user_id: userId,
    lesson_id: lesson.id,
    matched_bug_id: outcome.matched?.id ?? null,
    page: report.page,
    feature: report.feature,
    category: report.category,
    severity: report.severity,
    title: report.title,
    steps: report.steps,
    expected: report.expected,
    actual: report.actual,
    score: outcome.score,
    matched: outcome.matched !== null,
    duplicate: outcome.duplicate,
    feedback: outcome.feedback,
  });
  if (insertError) throw new Error(insertError.message);

  // Filing a report counts as doing the lab.
  await saveProgress(slug, "do");

  return {
    matched: outcome.matched !== null,
    duplicate: outcome.duplicate,
    score: outcome.score,
    feedback: outcome.feedback,
    matchedBugId: outcome.matched?.id ?? null,
  };
}

export interface HuntStatus {
  /** Distinct seeded-bug ids this learner has matched on this lesson. */
  found: string[];
  /** Seeded bugs available to find in the lesson's release. */
  total: number;
}

/** Bug-hunt progress for the current learner: how many distinct seeded bugs
 *  they've matched on this lesson, out of the total in the release manifest. */
export async function getHuntStatus(slug: string): Promise<HuntStatus> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const lesson = await requireAccessibleLesson(service, slug, userId);
  const release = lessonRelease(slug);

  const { count } = await service
    .schema("buggyshop")
    .from("bs_bug_manifest")
    .select("*", { count: "exact", head: true })
    .eq("release", release);

  const { data } = await service
    .from("bug_reports")
    .select("matched_bug_id")
    .eq("user_id", userId)
    .eq("lesson_id", lesson.id)
    .not("matched_bug_id", "is", null);

  const found = [...new Set((data ?? []).map((r) => r.matched_bug_id as string))];
  return { found, total: count ?? 0 };
}
