"use server";

import { createServiceClient } from "@qa-mastery/db";
import { findLessonBySlug, loadQuiz } from "@qa-mastery/curriculum";
import { scoreQuiz, type QuizAnswers, type QuizQuestion } from "@qa-mastery/grading";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthedUserId } from "@/lib/auth";

type Step = "see" | "try" | "do" | "prove";

interface LessonRegistryRow {
  id: string;
  free: boolean;
  status: string;
}

const XP_LESSON_COMPLETED = 50;

/** Look up a published, accessible lesson by slug. M1 gate: free lessons only
 *  (entitlements land in M3). Throws if the lesson isn't available. */
async function requireAccessibleLesson(
  service: SupabaseClient,
  slug: string,
): Promise<LessonRegistryRow> {
  const { data, error } = await service
    .from("lessons")
    .select("id, free, status")
    .eq("slug", slug)
    .maybeSingle<LessonRegistryRow>();
  if (error) throw new Error(error.message);
  if (!data || data.status !== "published") throw new Error("Lesson not available");
  if (!data.free) throw new Error("Lesson requires Pro"); // TODO(M3): check entitlements
  return data;
}

/** Record progress. `step` marks one of the see/try/do/prove milestones; no
 *  step just ensures a 'started' row exists. Completion is owned by submitQuiz. */
export async function saveProgress(slug: string, step?: Step): Promise<{ ok: true }> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const lesson = await requireAccessibleLesson(service, slug);

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
  const lesson = await requireAccessibleLesson(service, slug);

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
