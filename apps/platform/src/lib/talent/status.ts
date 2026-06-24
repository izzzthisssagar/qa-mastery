/**
 * Status → Badge tone — the single source of truth for marketplace state
 * colours (Design-System §1). Every status visual reads from here; no inline
 * colour decisions in components. Tones map onto the existing Badge component's
 * dark-UI idiom (border-{c}-500/40 bg-{c}-500/10 text-{c}-300).
 */
import type { BadgeProps } from "@qa-mastery/ui";

type Tone = NonNullable<BadgeProps["tone"]>;

export const availabilityTone: Record<string, Tone> = {
  open: "success",
  busy: "warning",
  not_looking: "default",
};

export const verificationTone: Record<string, Tone> = {
  verified: "success",
  pending: "warning",
  unverified: "default",
};

export const applicationTone: Record<string, Tone> = {
  applied: "info",
  shortlisted: "success",
  declined: "danger",
  hired: "success",
};

/** Bug-report severity (used by portfolio artifact tags). */
export const severityTone: Record<string, Tone> = {
  critical: "danger",
  major: "warning",
  minor: "info",
  cosmetic: "default",
};

export const portfolioTypeTone: Record<string, Tone> = {
  bug_report: "warning",
  automation: "success",
  test_case: "info",
  coverage: "info",
  other: "default",
};
