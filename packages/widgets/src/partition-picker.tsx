"use client";

import { useState } from "react";
import type { WidgetProps } from "./widget-props";

/**
 * Partition picker — the "See it" widget for Equivalence Partitioning (A3.2).
 *
 * An age field accepts 18-60. The learner builds a test set from candidate
 * values and watches which equivalence classes they cover. Covering all three
 * classes (invalid-low, valid, invalid-high) with a minimal set fires the
 * `covered-all-partitions` milestone so the lesson can mark "see".
 */

type Partition = "invalid-low" | "valid" | "invalid-high";
const PARTITIONS: Partition[] = ["invalid-low", "valid", "invalid-high"];
const PART_LABEL: Record<Partition, string> = {
  "invalid-low": "Invalid (too low)",
  valid: "Valid (18-60)",
  "invalid-high": "Invalid (too high)",
};

const CANDIDATES = [10, 17, 18, 35, 60, 61, 80];

function partitionOf(value: number): Partition {
  if (value < 18) return "invalid-low";
  if (value > 60) return "invalid-high";
  return "valid";
}

const PART_CLASS: Record<Partition, string> = {
  "invalid-low": "border-red-500/60 bg-red-500/15 text-red-200",
  valid: "border-emerald-500/60 bg-emerald-500/15 text-emerald-200",
  "invalid-high": "border-red-500/60 bg-red-500/15 text-red-200",
};

export default function PartitionPicker({ onMilestone }: WidgetProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [fired, setFired] = useState(false);

  function toggle(value: number) {
    setSelected((prev) => {
      const next = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
      const covered = new Set(next.map(partitionOf));
      if (covered.size === 3 && !fired) {
        setFired(true);
        onMilestone?.("covered-all-partitions");
      }
      return next;
    });
  }

  const coveredSet = new Set(selected.map(partitionOf));
  const allCovered = coveredSet.size === 3;
  const minimal = allCovered && selected.length === 3;

  return (
    <div
      data-testid="widget-partition-picker"
      className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-5"
    >
      <p className="text-sm font-semibold text-zinc-100">
        Age field <span className="font-normal text-zinc-500">(accepted: 18-60)</span>
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Build a test set. Click values to add them and watch which classes you cover — aim to cover
        all three with as few tests as possible.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CANDIDATES.map((value) => {
          const part = partitionOf(value);
          const on = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              data-testid={`candidate-${value}`}
              aria-pressed={on}
              onClick={() => toggle(value)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                on ? PART_CLASS[part] : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {PARTITIONS.map((p) => {
          const covered = coveredSet.has(p);
          return (
            <span
              key={p}
              data-testid={`coverage-${p}`}
              className={
                covered
                  ? "rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-200"
                  : "rounded border border-zinc-700 px-2 py-1 text-zinc-500"
              }
            >
              {covered ? "✓" : "○"} {PART_LABEL[p]}
            </span>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Tests selected: <span data-testid="selected-count">{selected.length}</span> · classes
        covered: {coveredSet.size}/3
      </p>

      {allCovered && (
        <p data-testid="partition-covered" className="mt-3 text-sm text-emerald-300">
          {minimal
            ? "Minimal and complete — three values, one per class. That's the whole idea: you don't need 50 ages, you need one representative of each behaviour."
            : "All three classes covered — but you can do it with just three values (one per class). Extra same-class values add cost, not coverage."}
        </p>
      )}
    </div>
  );
}
