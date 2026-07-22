"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Lets any component under the authenticated shell open the floating QA tutor
 * pre-seeded with a question, instead of a learner having to re-explain what
 * they're stuck on from scratch. `HelpAgentPanel` already threads `pathname`
 * to the chat API for page-level context — this adds task-level context (e.g.
 * "I'm stuck on the bug-hunt lab for X") that the pathname alone can't carry.
 */

interface HelpAgentContextValue {
  open: boolean;
  initialPrompt: string | undefined;
  openWithPrompt: (prompt?: string) => void;
  close: () => void;
}

const HelpAgentContext = createContext<HelpAgentContextValue | null>(null);

export function HelpAgentProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);

  const value = useMemo<HelpAgentContextValue>(
    () => ({
      open,
      initialPrompt,
      openWithPrompt: (prompt) => {
        setInitialPrompt(prompt);
        setOpen(true);
      },
      close: () => setOpen(false),
    }),
    [open, initialPrompt],
  );

  return <HelpAgentContext.Provider value={value}>{children}</HelpAgentContext.Provider>;
}

export function useHelpAgent(): HelpAgentContextValue {
  const ctx = useContext(HelpAgentContext);
  if (!ctx) throw new Error("useHelpAgent must be used within HelpAgentProvider");
  return ctx;
}
