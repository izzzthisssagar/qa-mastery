"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// A calm, premium ease — fast out, gentle settle.
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Entrance reveal: fades + rises its children on mount. Safe to drop inside a
 * server component (children are passed through). Use `delay` to stagger a
 * sequence (e.g. 0, 0.08, 0.16…). Honors prefers-reduced-motion.
 *
 * `fade={false}` animates transform only, so the content is visible from the
 * first server-rendered paint. Use it on above-the-fold LCP candidates (hero
 * heading/subtitle): an opacity-0 initial state hides them until JS loads,
 * hydration runs AND the animation plays — measured at ~2s of LCP on the live
 * site, and a blank hero for slow-JS visitors.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  fade = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  fade?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : fade ? { opacity: 0, y } : { y }}
      animate={fade ? { opacity: 1, y: 0 } : { y: 0 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Reveal on scroll-into-view (once). Good for sections further down a page.
 */
export function RevealOnView({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Re-export for client components that want bespoke motion (whileHover, layout…).
export { motion, useReducedMotion };
