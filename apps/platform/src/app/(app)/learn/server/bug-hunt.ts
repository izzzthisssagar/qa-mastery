import "server-only";

import { matchBugReport, type BugReportInput, type ManifestBug } from "@qa-mastery/grading";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BugManifestRow, BugReportResult, HuntStatus } from "../action-types";
import { lessonRelease, requireAccessibleLesson } from "./access";
import { recordAuditEvent } from "./audit";
import { saveProgressForUser } from "./progress";

/** Grade a bug-report lab submission against the seeded-bug manifest (read
 *  server-side from the deny-all buggyshop schema), persist it, and mark the
 *  "do" step. The answer key (title_internal, expected) never reaches the
 *  client except as post-match feedback. */
export async function recordBugReport(
  service: SupabaseClient,
  userId: string,
  slug: string,
  report: BugReportInput,
): Promise<BugReportResult> {
  const lesson = await requireAccessibleLesson(service, slug);
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
    evidence_url: report.evidenceUrl ?? null,
    score: outcome.score,
    matched: outcome.matched !== null,
    duplicate: outcome.duplicate,
    feedback: outcome.feedback,
  });
  if (insertError) throw new Error(insertError.message);

  if (outcome.matched && !outcome.duplicate) {
    await recordAuditEvent(service, {
      actorId: userId,
      action: "bug_report.matched",
      target: outcome.matched.id,
      metadata: { slug, score: outcome.score },
    });
  }

  // Filing a report counts as doing the lab.
  await saveProgressForUser(service, userId, slug, "do");

  return {
    matched: outcome.matched !== null,
    duplicate: outcome.duplicate,
    score: outcome.score,
    feedback: outcome.feedback,
    matchedBugId: outcome.matched?.id ?? null,
  };
}

/** Bug-hunt progress for the current learner: how many distinct seeded bugs
 *  they've matched on this lesson, out of the total in the release manifest. */
export async function huntStatusForUser(
  service: SupabaseClient,
  userId: string,
  slug: string,
): Promise<HuntStatus> {
  const lesson = await requireAccessibleLesson(service, slug);
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
