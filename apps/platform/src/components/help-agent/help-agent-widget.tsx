"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HelpAgentPanel } from "./help-agent-panel";
import { useHelpAgent } from "./help-agent-context";

export function HelpAgentWidget() {
  const { open, initialPrompt, openWithPrompt, close } = useHelpAgent();
  const reduce = useReducedMotion();

  return (
    <>
      <AnimatePresence>
        {open && <HelpAgentPanel key="panel" initialPrompt={initialPrompt} onClose={close} />}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={() => (open ? close() : openWithPrompt())}
        aria-label={open ? "Close QA tutor" : "Open QA tutor"}
        title="QA Tutor"
        initial={reduce ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={reduce ? undefined : { scale: 1.08 }}
        whileTap={reduce ? undefined : { scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground shadow-lg shadow-accent/30 ring-1 ring-accent/40 transition-shadow hover:shadow-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:right-6"
      >
        {open ? "✕" : "?"}
      </motion.button>
    </>
  );
}
