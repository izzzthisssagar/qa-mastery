import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Step } from "../action-types";
import { requireAccessibleLesson } from "./access";

/** Record progress for an already-authenticated caller. `step` marks one of the
 *  see/try/do/prove milestones; no step just ensures a 'started' row exists.
 *  Completion is owned by the quiz scoring path. */
export async function saveProgressForUser(
  service: SupabaseClient,
  userId: string,
  slug: string,
  step?: Step,
): Promise<{ ok: true }> {
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
