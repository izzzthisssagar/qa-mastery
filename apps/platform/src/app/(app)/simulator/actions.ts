"use server";

import { createServiceClient } from "@qa-mastery/db";
import {
  validateCodeSubmission,
  isSimulatorLanguage,
  type RunResult,
} from "@qa-mastery/grading";
import { WandboxRunner } from "@qa-mastery/grading/runners";
import { getAuthedUserId } from "@/lib/auth";

const wandbox = new WandboxRunner();

/** Wandbox is a shared free service — one run per 10s per learner keeps us a
 *  good neighbour and stops accidental hammering from a stuck keypress. */
const COOLDOWN_MS = 10_000;
const MAX_RUNS_PER_DAY = 100;

async function assertRunAllowed(
  service: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<void> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count } = await service
    .from("code_runs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDay.toISOString());
  if ((count ?? 0) >= MAX_RUNS_PER_DAY) {
    throw new Error(`Daily code-run limit reached (${MAX_RUNS_PER_DAY}). Try again tomorrow.`);
  }

  const { data: last } = await service
    .from("code_runs")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ created_at: string }>();
  if (last) {
    const elapsed = Date.now() - new Date(last.created_at).getTime();
    if (elapsed < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      throw new Error(`Slow down — wait ${wait}s between runs.`);
    }
  }
}

/**
 * Run a standalone simulator snippet. No lesson, no grading — just execute and
 * return output. Records a `code_runs` row with null lesson_id + the language,
 * reusing the same validation, quota and cooldown as lesson labs.
 */
export async function runSimulatorCode(
  language: string,
  code: string,
): Promise<RunResult> {
  const userId = await getAuthedUserId();
  if (!isSimulatorLanguage(language)) throw new Error("Unsupported language.");

  const validated = validateCodeSubmission(code);
  const service = createServiceClient();
  await assertRunAllowed(service, userId);

  const result = await wandbox.executeSync({
    lessonSlug: "simulator",
    userId,
    payload: { code: validated, language },
  });

  const { error } = await service.from("code_runs").insert({
    user_id: userId,
    lesson_id: null,
    runner: wandbox.name,
    run_id: crypto.randomUUID(),
    language,
    status: result.status,
    passed: result.passed,
    result,
  });
  if (error) throw new Error(error.message);

  return result;
}
