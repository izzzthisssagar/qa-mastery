"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "@/components/motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Count up to `value` over ~1s with an ease-out curve. Reduced-motion users get
 * the final number immediately. The server already computed `value`; this is a
 * presentation-only animation fed that number.
 */
function useCountUp(value: number, enabled: boolean): number {
  const [progress, setProgress] = useState(enabled ? 0 : 1);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const duration = 1000;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setProgress(eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [enabled]);

  return Math.round(progress * value);
}

/**
 * An animated stat tile: rises + fades in on mount, with the headline number
 * counting up. `testId` and the rendered number/suffix preserve the exact
 * data-testid + text the e2e contract asserts on.
 */
export function StatCard({
  testId,
  value,
  label,
  suffix,
  accent = false,
  delay = 0,
}: {
  testId: string;
  value: number;
  label: string;
  suffix?: ReactNode;
  accent?: boolean;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const count = useCountUp(value, !reduce);

  return (
    <motion.div
      data-testid={testId}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      whileHover={reduce ? undefined : { y: -3 }}
      className="group relative flex-1 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 transition-colors hover:border-zinc-700"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-accent/10 blur-2xl transition-opacity duration-500 group-hover:opacity-100 sm:opacity-60"
      />
      <div
        className={`font-display text-3xl font-semibold tabular-nums ${
          accent ? "text-accent" : "text-zinc-100"
        }`}
      >
        {count}
        {suffix}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{label}</div>
    </motion.div>
  );
}
