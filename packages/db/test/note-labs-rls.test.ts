import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Note-lab RLS + constraint regression — proves the DB, not the app, enforces
 * that a lab pass is authoritative. Labs award XP, so `code_runs` must stay
 * service-role write only (invariant 2), and the 0030 `single_owner` CHECK must
 * make it impossible for one row to claim both a lesson lab and a note lab —
 * that would credit the same work to two places. Needs the local stack with
 * 20260721000030_note_labs applied. Run via
 * `pnpm --filter @qa-mastery/db test:rls`.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasEnv = Boolean(URL && ANON && SERVICE);

const PASSWORD = "rls-test-password-123";
const CHAPTER_SLUG = "logic-and-control-flow/loops";

async function signedInClient(email: string): Promise<SupabaseClient> {
  const client = createClient(URL!, ANON!, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}

describe.skipIf(!hasEnv)("Note-lab RLS invariants", () => {
  const service = createClient(URL!, SERVICE!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const emailAlice = `nl-alice-${randomUUID()}@e2e.local`;
  const emailBob = `nl-bob-${randomUUID()}@e2e.local`;
  let aliceId = "";
  let bobId = "";
  let asAlice: SupabaseClient;
  let asBob: SupabaseClient;

  beforeAll(async () => {
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
  });

  it("a learner CANNOT self-report a lab pass (no write policy)", async () => {
    const { error } = await asAlice.from("code_runs").insert({
      user_id: aliceId,
      note_slug: CHAPTER_SLUG,
      runner: "wandbox",
      run_id: randomUUID(),
      language: "python",
      status: "passed",
      passed: true,
    });
    expect(error).not.toBeNull();
  });

  it("a learner reads their own service-role-written lab run", async () => {
    const runId = randomUUID();
    const { error: writeError } = await service.from("code_runs").insert({
      user_id: aliceId,
      note_slug: CHAPTER_SLUG,
      runner: "wandbox",
      run_id: runId,
      language: "python",
      status: "passed",
      passed: true,
    });
    expect(writeError).toBeNull();

    const { data } = await asAlice.from("code_runs").select("run_id, passed").eq("run_id", runId);
    expect(data?.[0]?.passed).toBe(true);
  });

  it("a learner never sees another learner's lab runs", async () => {
    const { data: bobView } = await asBob
      .from("code_runs")
      .select("run_id")
      .eq("user_id", aliceId);
    expect(bobView ?? []).toHaveLength(0);
  });

  it("a learner CANNOT forge lab XP by inserting an xp_events row", async () => {
    const { error } = await asBob.from("xp_events").insert({
      user_id: bobId,
      amount: 9999,
      reason: "note_lab_passed",
      ref_id: CHAPTER_SLUG,
    });
    expect(error).not.toBeNull();
  });

  describe("0030 single_owner constraint", () => {
    // A row claiming both a lesson lab and a note lab would let one submission
    // count toward two progress surfaces. The DB has to refuse it — the app
    // never sets both, but the app is not the guarantee.
    it("rejects a code_run that claims a lesson AND a note", async () => {
      const { data: lesson } = await service
        .from("lessons")
        .select("id")
        .limit(1)
        .maybeSingle<{ id: string }>();
      // The registry is seeded by `curriculum sync --apply`; skip rather than
      // fail if this run didn't seed it.
      if (!lesson) return;

      const { error } = await service.from("code_runs").insert({
        user_id: aliceId,
        lesson_id: lesson.id,
        note_slug: CHAPTER_SLUG,
        runner: "wandbox",
        run_id: randomUUID(),
        language: "python",
        status: "passed",
        passed: true,
      });
      expect(error).not.toBeNull();
      expect(error?.message).toContain("code_runs_single_owner");
    });

    it("still allows a run with neither owner (the standalone simulator)", async () => {
      const { error } = await service.from("code_runs").insert({
        user_id: aliceId,
        run_id: randomUUID(),
        runner: "wandbox",
        language: "python",
        status: "passed",
        passed: true,
      });
      expect(error).toBeNull();
    });

    it("rejects an uppercase note_slug so lab keys stay canonical", async () => {
      const { error } = await service.from("code_runs").insert({
        user_id: aliceId,
        note_slug: "Logic-And-Control-Flow/Loops",
        runner: "wandbox",
        run_id: randomUUID(),
        language: "python",
        status: "failed",
        passed: false,
      });
      expect(error).not.toBeNull();
    });
  });
});
