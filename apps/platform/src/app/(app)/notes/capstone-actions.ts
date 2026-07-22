"use server";

import { createServiceClient } from "@qa-mastery/db";
import { gradeCapstone, type CapstoneInput, type CapstoneResult } from "@qa-mastery/grading";
import { getAuthedUserId } from "@/lib/auth";
import { touchStreak } from "@/lib/streaks";
import { requireTrackCapstone, topicsRemaining } from "./lab-shared";

/**
 * Track-capstone submission — same rubric grading as the legacy lesson
 * capstone (`learn/actions.ts` submitCapstone), keyed by `note_slug` instead
 * of `lesson_id` (migration 0033). Separate file from lab-actions.ts on
 * purpose: the capstone isn't a NoteLab (code_run/bug_report), it's its own
 * free-form deliverable, same split the legacy app already made between
 * lesson labs and the lesson capstone.
 */

const XP_CAPSTONE = 100;

export interface NoteCapstoneState {
  chapterSlug: string;
  title: string;
  brief: string;
  topicsRemaining: number;
  /** The learner's last submission, if any — lets a revisit show its result. */
  lastResult: CapstoneResult | null;
}

export async function getNoteCapstoneState(chapterSlug: string): Promise<NoteCapstoneState> {
  const { capstone, moduleSlug, topicSlugs } = requireTrackCapstone(chapterSlug);
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  const [remaining, { data: row }] = await Promise.all([
    topicsRemaining(service, userId, moduleSlug, capstone.chapterSlug.split("/")[1]!, topicSlugs),
    service
      .from("capstone_submissions")
      .select("scope, risks, approach, recommendation, checklist, score")
      .eq("user_id", userId)
      .eq("note_slug", chapterSlug)
      .maybeSingle(),
  ]);

  return {
    chapterSlug,
    title: capstone.title,
    brief: capstone.brief,
    topicsRemaining: remaining,
    lastResult: row
      ? {
          normalized: { scope: row.scope, risks: row.risks, approach: row.approach },
          checklist: row.checklist,
          score: row.score,
        }
      : null,
  };
}

export async function submitNoteCapstone(
  chapterSlug: string,
  input: CapstoneInput,
): Promise<CapstoneResult> {
  const { moduleSlug, topicSlugs, capstone } = requireTrackCapstone(chapterSlug);
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  const remaining = await topicsRemaining(
    service,
    userId,
    moduleSlug,
    capstone.chapterSlug.split("/")[1]!,
    topicSlugs,
  );
  if (remaining > 0) {
    throw new Error(`Finish the ${remaining} remaining note(s) in this chapter first.`);
  }

  const { data: existing } = await service
    .from("capstone_submissions")
    .select("score")
    .eq("user_id", userId)
    .eq("note_slug", chapterSlug)
    .maybeSingle();
  const alreadyPassed = (existing?.score ?? 0) === 100;

  const result = gradeCapstone(input);
  const { normalized, checklist, score } = result;

  const { error } = await service.from("capstone_submissions").upsert(
    {
      user_id: userId,
      lesson_id: null,
      note_slug: chapterSlug,
      scope: normalized.scope,
      risks: normalized.risks,
      approach: normalized.approach,
      recommendation: input.recommendation,
      checklist,
      score,
    },
    { onConflict: "user_id,note_slug" },
  );
  if (error) throw new Error(error.message);

  // XP once, on the first fully-passing submission — a resubmission that
  // revises down to 100% after an earlier partial attempt still only pays out
  // the one time, same "first pass only" rule every other lab follows.
  if (score === 100 && !alreadyPassed) {
    await service.from("xp_events").insert({
      user_id: userId,
      amount: XP_CAPSTONE,
      reason: "note_capstone_passed",
      ref_id: chapterSlug,
    });
    await touchStreak(service, userId);
  }

  await service
    .from("audit_events")
    .insert({
      actor_id: userId,
      action: "note_capstone.submitted",
      target: chapterSlug,
      metadata: { score },
    })
    .then(({ error: auditError }) => {
      if (auditError) console.error("audit_events insert failed:", auditError.message);
    });

  return result;
}
