import type { Metadata } from "next";
import { login } from "../actions";
import { AuthForm } from "../auth-form";
import { sanitizeNext } from "../next-param";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = sanitizeNext((await searchParams).next);
  return (
    <AuthForm
      title="Welcome back"
      submitLabel="Log in"
      action={login}
      altText="New here?"
      altHref={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
      altLinkLabel="Create an account"
      showForgot
      next={next}
    />
  );
}
