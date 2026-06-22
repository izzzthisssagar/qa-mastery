"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Update the signed-in learner's profile. Goes through the request-scoped
 *  (RLS-enforced) client — the "users update own profile" policy pins the row
 *  to auth.uid(). The profile row already exists (created on signup), so this
 *  is an UPDATE, never an insert. */

const ProfileSchema = z.object({
  display_name: z.string().trim().max(80).or(z.literal("")),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_-]{3,30}$/i, "Username: 3–30 chars (letters, numbers, - or _)")
    .or(z.literal("")),
  avatar_url: z.string().trim().url("Avatar must be a valid URL").max(500).or(z.literal("")),
});

export type ProfileState = { error: string | null; ok?: boolean };

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = ProfileSchema.safeParse({
    display_name: formData.get("display_name") ?? "",
    username: formData.get("username") ?? "",
    avatar_url: formData.get("avatar_url") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name || null,
      username: parsed.data.username ? parsed.data.username.toLowerCase() : null,
      avatar_url: parsed.data.avatar_url || null,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "That username is already taken." };
    return { error: "Couldn't save your changes — try again." };
  }

  revalidatePath("/settings");
  return { error: null, ok: true };
}
