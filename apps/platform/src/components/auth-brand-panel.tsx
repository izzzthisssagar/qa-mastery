"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

const PROOF = [
  { k: "01", t: "Learn visually", d: "Every concept, animated — not a wall of text." },
  { k: "02", t: "Break a real app", d: "Hunt seeded bugs in BuggyShop, our sandbox." },
  { k: "03", t: "Graded like a job", d: "Submissions scored the way a lead would." },
] as const;

/**
 * The left "value" rail of the split auth layout. Pure marketing/atmosphere —
 * carries no form state. Hidden on mobile (the form stacks full-width).
 */
export function AuthBrandPanel() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: EASE },
        };

  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-zinc-800/80 bg-zinc-950 px-10 py-12 lg:flex lg:w-[44%] xl:px-14">
      {/* Atmosphere local to the panel. */}
      <div aria-hidden className="bg-grid absolute inset-0 -z-10 opacity-70" />
      <div aria-hidden className="bg-glow absolute inset-x-0 top-0 -z-10 h-[60%]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 bottom-[-10%] -z-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_70%)] blur-2xl"
      />

      <motion.div {...rise(0)}>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-md border border-accent/40 bg-accent/10 font-mono text-xs text-accent"
          >
            QA
          </span>
          QA<span className="text-accent">Mastery</span>
        </Link>
      </motion.div>

      <div className="max-w-md">
        <motion.p
          {...rise(0.08)}
          className="font-mono text-xs uppercase tracking-[0.3em] text-accent/80"
        >
          {"// the testing platform"}
        </motion.p>
        <motion.h2
          {...rise(0.16)}
          className="font-display mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-zinc-50 xl:text-5xl"
        >
          Don&rsquo;t watch testing.
          <br />
          <span className="text-accent">Do it.</span>
        </motion.h2>

        <ul className="mt-10 space-y-5">
          {PROOF.map((item, i) => (
            <motion.li
              key={item.k}
              {...rise(0.24 + i * 0.08)}
              className="flex gap-4"
            >
              <span className="mt-0.5 font-mono text-xs text-zinc-600">
                {item.k}
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{item.t}</p>
                <p className="text-sm text-zinc-500">{item.d}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>

      <motion.p {...rise(0.5)} className="font-mono text-xs text-zinc-600">
        Trusted by self-taught testers landing their first QA role.
      </motion.p>
    </aside>
  );
}
