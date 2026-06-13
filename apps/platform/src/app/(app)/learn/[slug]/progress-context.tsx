"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { saveProgress } from "../actions";

type Step = "see" | "try" | "do" | "prove";

interface LessonProgressContextValue {
  slug: string;
  /** Mark a see/try/do/prove milestone done. Idempotent per step, fire-and-forget. */
  markStep: (step: Step) => void;
}

const LessonProgressContext = createContext<LessonProgressContextValue | null>(null);

export function useLessonProgress(): LessonProgressContextValue {
  const ctx = useContext(LessonProgressContext);
  if (!ctx) {
    throw new Error("useLessonProgress must be used within <LessonProgressProvider>");
  }
  return ctx;
}

/**
 * Tracks the learner's progress through a lesson. Progress is low-stakes
 * (self-reported step state), so every write is fire-and-forget — a failed
 * save must never block the learner from reading the lesson or taking the quiz.
 * Completion and XP are owned server-side by submitQuiz, not by this provider.
 */
export function LessonProgressProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const startedRef = useRef(false);
  const doneRef = useRef<Set<Step>>(new Set());

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // Ensure a 'started' row exists the moment the lesson opens.
    void saveProgress(slug).catch(() => {});
  }, [slug]);

  function markStep(step: Step) {
    if (doneRef.current.has(step)) return;
    doneRef.current.add(step);
    void saveProgress(slug, step).catch(() => {});
  }

  return (
    <LessonProgressContext.Provider value={{ slug, markStep }}>
      {children}
    </LessonProgressContext.Provider>
  );
}
