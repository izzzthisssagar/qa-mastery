import "server-only";

import { gradeCapstone, type CapstoneInput, type CapstoneResult } from "@qa-mastery/grading";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAccessibleLesson } from "./access";
import { recordAuditEvent } from "./audit";
import { saveProgressForUser } from "./progress";

// The capstone rubric grading lives in @qa-mastery/grading (pure + unit-tested).
// Client components import its types straight from the grading package — a
// "use server" module may only export async functions, never types.

/** Grade a capstone deliverable with the structured auto-checks a reviewer would
 *  tick, then persist it. The capstone is a Pro lesson, so the access check
 *  gates it. Returns the checklist + a 0–100 score. */
export async function gradeAndRecordCapstone(
  service: SupabaseClient,
  userId: string,
  slug: string,
  input: CapstoneInput,
): Promise<CapstoneResult> {
  const lesson = await requireAccessibleLesson(service, slug);

  const result = gradeCapstone(input);
  const { normalized, checklist, score } = result;

  // Upsert: the capstone is one deliverable per lesson, so a resubmission
  // overwrites the prior plan rather than stacking a duplicate row.
  const { error } = await service.from("capstone_submissions").upsert(
    {
      user_id: userId,
      lesson_id: lesson.id,
      scope: normalized.scope,
      risks: normalized.risks,
      approach: normalized.approach,
      recommendation: input.recommendation,
      checklist,
      score,
    },
    { onConflict: "user_id,lesson_id" },
  );
  if (error) throw new Error(error.message);

  await recordAuditEvent(service, {
    actorId: userId,
    action: "capstone.submitted",
    target: slug,
    metadata: { score },
  });

  // A submitted capstone counts as doing the lab.
  await saveProgressForUser(service, userId, slug, "do");

  return result;
}
