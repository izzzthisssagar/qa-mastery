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

/** Absolute site origin for building email redirect links. Prefers the
 *  configured platform URL; falls back to the forwarded request host. */
async function siteOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_PLATFORM_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
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
  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    return { error: error.message };
  }

  // With email confirmation enabled (cloud envs) there is no session yet.
  if (!data.session) {
    return {
      error: null,
      message: "Check your inbox to confirm your email, then log in.",
    };
  }

  redirect(await safeNext());
}

/** Send a password-reset email. The link lands on /auth/callback which
 *  exchanges the code for a recovery session, then forwards to /reset-password.
 *  Always returns a neutral message so we don't leak which emails exist. */
export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required." };

  const supabase = await createSupabaseServerClient();
  const origin = await siteOrigin();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  return {
    error: null,
    message: "If an account exists for that email, a reset link is on its way.",
  };
}

/** Set a new password. Runs inside the recovery session established by the
 *  callback, so updateUser is authorized. */
export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Reset link expired. Request a new one from the login page." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
