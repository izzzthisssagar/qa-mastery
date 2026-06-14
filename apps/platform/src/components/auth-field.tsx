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
 */
export function AuthField({ id, name, label, ...inputProps }: AuthFieldProps) {
  const reduce = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const hintId = useId();

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
          aria-describedby={hintId}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="peer w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 font-mono text-sm text-zinc-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] outline-none transition-[border-color,box-shadow,background-color] duration-300 placeholder:text-zinc-600 focus:border-accent/70 focus:bg-zinc-900/70 focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_14%,transparent)]"
          {...inputProps}
        />
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
