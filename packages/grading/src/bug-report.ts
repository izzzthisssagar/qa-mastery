/**
 * Structured bug-report matching against the BuggyShop seeded-bug manifest.
 *
 * v1 contract (BuggyShop-Spec.md §3, decision #2): the learner picks page,
 * feature, category and severity from dropdowns (built from the *stripped*
 * taxonomy — never the manifest itself) and describes the rest. Matching is
 * exact on page+feature; category and severity affect the score, not the
 * match. Free-text/AI-assisted fuzzy matching is a Phase 1.5 upgrade.
 */

export const SEVERITIES = ["trivial", "minor", "major", "critical", "blocker"] as const;
export type Severity = (typeof SEVERITIES)[number];

export interface ManifestBug {
  id: string;
  release: string;
  page: string;
  feature: string;
  category: string;
  severity: Severity;
  points: number;
  /** Internal fields — must never be sent to the client before a match. */
  titleInternal: string;
  expected: string;
}

export interface BugReportInput {
  page: string;
  feature: string;
  category: string;
  severity: Severity;
  title: string;
  steps: string[];
  expected: string;
  actual: string;
}

export interface MatchOutcome {
  /** The seeded bug this report matched, if any. */
  matched: ManifestBug | null;
  /** True when the learner already had this bug ID matched earlier. */
  duplicate: boolean;
  score: number;
  feedback: string[];
}

function severityDistance(a: Severity, b: Severity): number {
  return Math.abs(SEVERITIES.indexOf(a) - SEVERITIES.indexOf(b));
}

// Scoring weights are v1 placeholders; tune against Lesson 2's rubric in M1.
const CATEGORY_MISS_MULTIPLIER = 0.5;
const SEVERITY_NEAR_MULTIPLIER = 0.8;
const SEVERITY_FAR_MULTIPLIER = 0.5;

export function matchBugReport(
  report: BugReportInput,
  manifest: ManifestBug[],
  alreadyMatchedIds: ReadonlySet<string> = new Set(),
): MatchOutcome {
  const candidate =
    manifest.find((bug) => bug.page === report.page && bug.feature === report.feature) ?? null;

  if (!candidate) {
    return {
      matched: null,
      duplicate: false,
      score: 0,
      feedback: [
        "No seeded bug lives at that page + feature combination. Re-check where the behavior actually occurs — or you may have found a real, unseeded issue (tell us!).",
      ],
    };
  }

  if (alreadyMatchedIds.has(candidate.id)) {
    return {
      matched: candidate,
      duplicate: true,
      score: 0,
      feedback: [
        `You already reported ${candidate.id}. Duplicates score 0 — exactly like a real triage queue.`,
      ],
    };
  }

  const feedback: string[] = [];
  let score = candidate.points;

  if (report.category !== candidate.category) {
    score *= CATEGORY_MISS_MULTIPLIER;
    feedback.push(
      `Category: this one is best classified as "${candidate.category}" (you chose "${report.category}").`,
    );
  }

  const distance = severityDistance(report.severity, candidate.severity);
  if (distance === 1) {
    score *= SEVERITY_NEAR_MULTIPLIER;
    feedback.push(
      `Severity: close — we rate it "${candidate.severity}". Think about user impact, not effort to fix.`,
    );
  } else if (distance > 1) {
    score *= SEVERITY_FAR_MULTIPLIER;
    feedback.push(
      `Severity: we rate it "${candidate.severity}", which is ${distance} levels away from your "${report.severity}". Revisit severity vs priority.`,
    );
  }

  feedback.push(`Matched seeded bug ${candidate.id}: ${candidate.titleInternal}`);

  return {
    matched: candidate,
    duplicate: false,
    score: Math.round(score),
    feedback,
  };
}
