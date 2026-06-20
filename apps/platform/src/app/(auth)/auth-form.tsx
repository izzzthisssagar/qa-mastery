"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@qa-mastery/ui";
import { Reveal, motion } from "@/components/motion";
import { AuthBrandPanel } from "@/components/auth-brand-panel";
import { AuthField } from "@/components/auth-field";
import type { AuthFormState } from "./actions";

const INITIAL_STATE: AuthFormState = { error: null };

export interface AuthFormProps {
  title: string;
  submitLabel: string;
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  altText: string;
  altHref: string;
  altLinkLabel: string;
  /** Show a "Forgot password?" link under the password field (login only). */
  showForgot?: boolean;
}

export function AuthForm({
  title,
  submitLabel,
  action,
  altText,
  altHref,
  altLinkLabel,
  showForgot = false,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <main className="relative flex min-h-full flex-1 lg:items-stretch">
      {/* Page-wide atmosphere behind everything. */}
      <div aria-hidden className="grain absolute inset-0 -z-20" />
      <div aria-hidden className="bg-grid absolute inset-0 -z-20 opacity-40 lg:hidden" />
      <div aria-hidden className="bg-glow absolute inset-x-0 top-0 -z-20 h-72 lg:hidden" />

      <AuthBrandPanel />

      {/* Form side. */}
      <section className="flex flex-1 items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-sm">
          {/* Compact brand mark — visible when the panel is hidden (mobile). */}
          <Reveal className="lg:hidden">
            <Link href="/" className="text-lg font-bold tracking-tight">
              QA<span className="text-accent">Mastery</span>
            </Link>
          </Reveal>

          <Reveal delay={0.05}>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent/80">
              {altHref === "/login" ? "Create account" : "Welcome back"}
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              {title}
            </h1>
          </Reveal>

          <form action={formAction} className="mt-9 space-y-5">
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

            <Reveal delay={0.27}>
              <AuthField
                id="password"
                name="password"
                label="Password"
                type="password"
                autoComplete={altHref === "/login" ? "new-password" : "current-password"}
                required
                minLength={8}
                placeholder="••••••••"
              />
            </Reveal>

            {showForgot ? (
              <Reveal delay={0.3}>
                <div className="-mt-2 text-right">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </Reveal>
            ) : null}

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

            <Reveal delay={0.34}>
              <motion.div
                whileHover={pending ? undefined : { scale: 1.01 }}
                whileTap={pending ? undefined : { scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <Button
                  type="submit"
                  disabled={pending}
                  className="group relative w-full overflow-hidden py-3 shadow-[0_8px_30px_-12px_color-mix(in_oklab,var(--accent)_60%,transparent)]"
                >
                  {/* Sheen sweep on hover. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  <span className="relative">
                    {pending ? "Please wait…" : submitLabel}
                  </span>
                </Button>
              </motion.div>
            </Reveal>
          </form>

          <Reveal delay={0.42}>
            <p className="mt-8 border-t border-zinc-800/70 pt-6 text-sm text-zinc-500">
              {altText}{" "}
              <Link
                href={altHref}
                className="font-medium text-accent underline-offset-4 transition-colors hover:text-emerald-300 hover:underline"
              >
                {altLinkLabel}
              </Link>
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
