"use server";

import { createServiceClient } from "@qa-mastery/db";
import { matchBugReport, type BugReportInput, type ManifestBug } from "@qa-mastery/grading";
import { DEFAULT_RELEASE, mintHandoffToken } from "@qa-mastery/shared";
import type { BugReportResult } from "@/components/bug-report-lab";
import { getAuthedUserId } from "@/lib/auth";
import { touchStreak } from "@/lib/streaks";
import { requireChapterRead, requireNoteLab } from "./lab-shared";

/**
 * Bug-hunt lab submission for the notes spine — the `bug_report` counterpart
 * to `lab-actions.ts`'s `code_run` handling. Same trust boundary: a
 * `chapterSlug` only reaches a manifest query when the taxonomy has that
 * chapter AND the registry declares a `bug_report` lab on it.
 *
 * Only `target: "buggyshop"` is implemented — BuggyAPI's report shape (surface
 * + endpoint, not page + feature) needs its own form, same as the standalone
 * `/buggyapi/report` flow already has one that doesn't match BuggyShop's.
 * Wiring a `target: "buggyapi"` lab throws a clear error rather than silently
 * grading against the wrong manifest.
 */

const XP_LAB_FALLBACK = 40;

function requireBuggyShopLab(chapterSlug: string) {
  const { lab, moduleSlug } = requireNoteLab(chapterSlug);
  if (lab.kind !== "bug_report") throw new Error("This lab is not a bug hunt.");
  if (lab.target !== "buggyshop") {
    throw new Error(`Bug hunt labs targeting "${lab.target}" aren't supported yet.`);
  }
  return { lab, moduleSlug };
}

export interface NoteHuntStatus {
  /** Distinct seeded-bug ids this learner has matched on this chapter. */
  found: string[];
  /** Seeded bugs available to find in the current release. */
  total: number;
  /** How many distinct matches this lab requires to pass. */
  required: number;
}

/** Bug-hunt progress for the current learner on this chapter, against
 *  DEFAULT_RELEASE — note labs have no per-chapter release override the way
 *  lesson frontmatter does. */
export async function getNoteHuntStatus(chapterSlug: string): Promise<NoteHuntStatus> {
  const { lab } = requireBuggyShopLab(chapterSlug);
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  const { count } = await service
    .schema("buggyshop")
    .from("bs_bug_manifest")
    .select("*", { count: "exact", head: true })
    .eq("release", DEFAULT_RELEASE);

  const { data } = await service
    .from("bug_reports")
    .select("matched_bug_id")
    .eq("user_id", userId)
    .eq("note_slug", chapterSlug)
    .not("matched_bug_id", "is", null);

  const found = [...new Set((data ?? []).map((r) => r.matched_bug_id as string))];
  return { found, total: count ?? 0, required: lab.minValidBugs ?? 1 };
}

/** Provision the learner's shared BuggyShop sandbox (same one every lesson-
 *  bound hunt uses — public.sandboxes is one row per learner) and return a
 *  fresh handoff URL. Mirrors learn/actions.ts `launchSandbox` minus the
 *  lesson-scoped release override. */
export async function launchNoteSandbox(chapterSlug: string): Promise<string> {
  requireBuggyShopLab(chapterSlug);
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  let sandboxId: string;
  const { data: existing } = await service
    .from("sandboxes")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    sandboxId = existing.id;
  } else {
    const { data: newSbx, error: insertError } = await service
      .from("sandboxes")
      .insert({ user_id: userId, current_release: DEFAULT_RELEASE })
      .select("id")
      .single();
    if (insertError || !newSbx) throw new Error("Could not provision sandbox");
    sandboxId = newSbx.id;

    const { error: resetError } = await service
      .schema("buggyshop")
      .rpc("reset_sandbox", { p_sandbox_id: sandboxId });
    if (resetError) throw new Error(`Sandbox seeding failed: ${resetError.message}`);
  }

  const secret = process.env.SANDBOX_JWT_SECRET;
  if (!secret) throw new Error("SANDBOX_JWT_SECRET is missing");

  const token = await mintHandoffToken(
    { userId, sandboxId, release: DEFAULT_RELEASE },
    secret,
  );

  const baseUrl = process.env.NEXT_PUBLIC_BUGGYSHOP_URL || "http://localhost:3001";
  return `${baseUrl}/enter#t=${token}`;
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

/** Grade a bug-report lab submission against the seeded-bug manifest, persist
 *  it keyed by chapter (`note_slug`, not `lesson_id` — the 0030 single-owner
 *  constraint), and award XP once the chapter's required match count is FIRST
 *  reached (not on every individual match, and not again on a repeat pass). */
export async function submitNoteBugReport(
  chapterSlug: string,
  report: BugReportInput,
): Promise<BugReportResult> {
  const { lab } = requireBuggyShopLab(chapterSlug);
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  await requireChapterRead(service, userId, chapterSlug);

  const { data: rows, error: manifestError } = await service
    .schema("buggyshop")
    .from("bs_bug_manifest")
    .select("bug_id, release, page, feature, category, severity, points, title_internal, expected")
    .eq("release", DEFAULT_RELEASE)
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

  const { data: prior } = await service
    .from("bug_reports")
    .select("matched_bug_id")
    .eq("user_id", userId)
    .eq("note_slug", chapterSlug)
    .not("matched_bug_id", "is", null);
  const alreadyMatchedIds = new Set((prior ?? []).map((p) => p.matched_bug_id as string));
  const requiredCount = lab.minValidBugs ?? 1;
  const alreadyPassed = alreadyMatchedIds.size >= requiredCount;

  const outcome = matchBugReport(report, manifest, alreadyMatchedIds);

  const { error: insertError } = await service.from("bug_reports").insert({
    user_id: userId,
    lesson_id: null,
    note_slug: chapterSlug,
    matched_bug_id: outcome.matched?.id ?? null,
    page: report.page,
    feature: report.feature,
    category: report.category,
    severity: report.severity,
    title: report.title,
    steps: report.steps,
    expected: report.expected,
    actual: report.actual,
    evidence_url: report.evidenceUrl ?? null,
    score: outcome.score,
    matched: outcome.matched !== null,
    duplicate: outcome.duplicate,
    feedback: outcome.feedback,
  });
  if (insertError) throw new Error(insertError.message);

  const nowMatchedCount =
    outcome.matched && !outcome.duplicate ? alreadyMatchedIds.size + 1 : alreadyMatchedIds.size;
  const justPassed = !alreadyPassed && nowMatchedCount >= requiredCount;

  if (justPassed) {
    await service.from("xp_events").insert({
      user_id: userId,
      amount: lab.xp || XP_LAB_FALLBACK,
      reason: "note_lab_passed",
      ref_id: chapterSlug,
    });
    await touchStreak(service, userId);
  }

  await service
    .from("audit_events")
    .insert({
      actor_id: userId,
      action: "note_bug_hunt.submitted",
      target: chapterSlug,
      metadata: { matched: outcome.matched?.id ?? null, score: outcome.score },
    })
    .then(({ error: auditError }) => {
      if (auditError) console.error("audit_events insert failed:", auditError.message);
    });

  return {
    matched: outcome.matched !== null,
    duplicate: outcome.duplicate,
    score: outcome.score,
    feedback: outcome.feedback,
    matchedBugId: outcome.matched?.id ?? null,
  };
}
