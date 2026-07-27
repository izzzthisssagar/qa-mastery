import "server-only";

import { mintHandoffToken } from "@qa-mastery/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lessonRelease, requireAccessibleLesson } from "./access";

/** Provision a BuggyShop sandbox for this user if they don't have one, and return
 *  the handoff URL populated with a short-lived JWT. */
export async function provisionSandboxAndMintUrl(
  service: SupabaseClient,
  userId: string,
  slug: string,
): Promise<string> {
  // Ensure the user has access to the lesson (throws if not)
  await requireAccessibleLesson(service, slug);
  const release = lessonRelease(slug);

  let sandboxId: string;
  const { data: existing } = await service
    .from("sandboxes")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    sandboxId = existing.id;
  } else {
    // Provision sandbox row
    const { data: newSbx, error: insertError } = await service
      .from("sandboxes")
      .insert({ user_id: userId, current_release: release })
      .select("id")
      .single();
    if (insertError || !newSbx) throw new Error("Could not provision sandbox");
    sandboxId = newSbx.id;

    // Seed data via the deny-all service-role RPC
    const { error: resetError } = await service
      .schema("buggyshop")
      .rpc("reset_sandbox", { p_sandbox_id: sandboxId });
    if (resetError) throw new Error(`Sandbox seeding failed: ${resetError.message}`);
  }

  const secret = process.env.SANDBOX_JWT_SECRET;
  if (!secret) throw new Error("SANDBOX_JWT_SECRET is missing");

  const token = await mintHandoffToken({ userId, sandboxId, release }, secret);

  const baseUrl = process.env.NEXT_PUBLIC_BUGGYSHOP_URL || "http://localhost:3001";
  return `${baseUrl}/enter#t=${token}`;
}
