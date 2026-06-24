import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Talent RLS regression tests — prove the database enforces the marketplace
 * access invariants independent of app code. The 5 invariants gate the talent
 * MVP launch (see Product/QA-Marketplace-Security-Spec.md §6). Needs the local
 * Supabase stack with 20260621000017_talent.sql applied. Run with:
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

describe.skipIf(!hasEnv)("Talent RLS invariants", () => {
  const service = createClient(URL!, SERVICE!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const emailClient = `t-client-${randomUUID()}@e2e.local`;
  const emailTester = `t-tester-${randomUUID()}@e2e.local`;
  const emailOutsider = `t-out-${randomUUID()}@e2e.local`;
  let clientId = "";
  let testerId = "";
  let outsiderId = "";
  let convoId = "";
  let asClient: SupabaseClient;
  let asTester: SupabaseClient;
  let asOutsider: SupabaseClient;

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
    clientId = await mk(emailClient);
    testerId = await mk(emailTester);
    outsiderId = await mk(emailOutsider);

    asClient = await signedInClient(emailClient);
    asTester = await signedInClient(emailTester);
    asOutsider = await signedInClient(emailOutsider);

    // tester publishes a public profile + an NDA portfolio item (service role)
    await service.from("talent_profiles").insert({
      id: testerId,
      handle: `h${randomUUID().slice(0, 8)}`,
      is_public: true,
    });
    await service.from("talent_portfolio_items").insert({
      tester_id: testerId,
      type: "automation",
      title: "secret nda work",
      is_nda: true,
    });

    // a conversation strictly between client & tester, with one private message
    const { data, error } = await service
      .from("talent_conversations")
      .insert({ client_id: clientId, tester_id: testerId, created_by: clientId })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "conversation insert failed");
    convoId = data.id as string;
    await service.from("talent_messages").insert({
      conversation_id: convoId,
      sender_id: clientId,
      body: "private hello",
    });
  });

  afterAll(async () => {
    for (const id of [clientId, testerId, outsiderId]) {
      if (id) await service.auth.admin.deleteUser(id);
    }
  });

  it("1. a non-participant cannot read a conversation's messages", async () => {
    const { data } = await asOutsider
      .from("talent_messages")
      .select("*")
      .eq("conversation_id", convoId);
    expect(data ?? []).toHaveLength(0); // RLS hides it (no error, just empty)
  });

  it("2. a user cannot insert a message into a conversation they're not in (even forging sender_id)", async () => {
    const own = await asOutsider
      .from("talent_messages")
      .insert({ conversation_id: convoId, sender_id: outsiderId, body: "intrusion" });
    expect(own.error).not.toBeNull(); // with-check fails

    const spoof = await asOutsider
      .from("talent_messages")
      .insert({ conversation_id: convoId, sender_id: clientId, body: "spoof" });
    expect(spoof.error).not.toBeNull(); // forging someone else's sender_id also fails
  });

  it("3. a non-owner cannot read another tester's NDA portfolio item", async () => {
    const { data } = await asOutsider
      .from("talent_portfolio_items")
      .select("*")
      .eq("is_nda", true);
    expect(data ?? []).toHaveLength(0);
  });

  it("4. anon/authenticated get zero rows from audit_events and talent_reports", async () => {
    const audit = await asClient.from("audit_events").select("*").limit(1);
    expect(audit.data ?? []).toHaveLength(0);

    await service.from("talent_reports").insert({
      reporter_id: clientId,
      target_type: "profile",
      target_id: testerId,
      reason: "rls test",
    });
    const reports = await asOutsider.from("talent_reports").select("*").limit(1);
    expect(reports.data ?? []).toHaveLength(0); // insert-own only; no read policy
  });

  it("5. a non-owner cannot mutate another tester's profile", async () => {
    await asOutsider
      .from("talent_profiles")
      .update({ headline: "hijacked" })
      .eq("id", testerId);
    const { data } = await service
      .from("talent_profiles")
      .select("headline")
      .eq("id", testerId)
      .single();
    expect(data!.headline).not.toBe("hijacked"); // RLS using(auth.uid()=id) → 0 rows affected
  });
});
