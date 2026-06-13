import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * RLS regression tests — prove the database enforces the access invariants,
 * independent of any app code. Needs the local Supabase stack and the lesson
 * registry synced. Run with:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… \
 *   SUPABASE_SERVICE_ROLE_KEY=… pnpm --filter @qa-mastery/db test:rls
 *
 * Kept out of the default `pnpm test` (it requires a running DB).
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasEnv = Boolean(URL && ANON && SERVICE);

const PASSWORD = "rls-test-password-123";

async function signedInClient(email: string): Promise<SupabaseClient> {
  const client = createClient(URL!, ANON!, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}

describe.skipIf(!hasEnv)("RLS regression", () => {
  const service = createClient(URL!, SERVICE!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const emailA = `rls-a-${randomUUID()}@e2e.local`;
  const emailB = `rls-b-${randomUUID()}@e2e.local`;
  let userA = "";
  let userB = "";
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let lessonId = "";

  beforeAll(async () => {
    const a = await service.auth.admin.createUser({
      email: emailA,
      password: PASSWORD,
      email_confirm: true,
    });
    const b = await service.auth.admin.createUser({
      email: emailB,
      password: PASSWORD,
      email_confirm: true,
    });
    if (a.error || b.error) throw new Error(a.error?.message ?? b.error?.message);
    userA = a.data.user!.id;
    userB = b.data.user!.id;

    clientA = await signedInClient(emailA);
    clientB = await signedInClient(emailB);

    const { data: lesson, error } = await service
      .from("lessons")
      .select("id")
      .eq("status", "published")
      .limit(1)
      .single();
    if (error || !lesson) {
      throw new Error("no published lesson — run the curriculum sync --apply first");
    }
    lessonId = lesson.id as string;

    // Seed a progress row for A via the service role.
    const { error: seedError } = await service.from("progress").upsert({
      user_id: userA,
      lesson_id: lessonId,
      status: "started",
      step_state: {},
    });
    if (seedError) throw new Error(seedError.message);
  });

  afterAll(async () => {
    if (userA) await service.auth.admin.deleteUser(userA);
    if (userB) await service.auth.admin.deleteUser(userB);
  });

  it("a learner reads their own progress", async () => {
    const { data, error } = await clientA
      .from("progress")
      .select("lesson_id")
      .eq("user_id", userA);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });

  it("a learner cannot read another learner's progress", async () => {
    const { data, error } = await clientB
      .from("progress")
      .select("lesson_id")
      .eq("user_id", userA);
    expect(error).toBeNull();
    expect(data?.length).toBe(0); // RLS filters the row out
  });

  it("a learner can update their own progress", async () => {
    const { error } = await clientA
      .from("progress")
      .update({ status: "completed" })
      .eq("user_id", userA)
      .eq("lesson_id", lessonId);
    expect(error).toBeNull();
  });

  it("a learner cannot write their own quiz score (invariant 2)", async () => {
    const { error } = await clientA.from("quiz_attempts").insert({
      user_id: userA,
      lesson_id: lessonId,
      attempt_no: 1,
      score: 6,
      max_score: 6,
      passed: true,
      answers: {},
    });
    expect(error).not.toBeNull(); // no insert policy → RLS denies
  });

  it("a learner cannot write their own XP (invariant 2)", async () => {
    const { error } = await clientA.from("xp_events").insert({
      user_id: userA,
      amount: 9999,
      reason: "cheating",
    });
    expect(error).not.toBeNull();
  });

  it("a learner cannot write their own bug-report score (invariant 2)", async () => {
    const { error } = await clientA.from("bug_reports").insert({
      user_id: userA,
      lesson_id: lessonId,
      page: "product-list",
      feature: "price-filter",
      category: "boundary",
      severity: "major",
      title: "forged",
      score: 999,
      matched: true,
      duplicate: false,
    });
    expect(error).not.toBeNull();
  });

  it("the buggyshop schema is sealed from learners (invariant 1 & 4)", async () => {
    const { data, error } = await clientA
      .schema("buggyshop")
      .from("bs_bug_manifest")
      .select("bug_id");
    // deny-all: either a hard permission error or zero readable rows
    expect(error !== null || (data?.length ?? 0) === 0).toBe(true);
  });

  it("the service role can read the bug manifest (grading path)", async () => {
    const { data, error } = await service
      .schema("buggyshop")
      .from("bs_bug_manifest")
      .select("bug_id")
      .eq("bug_id", "BS-008");
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });
});
