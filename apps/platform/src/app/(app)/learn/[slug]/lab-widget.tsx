"use client";

import { useLessonProgress } from "./progress-context";
import { BugReportLab } from "./lab-panel";

/**
 * The lesson's "Do it" lab, mapped into the MDX as `<BugReportLab />`. Pulls the
 * slug from progress context so the MDX tag stays prop-free.
 */
export function LessonLab() {
  const { slug } = useLessonProgress();
  return <BugReportLab slug={slug} />;
}
