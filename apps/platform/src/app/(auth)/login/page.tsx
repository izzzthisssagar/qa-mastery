import type { Metadata } from "next";
import { login } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthForm
      title="Welcome back"
      submitLabel="Log in"
      action={login}
      altText="New here?"
      altHref="/signup"
      altLinkLabel="Create an account"
    />
  );
}
