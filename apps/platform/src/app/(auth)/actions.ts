"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthFormState {
  error: string | null;
  message?: string;
}

function credentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

/** Resolve the post-auth redirect destination from the ?next= query param.
 *  Validates it is a same-origin relative path to prevent open-redirect. */
async function safeNext(): Promise<string> {
  const headersList = await headers();
  const referer = headersList.get("referer") ?? "";
  try {
    const url = new URL(referer);
    const next = url.searchParams.get("next");
    // Only allow same-origin relative paths starting with /
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return next;
    }
  } catch {
    // Ignore invalid URLs
  }
  return "/dashboard";
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password } = credentials(formData);
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  redirect(await safeNext());
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password } = credentials(formData);
  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: error.message };
  }

  // With email confirmation enabled (cloud envs) there is no session yet.
  if (!data.session) {
    return {
      error: null,
      message: "Check your inbox to confirm your account, then log in.",
    };
  }

  redirect(await safeNext());
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
