"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Submit in-app feedback. Learner-authored: the row is inserted through the
 *  request-scoped (RLS-enforced) client with user_id pinned to the caller, so
 *  the "users insert own feedback" policy is the security boundary. Triage
 *  fields (theme/status) are left at their defaults for the founder to set via
 *  the service role. */

const FeedbackSchema = z.object({
  type: z.enum(["bug", "feature", "ux", "content", "pricing", "praise"]),
  message: z.string().trim().min(1, "Tell us a little more").max(4000),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  context: z.string().trim().max(200).optional(),
});

export type FeedbackInput = z.input<typeof FeedbackSchema>;
export type FeedbackResult = { ok: true } | { ok: false; error: string };

export async function submitFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  const parsed = FeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid feedback" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to send feedback" };

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    type: parsed.data.type,
    message: parsed.data.message,
    rating: parsed.data.rating ?? null,
    context: parsed.data.context ?? null,
  });

  if (error) return { ok: false, error: "Couldn't save your feedback — try again" };
  return { ok: true };
}
