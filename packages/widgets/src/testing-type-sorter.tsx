"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Scenario {
  id: string;
  text: string;
  type: "func" | "nonfunc";
}

const ALL_SCENARIOS: Scenario[] = [
  { id: "s1", text: "Verify user can log in with valid credentials", type: "func" },
  { id: "s2", text: "Verify the page loads in under 2 seconds", type: "nonfunc" },
  { id: "s3", text: "Verify checkout calculates 20% VAT correctly", type: "func" },
  { id: "s4", text: "Verify the app scales to 10,000 concurrent users", type: "nonfunc" },
  { id: "s5", text: "Verify layout is responsive on an iPhone 13", type: "nonfunc" },
  { id: "s6", text: "Verify the 'Add to Cart' button increments the counter", type: "func" },
];

export function TestingTypeSorter({ onMilestone }: { onMilestone?: (m: string) => void }) {
  const [unassigned, setUnassigned] = useState<Scenario[]>([...ALL_SCENARIOS].sort(() => Math.random() - 0.5));
  const [func, setFunc] = useState<Scenario[]>([]);
  const [nonfunc, setNonfunc] = useState<Scenario[]>([]);

  const handleSort = (scenario: Scenario, target: "func" | "nonfunc") => {
    if (scenario.type !== target) {
      // Wrong choice animation could go here, but for simplicity we just reject it.
      return;
    }

    setUnassigned(prev => prev.filter(s => s.id !== scenario.id));
    if (target === "func") setFunc(prev => [...prev, scenario]);
    if (target === "nonfunc") setNonfunc(prev => [...prev, scenario]);

    if (unassigned.length === 1) {
      // It was the last one
      onMilestone?.("sorted-all-types");
    }
  };

  const reset = () => {
    setFunc([]);
    setNonfunc([]);
    setUnassigned([...ALL_SCENARIOS].sort(() => Math.random() - 0.5));
  };

  return (
    <div className="my-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Sort the Tests</h3>
          <p className="text-sm text-zinc-400">Sort the scenarios below. Does it test WHAT the system does, or HOW it does it?</p>
        </div>
        <button onClick={reset} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200">Reset</button>
      </div>

      <div className="mb-8 min-h-[100px] flex flex-wrap gap-3 justify-center">
        <AnimatePresence>
          {unassigned.map(s => (
            <motion.div
              key={s.id}
              layoutId={s.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 shadow-md w-full md:w-auto"
            >
              <p className="text-sm font-medium text-zinc-200 mb-3">{s.text}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => handleSort(s, "func")}
                  className="rounded px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  Functional
                </button>
                <button
                  onClick={() => handleSort(s, "nonfunc")}
                  className="rounded px-3 py-1 text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                >
                  Non-Functional
                </button>
              </div>
            </motion.div>
          ))}
          {unassigned.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center text-accent font-bold text-lg flex items-center gap-2"
            >
              <span>🎉</span> All sorted correctly!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Functional Column */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 min-h-[150px]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4 border-b border-zinc-800 pb-2">
            Functional (What)
          </h4>
          <div className="space-y-2">
            {func.map(s => (
              <motion.div key={s.id} layoutId={s.id} className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2 text-xs text-zinc-300">
                {s.text}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Non-Functional Column */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 min-h-[150px]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-4 border-b border-zinc-800 pb-2">
            Non-Functional (How)
          </h4>
          <div className="space-y-2">
            {nonfunc.map(s => (
              <motion.div key={s.id} layoutId={s.id} className="rounded border border-purple-500/20 bg-purple-500/5 p-2 text-xs text-zinc-300">
                {s.text}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
