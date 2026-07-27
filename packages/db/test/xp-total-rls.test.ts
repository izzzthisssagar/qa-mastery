import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * my_xp_total() RLS regression — proves the server-side aggregate (0036)
 * only ever sums the calling learner's own xp_events rows, a zero-event
 * learner gets 0 rather than null/an error, and an anonymous caller has no
 * execute grant at all. Needs the local stack with 20260726000036 applied.
 * Run via `pnpm --filter @qa-mastery/db test:rls`.
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

describe.skipIf(!hasEnv)("my_xp_total RLS invariants", () => {
  let service: SupabaseClient;

  const emailAlice = `xp-alice-${randomUUID()}@e2e.local`;
  const emailBob = `xp-bob-${randomUUID()}@e2e.local`;
  const emailCarol = `xp-carol-${randomUUID()}@e2e.local`;
  let aliceId = "";
  let bobId = "";
  let asAlice: SupabaseClient;
  let asBob: SupabaseClient;
  let asCarol: SupabaseClient;

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
    await mk(emailCarol); // seeded but given no xp_events rows

    const { error: seedError } = await service.from("xp_events").insert([
      { user_id: aliceId, amount: 50, reason: "lesson_completed", ref_id: "l1" },
      { user_id: aliceId, amount: 30, reason: "note_completed", ref_id: "n1" },
      { user_id: bobId, amount: 10, reason: "note_completed", ref_id: "n1" },
    ]);
    if (seedError) throw new Error(`seeding xp_events failed: ${seedError.message}`);

    asAlice = await signedInClient(emailAlice);
    asBob = await signedInClient(emailBob);
    asCarol = await signedInClient(emailCarol);
  });

  it("Alice's authenticated RPC returns only Alice's XP total", async () => {
    const { data, error } = await asAlice.rpc("my_xp_total");
    expect(error).toBeNull();
    expect(Number(data)).toBe(80);
  });

  it("Bob's authenticated RPC returns only Bob's XP total, not Alice's", async () => {
    const { data, error } = await asBob.rpc("my_xp_total");
    expect(error).toBeNull();
    expect(Number(data)).toBe(10);
  });

  it("a learner with zero xp_events rows gets 0, not null or an error", async () => {
    const { data, error } = await asCarol.rpc("my_xp_total");
    expect(error).toBeNull();
    expect(Number(data)).toBe(0);
  });

  it("anonymous execution is denied", async () => {
    const anon = createClient(URL!, ANON!, { auth: { persistSession: false } });
    const { error } = await anon.rpc("my_xp_total");
    expect(error).not.toBeNull();
  });
});
