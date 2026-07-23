import type { Metadata } from "next";
import { signup } from "../actions";
import { AuthForm } from "../auth-form";
import { sanitizeNext } from "../next-param";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = sanitizeNext((await searchParams).next);
  return (
    <AuthForm
      title="Create your account"
      submitLabel="Start learning free"
      action={signup}
      altText="Already have an account?"
      altHref={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
      altLinkLabel="Log in"
      next={next}
    />
  );
}
