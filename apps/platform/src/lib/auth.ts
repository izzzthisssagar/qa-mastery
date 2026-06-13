import "server-only";
import { createSupabaseServerClient } from "./supabase/server";

/** Resolve the authenticated user id, or throw. Server-side only. */
export async function getAuthedUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}
