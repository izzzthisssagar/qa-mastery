"use client";

import { useState } from "react";
import type { WidgetProps } from "./widget-props";

/**
 * Triage grid — the "See it" widget for Priority vs Severity (A4.3).
 *
 * The learner reads a bug and places it on a severity x priority grid. The
 * widget reveals the expected cell and the reasoning. The teaching point is
 * divergence: severity (impact) and priority (order to fix) often disagree.
 * Classifying the divergent case fires the `triaged-divergent` milestone so the
 * lesson can mark "see".
 */

type Level = "low" | "med" | "high";
const LEVELS: Level[] = ["low", "med", "high"];
const LABEL: Record<Level, string> = { low: "Low", med: "Medium", high: "High" };

interface BugCase {
  desc: string;
  severity: Level;
  priority: Level;
  why: string;
  divergent: boolean;
}

const BUGS: BugCase[] = [
  {
    desc: "The homepage logo is misspelled 'BugyShop'. A big investor demo is tomorrow.",
    severity: "low",
    priority: "high",
    why: "Cosmetic, so low severity — but it's the first thing the investor sees, so fix it first. Severity and priority diverge.",
    divergent: true,
  },
  {
    desc: "Checkout crashes for every user; nobody can place an order.",
    severity: "high",
    priority: "high",
    why: "Blocks the core flow for everyone — maximum impact and must be fixed immediately.",
    divergent: false,
  },
  {
    desc: "A rarely-used admin export has a column slightly misaligned.",
    severity: "low",
    priority: "low",
    why: "Tiny impact, rarely seen — neither urgent nor severe.",
    divergent: false,
  },
  {
    desc: "Payments occasionally double-charge a customer, but it's hard to reproduce.",
    severity: "high",
    priority: "high",
    why: "Money leaving customers is severe and urgent even if intermittent.",
    divergent: false,
  },
];

export default function TriageGrid({ onMilestone }: WidgetProps) {
  const [index, setIndex] = useState(0);
  const [pick, setPick] = useState<{ severity: Level; priority: Level } | null>(null);
  const [firedDivergent, setFiredDivergent] = useState(false);

  const bug = BUGS[index];
  const correct =
    pick !== null && pick.severity === bug.severity && pick.priority === bug.priority;

  function choose(severity: Level, priority: Level) {
    if (pick) return;
    setPick({ severity, priority });
    if (bug.divergent && !firedDivergent) {
      setFiredDivergent(true);
      onMilestone?.("triaged-divergent");
    }
  }

  function next() {
    setIndex((i) => (i + 1) % BUGS.length);
    setPick(null);
  }

  return (
    <div
      data-testid="widget-triage-grid"
      className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-5"
    >
      <p className="text-sm font-semibold text-zinc-100">Triage this bug</p>
      <p data-testid="triage-bug" className="mt-1 text-sm text-zinc-300">
        {bug.desc}
      </p>
      <p className="mt-3 text-xs text-zinc-500">
        Pick the cell: severity (impact) down, priority (order to fix) across.
      </p>

      <div className="mt-3 grid grid-cols-[auto_repeat(3,1fr)] gap-1 text-xs">
        <div />
        {LEVELS.map((p) => (
          <div key={p} className="px-2 py-1 text-center font-medium text-zinc-500">
            Pri: {LABEL[p]}
          </div>
        ))}
        {[...LEVELS].reverse().map((sev) => (
          <div key={sev} className="contents">
            <div className="px-2 py-1 font-medium text-zinc-500">Sev: {LABEL[sev]}</div>
            {LEVELS.map((pri) => {
              const isPick = pick?.severity === sev && pick?.priority === pri;
              const isExpected = pick && bug.severity === sev && bug.priority === pri;
              const cls = isExpected
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
                : isPick
                  ? "border-red-500/60 bg-red-500/15 text-red-200"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-500";
              return (
                <button
                  key={pri}
                  type="button"
                  data-testid={`cell-${sev}-${pri}`}
                  disabled={pick !== null}
                  onClick={() => choose(sev, pri)}
                  className={`rounded border px-2 py-3 ${cls}`}
                >
                  {isExpected ? "expected" : isPick ? "yours" : ""}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {pick && (
        <div
          data-testid="triage-feedback"
          className={
            correct
              ? "mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
              : "mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
          }
        >
          <p className="font-semibold">
            {correct ? "Spot on." : "Not quite."} Severity {LABEL[bug.severity]}, Priority{" "}
            {LABEL[bug.priority]}.
          </p>
          <p className="mt-1 text-xs text-zinc-300">{bug.why}</p>
          <button
            type="button"
            data-testid="triage-next"
            onClick={next}
            className="mt-2 rounded-md border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200 hover:border-zinc-400"
          >
            Next bug →
          </button>
        </div>
      )}
    </div>
  );
}
