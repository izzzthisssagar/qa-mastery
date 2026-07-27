import type { Metadata } from "next";
import { Suspense } from "react";
import { signup } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm
        title="Create your account"
        submitLabel="Start learning free"
        action={signup}
        altText="Already have an account?"
        altBaseHref="/login"
        altLinkLabel="Log in"
      />
    </Suspense>
  );
}
