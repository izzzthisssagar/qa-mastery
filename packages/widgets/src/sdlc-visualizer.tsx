"use client";

import { useState } from "react";
import { motion } from "motion/react";

const PHASES = [
  { id: "req", name: "Requirements", cost: "$100", desc: "Cheapest to fix. Erase a sentence." },
  { id: "des", name: "Design", cost: "$500", desc: "Redraw a wireframe or update an API spec." },
  { id: "dev", name: "Development", cost: "$1,500", desc: "Rewrite code, update unit tests." },
  { id: "test", name: "Testing", cost: "$5,000", desc: "Bug reported, ticket triaged, code rewritten, retested." },
  { id: "prod", name: "Production", cost: "$10,000+", desc: "Hotfixes, downtime, lost customers, brand damage." },
];

export function SDLCVisualizer({ onMilestone }: { onMilestone?: (m: string) => void }) {
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  const handleClick = (idx: number) => {
    setSelectedPhase(idx);
    if (idx === PHASES.length - 1) onMilestone?.("viewed-production-cost");
  };

  return (
    <div className="my-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-zinc-100">The Cost of a Bug</h3>
        <p className="text-sm text-zinc-400">Click a phase to see the cost of fixing a defect discovered there.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-8 relative">
        {PHASES.map((phase, idx) => {
          const isActive = selectedPhase === idx;
          const isPast = selectedPhase !== null && idx < selectedPhase;

          return (
            <div key={phase.id} className="flex-1 flex md:flex-col items-center group relative cursor-pointer" onClick={() => handleClick(idx)}>
              {/* Connector line (desktop) */}
              {idx !== 0 && (
                <div className="hidden md:block absolute top-6 right-1/2 w-full h-[2px] bg-zinc-800 -z-10" />
              )}
              {/* Connector line (mobile) */}
              {idx !== 0 && (
                <div className="md:hidden absolute left-6 bottom-1/2 w-[2px] h-full bg-zinc-800 -z-10" />
              )}

              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isActive ? "rgba(244, 63, 94, 0.2)" : "rgba(24, 24, 27, 1)",
                  borderColor: isActive ? "rgba(244, 63, 94, 1)" : isPast ? "rgba(244, 63, 94, 0.3)" : "rgba(39, 39, 42, 1)"
                }}
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm shadow-xl transition-colors duration-300 z-10 text-zinc-300"
              >
                {idx + 1}
              </motion.div>
              
              <div className="ml-4 md:ml-0 md:mt-4 text-center">
                <div className={`font-semibold text-sm transition-colors duration-300 ${isActive ? "text-rose-400" : "text-zinc-400"}`}>
                  {phase.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="min-h-[120px] rounded-xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-center items-center text-center">
        {selectedPhase === null ? (
          <p className="text-zinc-500 italic">Select a phase above...</p>
        ) : (
          <motion.div
            key={selectedPhase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="text-3xl font-black text-rose-500 mb-2">
              {PHASES[selectedPhase].cost}
            </div>
            <p className="text-zinc-300">
              {PHASES[selectedPhase].desc}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
