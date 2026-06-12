import type { Metadata } from "next";
import { signup } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <AuthForm
      title="Create your account"
      submitLabel="Start learning free"
      action={signup}
      altText="Already have an account?"
      altHref="/login"
      altLinkLabel="Log in"
    />
  );
}
