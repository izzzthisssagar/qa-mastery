"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "@/components/motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * A single lesson row inside a module list. Reveals with a small stagger and
 * gets a tasteful hover (background lift + accent rail + arrow nudge). All the
 * data-testids and the "✓ done" marker semantics are preserved exactly.
 */
export function LessonRow({
  slug,
  label,
  title,
  done,
  locked,
  index,
}: {
  slug: string;
  label: string;
  title: string;
  done: boolean;
  /** Gated (Pro) lesson the current learner hasn't unlocked. */
  locked?: boolean;
  index: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.3), ease: EASE }}
    >
      <Link
        href={`/learn/${slug}`}
        data-testid={`lesson-link-${slug}`}
        className="group relative flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-zinc-900/70"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-accent transition-transform duration-300 group-hover:scale-y-100"
        />
        <span className="min-w-0">
          <span className="font-mono text-xs text-zinc-500">{label}</span>{" "}
          <span className="text-zinc-100 transition-colors group-hover:text-white">{title}</span>
        </span>
        {done ? (
          <span
            data-testid={`lesson-done-${slug}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400"
          >
            <span aria-hidden>✓</span> done
          </span>
        ) : locked ? (
          <span
            data-testid={`lesson-locked-${slug}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300"
          >
            <span aria-hidden>🔒</span> Pro
          </span>
        ) : (
          <span className="shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        )}
      </Link>
    </motion.li>
  );
}
