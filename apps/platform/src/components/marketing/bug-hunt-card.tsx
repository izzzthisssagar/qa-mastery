"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "@/components/motion";

type Hotspot = {
  id: string;
  label: string;
  detail: string;
  // position as % within the mock viewport
  x: number;
  y: number;
};

const HOTSPOTS: Hotspot[] = [
  {
    id: "price",
    label: "Price renders before discount",
    detail: "BUG-014 · state · cart total ignores the coupon on first paint",
    x: 22,
    y: 58,
  },
  {
    id: "qty",
    label: "Quantity accepts negatives",
    detail: "BUG-007 · validation · −1 × $39 credits the customer",
    x: 71,
    y: 36,
  },
  {
    id: "a11y",
    label: "Checkout button has no label",
    detail: "BUG-022 · a11y · screen readers announce “button, button”",
    x: 54,
    y: 80,
  },
];

/**
 * A faux BuggyShop screen with discoverable seeded bugs. Hovering or focusing a
 * hotspot pulls up a finding card — a tiny taste of the live Bug Hunt.
 */
export function BugHuntCard() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Hotspot | null>(null);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-2xl shadow-black/40">
      {/* faux browser chrome */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <span className="size-2.5 rounded-full bg-zinc-700" />
        <span className="size-2.5 rounded-full bg-zinc-700" />
        <span className="size-2.5 rounded-full bg-zinc-700" />
        <span className="ml-3 truncate font-mono text-xs text-zinc-500">
          buggyshop.local / cart
        </span>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-accent">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
          live
        </span>
      </div>

      {/* faux product viewport */}
      <div className="relative aspect-[4/3] bg-zinc-950/60">
        <div className="bg-grid absolute inset-0 opacity-40" />

        {/* skeleton UI lines so it reads as a real screen */}
        <div className="absolute inset-0 flex flex-col gap-3 p-6">
          <div className="h-5 w-2/5 rounded bg-zinc-800/80" />
          <div className="mt-1 h-3 w-4/5 rounded bg-zinc-800/50" />
          <div className="h-3 w-3/5 rounded bg-zinc-800/50" />
          <div className="mt-auto flex items-end justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-zinc-800/50" />
              <div className="h-6 w-28 rounded bg-zinc-800/80" />
            </div>
            <div className="h-9 w-32 rounded-lg bg-zinc-800/80" />
          </div>
        </div>

        {/* hotspots */}
        {HOTSPOTS.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-label={`Inspect: ${h.label}`}
            onMouseEnter={() => setActive(h)}
            onMouseLeave={() => setActive((cur) => (cur?.id === h.id ? null : cur))}
            onFocus={() => setActive(h)}
            onBlur={() => setActive((cur) => (cur?.id === h.id ? null : cur))}
            className="group absolute -translate-x-1/2 -translate-y-1/2 outline-none"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
          >
            <span className="relative flex size-6 items-center justify-center">
              {!reduce && (
                <motion.span
                  className="absolute inset-0 rounded-full border border-accent/60"
                  animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              )}
              <span className="size-3 rounded-full bg-accent ring-4 ring-accent/20 transition group-hover:ring-accent/40 group-focus-visible:ring-accent/60" />
            </span>
          </button>
        ))}

        {/* finding readout */}
        <motion.div
          initial={false}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-x-3 bottom-3"
        >
          <div className="rounded-lg border border-accent/30 bg-zinc-950/90 px-3.5 py-2.5 backdrop-blur">
            <p className="text-sm font-medium text-zinc-100">
              {active?.label ?? "Hover a marker to log a finding"}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-accent/80">
              {active?.detail ?? "3 seeded defects on this screen"}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
