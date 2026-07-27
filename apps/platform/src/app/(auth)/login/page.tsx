import type { Metadata } from "next";
import { Suspense } from "react";
import { login } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm
        title="Welcome back"
        submitLabel="Log in"
        action={login}
        altText="New here?"
        altBaseHref="/signup"
        altLinkLabel="Create an account"
        showForgot
      />
    </Suspense>
  );
}
