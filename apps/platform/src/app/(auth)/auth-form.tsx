"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@qa-mastery/ui";
import type { AuthFormState } from "./actions";

const INITIAL_STATE: AuthFormState = { error: null };

const INPUT_CLASSES =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none";

export interface AuthFormProps {
  title: string;
  submitLabel: string;
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  altText: string;
  altHref: string;
  altLinkLabel: string;
}

export function AuthForm({
  title,
  submitLabel,
  action,
  altText,
  altHref,
  altLinkLabel,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-lg font-bold tracking-tight">
          QA<span className="text-accent">Mastery</span>
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">{title}</h1>

        <form action={formAction} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-zinc-400">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={INPUT_CLASSES}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-zinc-400">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className={INPUT_CLASSES}
              placeholder="••••••••"
            />
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-red-400">
              {state.error}
            </p>
          ) : null}
          {state.message ? (
            <p role="status" className="text-sm text-emerald-300">
              {state.message}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Please wait…" : submitLabel}
          </Button>
        </form>

        <p className="mt-6 text-sm text-zinc-400">
          {altText}{" "}
          <Link href={altHref} className="text-emerald-300 hover:underline">
            {altLinkLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
