import { SEVERITIES, type Severity } from "./bug-report";

/**
 * Structured API bug-report matching against the BuggyAPI seeded-bug manifest
 * (buggyapi.ba_bug_manifest, server-only). Same v1 contract as BuggyShop's
 * matchBugReport: exact match on surface+endpoint (the "where"), category and
 * severity shape the score, not the match. The learner picks all four from
 * the stripped taxonomy (api-bug-taxonomy.ts).
 */

export interface ApiManifestBug {
  id: string;
  surface: string;
  endpoint: string;
  category: string;
  severity: Severity;
  points: number;
  /** Internal fields — must never be sent to the client before a match. */
  titleInternal: string;
  expected: string;
}

export interface ApiBugReportInput {
  surface: string;
  endpoint: string;
  category: string;
  severity: Severity;
  title: string;
  steps: string[];
  expected: string;
  actual: string;
}

export interface ApiMatchOutcome {
  matched: ApiManifestBug | null;
  duplicate: boolean;
  score: number;
  feedback: string[];
}

function severityDistance(a: Severity, b: Severity): number {
  return Math.abs(SEVERITIES.indexOf(a) - SEVERITIES.indexOf(b));
}

// Same weights as bug-report.ts — one rubric across both practice apps.
const CATEGORY_MISS_MULTIPLIER = 0.5;
const SEVERITY_NEAR_MULTIPLIER = 0.8;
const SEVERITY_FAR_MULTIPLIER = 0.5;

export function matchApiBugReport(
  report: ApiBugReportInput,
  manifest: ApiManifestBug[],
  alreadyMatchedIds: ReadonlySet<string> = new Set(),
): ApiMatchOutcome {
  const candidate =
    manifest.find((bug) => bug.surface === report.surface && bug.endpoint === report.endpoint) ??
    null;

  if (!candidate) {
    return {
      matched: null,
      duplicate: false,
      score: 0,
      feedback: [
        "No seeded bug lives at that surface + endpoint combination. Re-check where the contract actually breaks — or you may have found a real, unseeded issue (tell us!).",
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
      `Severity: close — we rate it "${candidate.severity}". Think about consumer impact, not effort to fix.`,
    );
  } else if (distance > 1) {
    score *= SEVERITY_FAR_MULTIPLIER;
    feedback.push(
      `Severity: we rate it "${candidate.severity}", which is ${distance} levels away from your "${report.severity}". Revisit severity vs priority.`,
    );
  }

  // INVARIANT 1: never leak manifest internals to the client. The bug ID is a
  // safe reference; titleInternal is the answer key and must stay server-side.
  feedback.push(`Matched seeded bug ${candidate.id}.`);

  return {
    matched: candidate,
    duplicate: false,
    score: Math.round(score),
    feedback,
  };
}
