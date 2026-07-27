import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Note-progress RLS regression — proves the DB enforces that note completion
 * (which awards XP) is authoritative: learners have NO write path to
 * note_progress (service-role only, like xp_events / user_task_grades), read
 * only their own rows, and never see another learner's. Needs the local stack
 * with 20260721000029_note_progress applied. Run via
 * `pnpm --filter @qa-mastery/db test:rls`.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasEnv = Boolean(URL && ANON && SERVICE);

const PASSWORD = "rls-test-password-123";
const NOTE_SLUG = "qa-foundations/what-is-qa/qa-vs-qc-vs-testing";

async function signedInClient(email: string): Promise<SupabaseClient> {
  const client = createClient(URL!, ANON!, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}

describe.skipIf(!hasEnv)("Note-progress RLS invariants", () => {
  let service: SupabaseClient;

  const emailAlice = `np-alice-${randomUUID()}@e2e.local`;
  const emailBob = `np-bob-${randomUUID()}@e2e.local`;
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
  });

  it("a learner CANNOT insert their own note completion (no write policy)", async () => {
    const { error } = await asAlice
      .from("note_progress")
      .insert({ user_id: aliceId, note_slug: NOTE_SLUG, status: "completed" });
    expect(error).not.toBeNull();
  });

  it("a learner reads their own service-role-written completion", async () => {
    await service
      .from("note_progress")
      .upsert(
        { user_id: aliceId, note_slug: NOTE_SLUG, status: "completed" },
        { onConflict: "user_id,note_slug" },
      );
    const { data } = await asAlice
      .from("note_progress")
      .select("note_slug")
      .eq("note_slug", NOTE_SLUG);
    expect(data?.[0]?.note_slug).toBe(NOTE_SLUG);
  });

  it("a learner never sees another learner's completion", async () => {
    const { data: bobView } = await asBob
      .from("note_progress")
      .select("note_slug")
      .eq("user_id", aliceId);
    expect(bobView ?? []).toHaveLength(0);
  });

  it("a learner CANNOT forge XP by inserting an xp_events row", async () => {
    const { error } = await asBob.from("xp_events").insert({
      user_id: bobId,
      amount: 9999,
      reason: "note_completed",
      ref_id: NOTE_SLUG,
    });
    expect(error).not.toBeNull();
  });
});
