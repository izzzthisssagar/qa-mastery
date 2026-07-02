"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@qa-mastery/db";
import { DEFAULT_RELEASE, mintHandoffToken } from "@qa-mastery/shared";

/**
 * Provision (if needed) the learner's shared practice sandbox and return a
 * BuggyAPI handoff URL. Mirrors learn/actions.ts `launchSandbox`, minus the
 * lesson gate — BuggyAPI's reference mode is open to every signed-in learner.
 * BuggyAPI seeds its own ba_* rows on first /api/session exchange, so this
 * only guarantees the public.sandboxes row + mints the token.
 */
export async function launchBuggyApi(): Promise<string> {
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
    { userId: user.id, sandboxId, release: DEFAULT_RELEASE, mode: "clean" },
    secret,
    "buggyapi",
  );

  const baseUrl = process.env.NEXT_PUBLIC_BUGGYAPI_URL || "http://localhost:3002";
  return `${baseUrl}/enter#t=${token}`;
}
