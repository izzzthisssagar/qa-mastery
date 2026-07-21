"use client";

import { useLessonProgress } from "./progress-context";
import { BugReportLab } from "@/components/bug-report-lab";
import { submitBugReport } from "../actions";
import { HuntPanel } from "./hunt-panel";
import { CapstonePanel } from "./capstone-panel";

/**
 * The lesson's "Do it" lab, mapped into the MDX as `<BugReportLab />`. Pulls the
 * slug from progress context so the MDX tag stays prop-free.
 */
export function LessonLab() {
  const { slug } = useLessonProgress();
  return <BugReportLab onSubmit={(report) => submitBugReport(slug, report)} />;
}

/** The Bug Hunt milestone, mapped into the MDX as `<BugHunt />`. */
export function LessonHunt() {
  const { slug } = useLessonProgress();
  return <HuntPanel slug={slug} />;
}

/** The graded capstone deliverable, mapped into the MDX as `<CapstoneSubmission />`. */
export function LessonCapstone() {
  const { slug } = useLessonProgress();
  return <CapstonePanel slug={slug} />;
}
