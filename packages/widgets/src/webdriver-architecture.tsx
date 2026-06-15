"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function WebDriverArchitecture({ onMilestone }: { onMilestone?: (m: string) => void }) {
  const [step, setStep] = useState(0);

  const sendCommand = () => {
    if (step !== 0) return;
    setStep(1);
    setTimeout(() => setStep(2), 1000);
    setTimeout(() => setStep(3), 2000);
    setTimeout(() => setStep(4), 3000);
    setTimeout(() => setStep(5), 4000);
    setTimeout(() => {
      setStep(0);
      onMilestone?.("completed-flow");
    }, 5000);
  };

  return (
    <div className="my-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">WebDriver Architecture</h3>
          <p className="text-sm text-zinc-400">The Request/Response model of a single Selenium command.</p>
        </div>
        <button
          onClick={sendCommand}
          disabled={step !== 0}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 disabled:opacity-50 disabled:shadow-none"
        >
          {step === 0 ? "Send Command" : "Command in flight..."}
        </button>
      </div>

      <div className="relative flex items-center justify-between px-4 py-12 md:px-12">
        {/* Nodes */}
        <Node label="Test Code" icon="📝" isActive={step === 1 || step === 5} color="border-emerald-500 text-emerald-400" />
        <Node label="Browser Driver" icon="⚙️" isActive={step === 2 || step === 4} color="border-amber-500 text-amber-400" />
        <Node label="Browser" icon="🌐" isActive={step === 3} color="border-rose-500 text-rose-400" />

        {/* Lines between nodes */}
        <div className="absolute left-1/4 right-1/4 top-1/2 -z-10 h-[2px] -translate-y-1/2 bg-zinc-800 w-1/2" />
        
        {/* Animated Packet */}
        <AnimatePresence>
          {step > 0 && (
            <motion.div
              initial={false}
              animate={{
                left: getPacketPosition(step),
                opacity: step === 3 ? 0 : 1,
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center rounded border border-accent bg-accent/20 px-2 py-1 text-[10px] font-mono text-accent backdrop-blur-sm"
              style={{ left: getPacketPosition(1) }} // fallback starting pos
            >
              {getPacketLabel(step)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex justify-center">
        <p className="text-sm text-zinc-400 min-h-6 font-mono text-center">
          {getStepDescription(step)}
        </p>
      </div>
    </div>
  );
}

function Node({ label, icon, isActive, color }: { label: string; icon: string; isActive: boolean; color: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{ scale: isActive ? 1.1 : 1 }}
        className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 bg-zinc-950 text-2xl shadow-xl transition-colors duration-300 ${
          isActive ? color + " shadow-" + color.split('-')[1] + "-500/20" : "border-zinc-800 text-zinc-600"
        }`}
      >
        {icon}
      </motion.div>
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">{label}</span>
    </div>
  );
}

function getPacketPosition(step: number) {
  // Approximate positions: 
  // 1: Leaving Test Code (~15%)
  // 2: Entering Driver (~50%)
  // 3: Inside browser (Hidden)
  // 4: Leaving Browser (~85%)
  // 5: Entering Driver (~50%) going back
  switch (step) {
    case 1: return "15%";
    case 2: return "50%";
    case 3: return "85%";
    case 4: return "50%";
    case 5: return "15%";
    default: return "15%";
  }
}

function getPacketLabel(step: number) {
  switch (step) {
    case 1: return "{ cmd: 'click' }";
    case 2: return "W3C Spec";
    case 4: return "HTTP 200 OK";
    case 5: return "void";
    default: return "";
  }
}

function getStepDescription(step: number) {
  switch (step) {
    case 0: return "Awaiting your command.";
    case 1: return "Test code sends an HTTP request to the Driver.";
    case 2: return "Driver translates request into browser-specific protocol.";
    case 3: return "Browser executes the action on the DOM.";
    case 4: return "Browser sends success response back to the Driver.";
    case 5: return "Driver translates response back to the Test code.";
    default: return "";
  }
}
