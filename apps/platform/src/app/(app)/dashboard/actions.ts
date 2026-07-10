"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@qa-mastery/db";
import { DEFAULT_RELEASE, mintHandoffToken } from "@qa-mastery/shared";
import {
  matchApiBugReport,
  type ApiBugReportInput,
  type ApiManifestBug,
} from "@qa-mastery/grading";

/**
 * Provision (if needed) the learner's shared practice sandbox and return a
 * BuggyAPI handoff URL. Mirrors learn/actions.ts `launchSandbox`, minus the
 * lesson gate — BuggyAPI's reference mode is open to every signed-in learner.
 * BuggyAPI seeds its own ba_* rows on first /api/session exchange, so this
 * only guarantees the public.sandboxes row + mints the token.
 */
export type LaunchBuggyApiResult = { ok: true; url: string } | { ok: false; error: string };

export async function launchBuggyApi(
  mode: "clean" | "bughunt" = "clean",
): Promise<LaunchBuggyApiResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const service = createServiceClient();

  let sandboxId: string;
  const { data: existing } = await service
    .from("sandboxes")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    sandboxId = existing.id;
  } else {
    const { data: newSbx, error: insertError } = await service
      .from("sandboxes")
      .insert({ user_id: user.id, current_release: DEFAULT_RELEASE })
      .select("id")
      .single();
    if (insertError || !newSbx) throw new Error("Could not provision sandbox");
    sandboxId = newSbx.id;
  }

  const secret = process.env.SANDBOX_JWT_SECRET;
  if (!secret) throw new Error("SANDBOX_JWT_SECRET is missing");

  const token = await mintHandoffToken(
    { userId: user.id, sandboxId, release: DEFAULT_RELEASE, mode },
    secret,
    "buggyapi",
  );

  // The localhost fallback is for local dev/e2e only. On Vercel it would hand
  // the learner a dead link, so surface "not live yet" instead — returned, not
  // thrown, because server-action error messages are masked in production.
  // (deploy.yml skips BuggyAPI until VERCEL_BUGGYAPI_PROJECT_ID is provisioned.)
  const baseUrl =
    process.env.NEXT_PUBLIC_BUGGYAPI_URL || (process.env.VERCEL ? null : "http://localhost:3002");
  if (!baseUrl) {
    return { ok: false, error: "BuggyAPI isn't live yet — it's being provisioned. Check back soon!" };
  }
  return { ok: true, url: `${baseUrl}/enter#t=${token}` };
}

export interface ApiBugReportResult {
  matched: boolean;
  duplicate: boolean;
  score: number;
  feedback: string[];
  matchedBugId: string | null;
}

/** Manifest row shape as stored in buggyapi.ba_bug_manifest. Only the
 *  grading-relevant, non-leaky columns are selected — trigger_internal,
 *  repro_steps and teaches never leave the server (invariant 1). */
interface ApiManifestRow {
  bug_id: string;
  endpoint: string;
  surface: string;
  category: string;
  severity: ApiManifestBug["severity"];
  points: number;
  title_internal: string;
  expected: string | null;
}

/**
 * Grade a BuggyAPI bug-hunt report against the seeded-bug manifest
 * (buggyapi.ba_bug_manifest, deny-all schema, read server-side only) and
 * persist it to public.bug_reports with target='buggyapi'. Not lesson-tied —
 * dedup is per user + target. Service-role write only; the learner never
 * writes score/matched (invariant 2). The answer key stays server-side except
 * as post-match feedback (invariant 1).
 */
export async function submitApiBugReport(
  report: ApiBugReportInput,
): Promise<ApiBugReportResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const service = createServiceClient();

  const { data: rows, error: manifestError } = await service
    .schema("buggyapi")
    .from("ba_bug_manifest")
    .select("bug_id, endpoint, surface, category, severity, points, title_internal, expected")
    .returns<ApiManifestRow[]>();
  if (manifestError) throw new Error(manifestError.message);

  const manifest: ApiManifestBug[] = (rows ?? []).map((r) => ({
    id: r.bug_id,
    surface: r.surface,
    endpoint: r.endpoint,
    category: r.category,
    severity: r.severity,
    points: r.points,
    titleInternal: r.title_internal,
    expected: r.expected ?? "",
  }));

  // Bugs this learner already matched on BuggyAPI — duplicates score 0.
  const { data: prior } = await service
    .from("bug_reports")
    .select("matched_bug_id")
    .eq("user_id", user.id)
    .eq("target", "buggyapi")
    .not("matched_bug_id", "is", null);
  const alreadyMatched = new Set((prior ?? []).map((p) => p.matched_bug_id as string));

  const outcome = matchApiBugReport(report, manifest, alreadyMatched);

  // bug_reports is shared with BuggyShop: endpoint→page, surface→feature keeps
  // one graded-artifact table. lesson_id is null (no API lessons yet).
  const { error: insertError } = await service.from("bug_reports").insert({
    user_id: user.id,
    lesson_id: null,
    target: "buggyapi",
    matched_bug_id: outcome.matched?.id ?? null,
    page: report.endpoint,
    feature: report.surface,
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

  return {
    matched: outcome.matched !== null,
    duplicate: outcome.duplicate,
    score: outcome.score,
    feedback: outcome.feedback,
    matchedBugId: outcome.matched?.id ?? null,
  };
}
