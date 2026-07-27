import "server-only";

import { findLessonBySlug, loadQuiz } from "@qa-mastery/curriculum";
import { scoreQuiz, type QuizAnswers, type QuizQuestion } from "@qa-mastery/grading";
import type { SupabaseClient } from "@supabase/supabase-js";
import { touchStreak } from "@/lib/streaks";
import type { SubmitQuizResult } from "../action-types";
import { requireAccessibleLesson } from "./access";
import { recordAuditEvent } from "./audit";

const XP_LESSON_COMPLETED = 50;

/** Grade a quiz server-side against the answer key (never shipped to the
 *  client), persist the attempt, and on a first pass mark the lesson complete,
 *  award XP, and seed flashcards into the review queue. */
export async function scoreAndRecordQuiz(
  service: SupabaseClient,
  userId: string,
  slug: string,
  answers: QuizAnswers,
): Promise<SubmitQuizResult> {
  const lesson = await requireAccessibleLesson(service, slug);

  const quiz = loadQuiz(slug);
  const questions = quiz.questions as QuizQuestion[];
  const result = scoreQuiz(questions, answers);

  // attempt_no is unique per (user, lesson). A naive count-then-insert races on
  // rapid re-submit (double-click / retry) and the second insert hits 23505.
  // Retry on conflict, recomputing the next number each pass, so concurrency
  // never fails the learner. (A max+1 DB trigger would NOT fix this — both
  // transactions read the same max and the second still collides.)
  for (let attempt = 0; ; attempt++) {
    const { count } = await service
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("lesson_id", lesson.id);
    const attemptNo = (count ?? 0) + 1 + attempt;

    const { error: insertError } = await service.from("quiz_attempts").insert({
      user_id: userId,
      lesson_id: lesson.id,
      attempt_no: attemptNo,
      score: result.score,
      max_score: result.maxScore,
      passed: result.passed,
      answers,
    });
    if (!insertError) break;
    if (insertError.code !== "23505") throw new Error(insertError.message);
    if (attempt >= 4) {
      throw new Error("Could not record quiz attempt (too many concurrent submissions)");
    }
  }

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
      await touchStreak(service, userId);

      await recordAuditEvent(service, {
        actorId: userId,
        action: "lesson.completed",
        target: slug,
        metadata: { score: result.score, maxScore: result.maxScore },
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
