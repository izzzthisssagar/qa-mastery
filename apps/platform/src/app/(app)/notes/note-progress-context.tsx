"use client";

import { createContext, useContext } from "react";

/**
 * Carries the current note's slug + the learner's initial completion state to
 * the <Complete> button rendered inside the note's MDX body (which otherwise
 * has no way to know which note it lives in). Mirrors the learn
 * LessonProgressProvider. Completion + XP are owned server-side by completeNote.
 */
interface NoteProgressContextValue {
  slug: string;
  initialDone: boolean;
}

const NoteProgressContext = createContext<NoteProgressContextValue | null>(null);

export function useNoteProgress(): NoteProgressContextValue {
  const ctx = useContext(NoteProgressContext);
  if (!ctx) {
    throw new Error("useNoteProgress must be used within <NoteProgressProvider>");
  }
  return ctx;
}

export function NoteProgressProvider({
  slug,
  initialDone,
  children,
}: {
  slug: string;
  initialDone: boolean;
  children: React.ReactNode;
}) {
  return (
    <NoteProgressContext.Provider value={{ slug, initialDone }}>
      {children}
    </NoteProgressContext.Provider>
  );
}
