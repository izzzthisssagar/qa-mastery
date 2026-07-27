import "server-only";

import { findLessonBySlug } from "@qa-mastery/curriculum";
import { validateCodeSubmission, type RunResult, type RunnerProvider } from "@qa-mastery/grading";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertCodeRunQuota, getCodeRunner } from "@/lib/code-runs";
import { requireAccessibleLesson } from "./access";
import { recordAuditEvent } from "./audit";
import { saveProgressForUser } from "./progress";

function getRunnerForLesson(slug: string): RunnerProvider {
  const lesson = findLessonBySlug(slug);
  if (!lesson) throw new Error("Lesson not found");

  // Track B (automation) drives a real browser; everything else is plain code.
  // The ladder itself lives in @/lib/code-runs so note labs share it.
  const browser = lesson.frontmatter.module !== "B0" && lesson.frontmatter.track === "track-b";
  return getCodeRunner({ browser });
}

export async function runCodeSubmission(
  service: SupabaseClient,
  userId: string,
  slug: string,
  code: string,
): Promise<{ runId: string }> {
  const lesson = await requireAccessibleLesson(service, slug);

  // Validate, then rate-limit, before forwarding to the (compute-heavy) runner.
  const validated = validateCodeSubmission(code);
  await assertCodeRunQuota(service, userId);

  const runner = getRunnerForLesson(slug);
  const language = findLessonBySlug(slug)?.frontmatter.lab_language ?? "java";
  const payload = { code: validated, language };

  // Synchronous runners (Piston) execute inline: persist the final RunResult so
  // pollCodeRun replays it instead of re-running. Async runners keep the
  // submit→poll dance with a queued row.
  if (runner.executeSync) {
    const result = await runner.executeSync({ lessonSlug: slug, userId, payload });
    const { data: row, error } = await service
      .from("code_runs")
      .insert({
        user_id: userId,
        lesson_id: lesson.id,
        runner: runner.name,
        run_id: crypto.randomUUID(),
        language,
        status: result.status,
        passed: result.passed,
        result,
      })
      .select("run_id")
      .single<{ run_id: string }>();
    if (error || !row) throw new Error(error?.message ?? "Could not record run");

    if (result.passed) await saveProgressForUser(service, userId, slug, "do");
    await recordAuditEvent(service, {
      actorId: userId,
      action: "code_run.submitted",
      target: slug,
      metadata: { runner: runner.name, runId: row.run_id, sync: true },
    });
    return { runId: row.run_id };
  }

  const { runId } = await runner.submit({ lessonSlug: slug, userId, payload });

  // Record the run for quota accounting + ownership on poll.
  const { error } = await service.from("code_runs").insert({
    user_id: userId,
    lesson_id: lesson.id,
    runner: runner.name,
    run_id: runId,
    language,
    status: "queued",
  });
  if (error) throw new Error(error.message);

  await recordAuditEvent(service, {
    actorId: userId,
    action: "code_run.submitted",
    target: slug,
    metadata: { runner: runner.name, runId },
  });

  return { runId };
}

export async function pollCodeRunResult(
  service: SupabaseClient,
  userId: string,
  slug: string,
  runId: string,
): Promise<RunResult> {
  await requireAccessibleLesson(service, slug);

  // Ownership: a run_id is only pollable by the learner who started it.
  const { data: run } = await service
    .from("code_runs")
    .select("id, result")
    .eq("run_id", runId)
    .eq("user_id", userId)
    .maybeSingle<{ id: string; result: RunResult | null }>();
  if (!run) throw new Error("Run not found.");

  // A synchronous run already stored its final RunResult — replay it.
  if (run.result) return run.result;

  const result = await getRunnerForLesson(slug).getResult(runId);

  // Persist the latest status; mark the lab done on a pass.
  await service
    .from("code_runs")
    .update({ status: result.status, passed: result.passed })
    .eq("run_id", runId)
    .eq("user_id", userId);

  if (result.passed) {
    await saveProgressForUser(service, userId, slug, "do");
  }

  return result;
}
