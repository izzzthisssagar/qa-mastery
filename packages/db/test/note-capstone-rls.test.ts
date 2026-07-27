import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Track-capstone RLS + constraint regression — same bar as note-labs-rls.test.ts,
 * for `capstone_submissions` after migration 0033 added the `note_slug` path.
 * `capstone_submissions` had no dedicated RLS suite before 0033; adding one now
 * rather than leaving the new column path untested. Needs the local stack with
 * 20260722000033_note_capstone applied. Run via `pnpm --filter @qa-mastery/db test:rls`.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasEnv = Boolean(URL && ANON && SERVICE);

const PASSWORD = "rls-test-password-123";
const CHAPTER_SLUG = "ui-ux-design-qa/usability-evaluation";

async function signedInClient(email: string): Promise<SupabaseClient> {
  const client = createClient(URL!, ANON!, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}

describe.skipIf(!hasEnv)("Track-capstone RLS invariants", () => {
  let service: SupabaseClient;

  const emailAlice = `cap-alice-${randomUUID()}@e2e.local`;
  const emailBob = `cap-bob-${randomUUID()}@e2e.local`;
  let aliceId = "";
  let bobId = "";
  let asAlice: SupabaseClient;
  let asBob: SupabaseClient;

  beforeAll(async () => {
    service = createClient(URL!, SERVICE!, {
    auth: { persistSession: false, autoRefreshToken: false },
    });

    const mk = async (email: string) => {
      const r = await service.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
      });
      if (r.error) throw new Error(r.error.message);
      return r.data.user!.id;
    };
    aliceId = await mk(emailAlice);
    bobId = await mk(emailBob);
    asAlice = await signedInClient(emailAlice);
    asBob = await signedInClient(emailBob);

    const { error } = await service.from("capstone_submissions").insert({
      user_id: aliceId,
      note_slug: CHAPTER_SLUG,
      scope: "scope text long enough to pass the rubric length check",
      risks: "risk one\nrisk two\nrisk three",
      approach: "boundary value analysis on the coupon field",
      recommendation: "go",
      checklist: [],
      score: 100,
    });
    if (error) throw new Error(error.message);
  });

  afterAll(async () => {
    if (aliceId) await service.auth.admin.deleteUser(aliceId);
    if (bobId) await service.auth.admin.deleteUser(bobId);
  });

  it("a learner CANNOT self-submit a capstone (no write policy)", async () => {
    const { error } = await asBob.from("capstone_submissions").insert({
      user_id: bobId,
      note_slug: CHAPTER_SLUG,
      scope: "forged",
      risks: "r1\nr2\nr3",
      approach: "forged approach",
      recommendation: "go",
      checklist: [],
      score: 100,
    });
    expect(error).not.toBeNull();
  });

  it("a learner reads their own capstone submission", async () => {
    const { data, error } = await asAlice
      .from("capstone_submissions")
      .select("score")
      .eq("note_slug", CHAPTER_SLUG);
    expect(error).toBeNull();
    expect(data?.[0]?.score).toBe(100);
  });

  it("a learner never sees another learner's capstone submission", async () => {
    const { data } = await asBob
      .from("capstone_submissions")
      .select("score")
      .eq("user_id", aliceId);
    expect(data ?? []).toHaveLength(0);
  });

  it("the DB rejects a row claiming both a lesson AND a note capstone", async () => {
    const { data: lesson } = await service
      .from("lessons")
      .select("id")
      .limit(1)
      .maybeSingle<{ id: string }>();
    // Nothing ever syncs a lesson row post-retirement; skip rather than fail
    // if this run's DB happens to have none.
    if (!lesson) return;

    const { error } = await service.from("capstone_submissions").insert({
      user_id: aliceId,
      lesson_id: lesson.id,
      note_slug: CHAPTER_SLUG,
      scope: "conflicting owner test",
      risks: "r1\nr2\nr3",
      approach: "conflicting owner test",
      recommendation: "go",
      checklist: [],
      score: 50,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toContain("capstone_submissions_single_owner");
  });
});
