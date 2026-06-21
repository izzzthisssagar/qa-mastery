"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

type AuthFieldProps = {
  /** MUST stay stable — tests resolve inputs via getByLabel(label). */
  id: string;
  name: string;
  label: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name">;

/**
 * A labelled input with an animated focus rail and floating accent.
 * The DOM contract is preserved exactly: <label htmlFor={id}>{label}</label>
 * + <input id={id} name={name} ...>. Visual flourishes are decorative only.
 *
 * Password fields gain a show/hide reveal toggle. The toggle only swaps the
 * rendered input `type`; `id`/`name`/`label` are untouched so the test and a11y
 * contract holds.
 */
export function AuthField({ id, name, label, type, ...inputProps }: AuthFieldProps) {
  const reduce = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  const hintId = useId();

  const isPassword = type === "password";
  const effectiveType = isPassword && reveal ? "text" : type;

  return (
    <div className="group relative">
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-zinc-500 transition-colors group-focus-within:text-accent"
      >
        <span
          aria-hidden
          className="inline-block h-1 w-1 rounded-full bg-zinc-700 transition-colors group-focus-within:bg-accent"
        />
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={effectiveType}
          aria-describedby={hintId}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`peer w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-3 pl-4 font-mono text-sm text-zinc-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] outline-none transition-[border-color,box-shadow,background-color] duration-300 placeholder:text-zinc-600 focus:border-accent/70 focus:bg-zinc-900/70 focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_14%,transparent)] ${
            isPassword ? "pr-12" : "pr-4"
          }`}
          {...inputProps}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            // Accessible name deliberately avoids the word "password" so it does
            // not collide with getByLabel("Password") for the field (the input
            // must stay the sole match — see the e2e label contract). `title`
            // gives sighted users the conventional tooltip without changing the
            // accessible name (aria-label wins).
            aria-label={reveal ? "Hide entered text" : "Show entered text"}
            title={reveal ? "Hide password" : "Show password"}
            aria-pressed={reveal}
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {reveal ? (
              /* eye-off */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              /* eye */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        ) : null}

        {/* Animated underline rail — sweeps in on focus. */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 h-px -translate-x-1/2 rounded-full bg-accent"
          initial={false}
          animate={
            reduce
              ? { width: focused ? "92%" : 0 }
              : { width: focused ? "92%" : 0, opacity: focused ? 1 : 0 }
          }
          transition={{ duration: 0.4, ease: EASE }}
        />
      </div>
      <span id={hintId} className="sr-only">
        {label} field
      </span>
    </div>
  );
}
