"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CHARTERS = [
  "Explore the Cart with Invalid Promo Codes to discover UI error states.",
  "Explore the Checkout Flow with Network Throttling to discover race conditions.",
  "Explore the Product Filter with rapid boundary clicking to discover state staleness.",
  "Explore the User Profile with extremely long strings to discover layout breaks.",
];

export function ExploratoryTimer({ onMilestone }: { onMilestone?: (m: string) => void }) {
  const [charter, setCharter] = useState(CHARTERS[0]);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 mins
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onMilestone?.("completed-session");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onMilestone]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const newCharter = () => {
    const currentIdx = CHARTERS.indexOf(charter);
    let nextIdx = currentIdx;
    while (nextIdx === currentIdx) {
      nextIdx = Math.floor(Math.random() * CHARTERS.length);
    }
    setCharter(CHARTERS[nextIdx]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="my-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8 backdrop-blur-xl flex flex-col md:flex-row gap-8 items-center">
      <div className="flex-1 space-y-4 w-full">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-zinc-100">Session Charter</h3>
          <button onClick={newCharter} className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors">
            Generate New
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={charter}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-zinc-300 font-medium leading-relaxed italic"
          >
            "{charter}"
          </motion.div>
        </AnimatePresence>
        <p className="text-sm text-zinc-500">A charter keeps you focused. You have 30 minutes to explore this specific area before stopping to debrief.</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border-4 border-zinc-800 bg-zinc-950 p-6 shadow-2xl min-w-[200px]">
        <div className={`font-mono text-5xl font-black mb-4 tracking-tight transition-colors ${isRunning ? "text-accent" : "text-zinc-500"}`}>
          {formatTime(timeLeft)}
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleTimer}
            className={`rounded-lg px-6 py-2 font-bold uppercase tracking-wider text-sm transition-colors ${
              isRunning ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" : "bg-accent text-zinc-950 hover:bg-accent/90"
            }`}
          >
            {isRunning ? "Pause" : timeLeft === 0 ? "Done" : "Start"}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(30 * 60);
            }}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-200"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
