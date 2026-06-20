"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { Button } from "@qa-mastery/ui";
import { Reveal, motion } from "@/components/motion";
import { AuthBrandPanel } from "@/components/auth-brand-panel";
import { AuthField } from "@/components/auth-field";
import { requestPasswordReset, updatePassword, type AuthFormState } from "./actions";

const INITIAL: AuthFormState = { error: null };

/** Shared chrome mirroring AuthForm so the reset flows feel native. */
function Shell({
  eyebrow,
  title,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="relative flex min-h-full flex-1 lg:items-stretch">
      <div aria-hidden className="grain absolute inset-0 -z-20" />
      <div aria-hidden className="bg-grid absolute inset-0 -z-20 opacity-40 lg:hidden" />
      <div aria-hidden className="bg-glow absolute inset-x-0 top-0 -z-20 h-72 lg:hidden" />
      <AuthBrandPanel />
      <section className="flex flex-1 items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-sm">
          <Reveal className="lg:hidden">
            <Link href="/" className="text-lg font-bold tracking-tight">
              QA<span className="text-accent">Mastery</span>
            </Link>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent/80">{eyebrow}</p>
          </Reveal>
          <Reveal delay={0.12}>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              {title}
            </h1>
          </Reveal>
          {children}
          <Reveal delay={0.42}>
            <p className="mt-8 border-t border-zinc-800/70 pt-6 text-sm text-zinc-500">{footer}</p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

function Alerts({ state }: { state: AuthFormState }) {
  return (
    <>
      {state.error ? (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </motion.p>
      ) : null}
      {state.message ? (
        <motion.p
          role="status"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-emerald-200"
        >
          {state.message}
        </motion.p>
      ) : null}
    </>
  );
}

function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <Button type="submit" disabled={pending} className="w-full py-3">
      {pending ? "Please wait…" : label}
    </Button>
  );
}

const backToLogin = (
  <>
    Remembered it?{" "}
    <Link
      href="/login"
      className="font-medium text-accent underline-offset-4 transition-colors hover:text-emerald-300 hover:underline"
    >
      Back to log in
    </Link>
  </>
);

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, INITIAL);
  return (
    <Shell eyebrow="Reset password" title="Forgot your password?" footer={backToLogin}>
      <form action={action} className="mt-9 space-y-5">
        <Reveal delay={0.2}>
          <AuthField
            id="email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </Reveal>
        <Alerts state={state} />
        <Reveal delay={0.34}>
          <Submit pending={pending} label="Send reset link" />
        </Reveal>
      </form>
    </Shell>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePassword, INITIAL);
  return (
    <Shell eyebrow="Reset password" title="Set a new password" footer={backToLogin}>
      <form action={action} className="mt-9 space-y-5">
        <Reveal delay={0.2}>
          <AuthField
            id="password"
            name="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
          />
        </Reveal>
        <Reveal delay={0.27}>
          <AuthField
            id="confirm"
            name="confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
          />
        </Reveal>
        <Alerts state={state} />
        <Reveal delay={0.34}>
          <Submit pending={pending} label="Update password" />
        </Reveal>
      </form>
    </Shell>
  );
}
