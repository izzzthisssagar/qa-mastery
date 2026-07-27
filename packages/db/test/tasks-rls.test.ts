import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Tasks RLS regression — proves the DB enforces the planner/grades split
 * independent of app code: learners CRUD their own user_tasks, can't see
 * others', and (critically) have NO write path to user_task_grades — scores are
 * service-role only, exactly like bug_reports / xp_events. Needs the local stack
 * with 20260702000028_tasks applied. Run via `pnpm --filter @qa-mastery/db test:rls`.
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

describe.skipIf(!hasEnv)("Tasks RLS invariants", () => {
  let service: SupabaseClient;

  const emailAlice = `t-alice-${randomUUID()}@e2e.local`;
  const emailBob = `t-bob-${randomUUID()}@e2e.local`;
  let aliceId = "";
  let bobId = "";
  let asAlice: SupabaseClient;
  let asBob: SupabaseClient;
  let aliceTaskRowId = "";

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

    const { data, error } = await asAlice
      .from("user_tasks")
      .insert({ user_id: aliceId, title: "alice todo" })
      .select("id")
      .single();
    if (error) throw new Error(`alice insert failed: ${error.message}`);
    aliceTaskRowId = data!.id;
  });

  it("a learner reads live task templates", async () => {
    const { data, error } = await asAlice.from("tasks").select("id").limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("a learner sees only their own user_tasks", async () => {
    const { data: mine } = await asAlice.from("user_tasks").select("id");
    expect(mine?.some((r) => r.id === aliceTaskRowId)).toBe(true);

    const { data: bobView } = await asBob.from("user_tasks").select("id").eq("id", aliceTaskRowId);
    expect(bobView ?? []).toHaveLength(0);
  });

  it("a learner cannot update another learner's user_task", async () => {
    const { data } = await asBob
      .from("user_tasks")
      .update({ status: "done" })
      .eq("id", aliceTaskRowId)
      .select("id");
    // RLS filters the row out — no rows updated (not an error, just empty).
    expect(data ?? []).toHaveLength(0);
  });

  it("a learner CANNOT insert a grade (no write policy)", async () => {
    const { error } = await asAlice.from("user_task_grades").insert({
      user_task_id: aliceTaskRowId,
      user_id: aliceId,
      score: 100,
      passed: true,
    });
    expect(error).not.toBeNull();
  });

  it("a learner reads their own service-role-written grade", async () => {
    await service.from("user_task_grades").insert({
      user_task_id: aliceTaskRowId,
      user_id: aliceId,
      score: 80,
      passed: true,
    });
    const { data } = await asAlice
      .from("user_task_grades")
      .select("score")
      .eq("user_task_id", aliceTaskRowId);
    expect(data?.[0]?.score).toBe(80);

    // Bob can't read Alice's grade.
    const { data: bobView } = await asBob
      .from("user_task_grades")
      .select("score")
      .eq("user_task_id", aliceTaskRowId);
    expect(bobView ?? []).toHaveLength(0);
  });
});
