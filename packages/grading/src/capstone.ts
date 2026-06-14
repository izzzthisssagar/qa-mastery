/**
 * Capstone rubric grading — the structured auto-checks a reviewer would tick on
 * a learner's one-page test plan (Track A finale). Pure and deterministic so it
 * unit-tests without a database; the server action handles auth, persistence
 * and progress, then calls `gradeCapstone` for the verdict.
 *
 * The rubric is deliberately generous on form, strict on substance: a real
 * scope statement, three or more risks, an approach that names a recognised
 * test-design technique, and an explicit ship / no-ship call.
 */

export const SHIP_RECOMMENDATIONS = ["go", "no-go", "go-with-conditions"] as const;
export type ShipRecommendation = (typeof SHIP_RECOMMENDATIONS)[number];

export interface CapstoneInput {
  scope: string;
  risks: string;
  approach: string;
  recommendation: ShipRecommendation;
}

export interface CapstoneCheck {
  label: string;
  passed: boolean;
}

export interface CapstoneResult {
  /** Normalised (trimmed) inputs, ready to persist. */
  normalized: { scope: string; risks: string; approach: string };
  checklist: CapstoneCheck[];
  score: number; // 0–100
}

/** Minimum scope length that reads as a real in/out statement, not a stub. */
export const MIN_SCOPE_LENGTH = 30;
/** A defensible plan names at least this many risks (one per line). */
export const MIN_RISK_COUNT = 3;

/** Names a recognised test-design technique in the approach section. */
const TECHNIQUE_WORDS =
  /\b(equivalence|partition|boundary|bva|decision[\s-]?table|state[\s-]?transition|error[\s-]?guess)/i;

export function isShipRecommendation(value: string): value is ShipRecommendation {
  return (SHIP_RECOMMENDATIONS as readonly string[]).includes(value);
}

/** Count non-empty lines — risks are entered one per line. */
function countRisks(risks: string): number {
  return risks
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;
}

export function gradeCapstone(input: CapstoneInput): CapstoneResult {
  const scope = input.scope.trim();
  const risks = input.risks.trim();
  const approach = input.approach.trim();

  const checklist: CapstoneCheck[] = [
    { label: "Scope defines what's in and out of test", passed: scope.length >= MIN_SCOPE_LENGTH },
    { label: "At least three risks identified", passed: countRisks(risks) >= MIN_RISK_COUNT },
    { label: "Approach names a test-design technique", passed: TECHNIQUE_WORDS.test(approach) },
    {
      label: "A clear ship / no-ship recommendation is made",
      passed: isShipRecommendation(input.recommendation),
    },
  ];
  const score = Math.round(
    (checklist.filter((c) => c.passed).length / checklist.length) * 100,
  );

  return { normalized: { scope, risks, approach }, checklist, score };
}
