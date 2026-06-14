"use client";

import type { ComponentProps } from "react";
import { motion, useReducedMotion } from "@/components/motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Lesson section heading. Each `## ` in the MDX becomes one of these: a short
 * accent rule grows in beside the title as it scrolls into view, giving the
 * See it · Try it · Do it · Prove it rhythm a gentle visual beat. Reveal once,
 * and skip the motion entirely under prefers-reduced-motion.
 */
export function ProseH2(props: ComponentProps<"h2">) {
  const reduce = useReducedMotion();
  return (
    <motion.h2
      className="group relative mt-12 flex items-center gap-3 text-xl font-semibold tracking-tight text-zinc-100"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <motion.span
        aria-hidden
        className="h-px shrink-0 bg-accent/70"
        initial={reduce ? false : { width: 0 }}
        whileInView={{ width: 24 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
      />
      <span {...props} />
    </motion.h2>
  );
}
