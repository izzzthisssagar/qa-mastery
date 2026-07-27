import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Community RLS regression tests — prove the database enforces the feed's access
 * invariants independent of app code: insert-own, read-unless-hidden,
 * non-author-can't-moderate, and (critically) learners can't forge a
 * notification. Needs the local Supabase stack with 20260702000027_communities
 * applied. Run with the RLS env vars via `pnpm --filter @qa-mastery/db test:rls`.
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

describe.skipIf(!hasEnv)("Community RLS invariants", () => {
  let service: SupabaseClient;

  const emailAlice = `c-alice-${randomUUID()}@e2e.local`;
  const emailBob = `c-bob-${randomUUID()}@e2e.local`;
  let aliceId = "";
  let bobId = "";
  let asAlice: SupabaseClient;
  let asBob: SupabaseClient;
  let alicePostId = "";
  let hiddenPostId = "";

  beforeAll(async () => {
    service = createClient(URL!, SERVICE!, {
    auth: { persistSession: false, autoRefreshToken: false },
    });

    const mk = async (email: string) => {
      const r = await service.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
      if (r.error) throw new Error(r.error.message);
      return r.data.user!.id;
    };
    aliceId = await mk(emailAlice);
    bobId = await mk(emailBob);
    asAlice = await signedInClient(emailAlice);
    asBob = await signedInClient(emailBob);

    // Alice has a visible post and a hidden one (service role sets hidden_at).
    const { data: p } = await service
      .from("community_posts")
      .insert({ author_id: aliceId, body: "alice visible post" })
      .select("id")
      .single();
    alicePostId = p!.id as string;

    const { data: h } = await service
      .from("community_posts")
      .insert({ author_id: aliceId, body: "alice hidden post", hidden_at: new Date().toISOString() })
      .select("id")
      .single();
    hiddenPostId = h!.id as string;
  });

  afterAll(async () => {
    await service.from("community_posts").delete().in("id", [alicePostId, hiddenPostId]);
    for (const id of [aliceId, bobId]) {
      await service.auth.admin.deleteUser(id).catch(() => {});
    }
  });

  it("a user can create their own post", async () => {
    const { data, error } = await asBob
      .from("community_posts")
      .insert({ author_id: bobId, body: "bob's own post" })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    if (data?.id) await service.from("community_posts").delete().eq("id", data.id);
  });

  it("a user CANNOT create a post as someone else", async () => {
    const { error } = await asBob
      .from("community_posts")
      .insert({ author_id: aliceId, body: "forged authorship" })
      .select("id")
      .single();
    expect(error).not.toBeNull(); // RLS with-check rejects author_id != auth.uid()
  });

  it("a non-author cannot hide (update) another's post", async () => {
    const { data } = await asBob
      .from("community_posts")
      .update({ hidden_at: new Date().toISOString() })
      .eq("id", alicePostId)
      .select("id");
    expect(data ?? []).toHaveLength(0); // RLS filters the row out — no-op update
    // confirm it's still visible
    const { data: still } = await service
      .from("community_posts")
      .select("hidden_at")
      .eq("id", alicePostId)
      .single();
    expect(still?.hidden_at).toBeNull();
  });

  it("a hidden post is invisible to a non-author", async () => {
    const { data } = await asBob.from("community_posts").select("id").eq("id", hiddenPostId);
    expect(data ?? []).toHaveLength(0);
  });

  it("an author still sees their own hidden post", async () => {
    const { data } = await asAlice.from("community_posts").select("id").eq("id", hiddenPostId);
    expect(data ?? []).toHaveLength(1);
  });

  it("a learner CANNOT insert a notification (service-role only)", async () => {
    const { error } = await asBob
      .from("notifications")
      .insert({ user_id: bobId, type: "like", subject_type: "post", subject_id: alicePostId })
      .select("id")
      .single();
    expect(error).not.toBeNull(); // no insert policy → denied
  });

  it("a user can only manage their own follow edges", async () => {
    const { error } = await asBob
      .from("community_follows")
      .insert({ follower_id: aliceId, following_id: bobId }); // pretending to be Alice
    expect(error).not.toBeNull();
  });
});
