"use client";

import { useState } from "react";
import { HelpAgentPanel } from "./help-agent-panel";

export function HelpAgentWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <HelpAgentPanel onClose={() => setOpen(false)} />}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-zinc-950 shadow-lg transition-transform hover:scale-105 sm:right-6"
        aria-label={open ? "Close QA tutor" : "Open QA tutor"}
        title="QA Tutor"
      >
        {open ? "✕" : "?"}
      </button>
    </>
  );
}
