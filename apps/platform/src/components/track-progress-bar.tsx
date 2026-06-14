"use client";

import { motion, useReducedMotion } from "@/components/motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * A track's progress meter. The bar animates its width from 0 → pct on mount
 * (reduced-motion users get it set instantly). Purely presentational — `pct` is
 * computed on the server.
 */
export function TrackProgressBar({ pct }: { pct: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/80">
      <motion.div
        aria-hidden
        className="h-full rounded-full bg-gradient-to-r from-accent-soft to-accent"
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        style={reduce ? { width: `${pct}%` } : undefined}
      />
    </div>
  );
}
