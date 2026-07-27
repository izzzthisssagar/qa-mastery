import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Streaks RLS regression — proves learners have NO write path to `streaks`
 * (service-role only, like xp_events / note_progress) and read only their own
 * row. Needs the local stack with 20260722000032_streaks applied. Run via
 * `pnpm --filter @qa-mastery/db test:rls`.
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

describe.skipIf(!hasEnv)("Streaks RLS invariants", () => {
  let service: SupabaseClient;

  const emailAlice = `streak-alice-${randomUUID()}@e2e.local`;
  const emailBob = `streak-bob-${randomUUID()}@e2e.local`;
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

  it("a learner CANNOT insert their own streak row (no write policy)", async () => {
    const { error } = await asAlice
      .from("streaks")
      .insert({ user_id: aliceId, current_streak: 999, longest_streak: 999 });
    expect(error).not.toBeNull();
  });

  it("a learner CANNOT update their own streak row (no write policy)", async () => {
    // No UPDATE policy exists, so RLS's USING clause silently filters out
    // every row rather than raising a permission error (Postgres RLS
    // semantics for UPDATE/DELETE, unlike the WITH CHECK-driven INSERT
    // rejection above) — assert on the row surviving unchanged, not on
    // `error`.
    await service
      .from("streaks")
      .upsert({ user_id: aliceId, current_streak: 1, longest_streak: 1 });
    await asAlice.from("streaks").update({ current_streak: 999 }).eq("user_id", aliceId);
    const { data } = await service.from("streaks").select("current_streak").eq("user_id", aliceId);
    expect(data?.[0]?.current_streak).toBe(1);
  });

  it("a learner reads their own service-role-written streak", async () => {
    const { data } = await asAlice.from("streaks").select("current_streak").eq("user_id", aliceId);
    expect(data?.[0]?.current_streak).toBe(1);
  });

  it("a learner never sees another learner's streak", async () => {
    await service.from("streaks").upsert({ user_id: bobId, current_streak: 5, longest_streak: 5 });
    const { data: aliceView } = await asAlice
      .from("streaks")
      .select("current_streak")
      .eq("user_id", bobId);
    expect(aliceView ?? []).toHaveLength(0);
  });
});
