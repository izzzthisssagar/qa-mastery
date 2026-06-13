"use client";

import { useLessonProgress } from "./progress-context";
import { BugReportLab } from "./lab-panel";
import { HuntPanel } from "./hunt-panel";

/**
 * The lesson's "Do it" lab, mapped into the MDX as `<BugReportLab />`. Pulls the
 * slug from progress context so the MDX tag stays prop-free.
 */
export function LessonLab() {
  const { slug } = useLessonProgress();
  return <BugReportLab slug={slug} />;
}

/** The Bug Hunt milestone, mapped into the MDX as `<BugHunt />`. */
export function LessonHunt() {
  const { slug } = useLessonProgress();
  return <HuntPanel slug={slug} />;
}
