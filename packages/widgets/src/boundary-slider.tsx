"use client";

import { useMemo, useState } from "react";
import type { WidgetProps } from "./widget-props";

/**
 * Boundary Hunter — the BVA "See it" widget (lesson A3.3).
 *
 * A Quantity field whose spec says "allowed: 1–99". The learner drags across
 * 0–100 and watches each value get accepted/rejected live. The trap: the field
 * wrongly ACCEPTS 0 (an off-by-one — the same class as BuggyShop's BS-007),
 * which only shows up when you walk the boundary. Discovering it fires the
 * `found-boundary-bug` milestone so the lesson can mark the "see" step done.
 */

const MIN_LABEL = 1;
const MAX_LABEL = 99;

// The field's REAL (buggy) acceptance rule: 0..99 instead of 1..99.
function isAccepted(value: number): boolean {
  return value >= 0 && value <= 99;
}

export default function BoundarySlider({ onMilestone }: WidgetProps) {
  const [value, setValue] = useState(50);
  const [explored, setExplored] = useState<Set<number>>(() => new Set([50]));
  const [foundBug, setFoundBug] = useState(false);

  const accepted = isAccepted(value);

  function handleChange(next: number) {
    setValue(next);
    setExplored((prev) => new Set(prev).add(next));
    if (next === 0 && isAccepted(0) && !foundBug) {
      setFoundBug(true);
      onMilestone?.("found-boundary-bug");
    }
  }

  const boundariesSeen = useMemo(
    () => [0, 1, 99, 100].filter((b) => explored.has(b)).length,
    [explored],
  );

  return (
    <div
      data-testid="widget-boundary-slider"
      className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-5"
    >
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-zinc-100">
          Quantity <span className="font-normal text-zinc-500">(allowed: 1–99)</span>
        </span>
        <span
          data-testid="boundary-verdict"
          className={
            accepted
              ? "text-sm font-semibold text-emerald-400"
              : "text-sm font-semibold text-red-400"
          }
        >
          {value} → {accepted ? "✓ accepted" : "✗ rejected"}
        </span>
      </div>

      {/* number line: green where accepted, red where rejected */}
      <div className="relative mt-4 h-6 w-full overflow-hidden rounded bg-zinc-800">
        <div className="absolute inset-y-0 left-0 bg-emerald-500/30" style={{ width: "99%" }} />
        <div className="absolute inset-y-0 right-0 bg-red-500/30" style={{ width: "1%" }} />
        <div
          className="absolute top-0 h-6 w-0.5 bg-zinc-100"
          style={{ left: `calc(${value}% - 1px)` }}
          aria-hidden
        />
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={value}
        aria-label="Quantity boundary explorer"
        data-testid="boundary-input"
        onChange={(e) => handleChange(Number(e.target.value))}
        className="mt-3 w-full accent-emerald-400"
      />
      <div className="mt-1 flex justify-between text-xs text-zinc-500">
        <span>0</span>
        <span>{MIN_LABEL} (min)</span>
        <span>{MAX_LABEL} (max)</span>
        <span>100</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[0, 1, 99, 100].map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => handleChange(b)}
            data-testid={`boundary-jump-${b}`}
            className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-50"
          >
            Jump to {b}
          </button>
        ))}
      </div>

      {foundBug ? (
        <p
          data-testid="boundary-bug-found"
          className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
        >
          🐞 Wait — the spec said <strong>1–99</strong>, but <strong>0 was accepted</strong>. You
          just found a real boundary bug by walking the edge — exactly the class of defect
          (off-by-one: <code>{">= 0"}</code> where the dev meant <code>{">= 1"}</code>) that ships
          to production constantly.
        </p>
      ) : (
        <p className="mt-4 text-xs text-zinc-500" data-testid="boundary-hint">
          Boundaries explored: {boundariesSeen}/4. Try the edges — 0, 1, 99, 100 — not the middle.
        </p>
      )}
    </div>
  );
}
