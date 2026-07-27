/**
 * Lab assertions — a pure function over a check spec + a run's output, mirroring
 * tasks.ts and capstone.ts. No DB access, no network: the caller runs the code,
 * passes the console text back here, and writes the verdict under the service
 * role (invariant 2).
 *
 * Why this exists: a RunnerProvider only reports whether the program EXITED
 * cleanly. `WandboxRunner` sets `passed` from exit code 0, so "compiles and does
 * not crash" currently counts as a pass. That is fine as a smoke signal and
 * useless as grading — an empty `main` passes it. A note lab is only meaningful
 * if we assert on what the program actually produced, which is what these
 * checks do.
 *
 * Checks are authored by us in the lab registry, never by learners, so the
 * regex form is not attacker-controlled.
 */

export interface LabCheck {
  /** Shown to the learner in the pass/fail list — phrase it as the goal. */
  label: string;
  /** Whole output must equal this (trimmed, newlines normalised). */
  equals?: string;
  /** Output must contain this substring. */
  contains?: string;
  /** Output must NOT contain this substring. */
  absent?: string;
  /** Output must match this regex (source string, compiled without flags beyond `i`). */
  matches?: string;
  /**
   * The SUBMITTED SOURCE must contain this. Used to require a technique rather
   * than a result — e.g. a loop lab where printing the answer as a literal
   * would otherwise satisfy every output check.
   */
  sourceContains?: string;
  /** The submitted source must NOT contain this — bans the shortcut. */
  sourceAbsent?: string;
  /** Comparisons are case-insensitive unless this is set. */
  caseSensitive?: boolean;
}

export interface LabCheckResult {
  label: string;
  passed: boolean;
  /** Learner-facing reason, present only on failure. */
  detail?: string;
}

export interface LabGradeResult {
  passed: boolean;
  /** 0–100, the share of checks met. Partial credit for the progress bar. */
  score: number;
  checks: LabCheckResult[];
}

export interface LabRunEvidence {
  /** Console text from the RunResult. */
  console: string;
  /** The code the learner submitted. */
  source: string;
  /** False when the program failed to compile or exited non-zero. */
  ranCleanly: boolean;
}

/** Normalise for comparison: trim, collapse CRLF, and optionally case-fold. */
function normalize(text: string, caseSensitive: boolean): string {
  const clean = text.replace(/\r\n/g, "\n").trim();
  return caseSensitive ? clean : clean.toLowerCase();
}

function evaluate(check: LabCheck, evidence: LabRunEvidence): LabCheckResult {
  const cs = check.caseSensitive ?? false;
  const out = normalize(evidence.console, cs);
  const src = normalize(evidence.source, cs);

  if (check.equals != null) {
    const want = normalize(check.equals, cs);
    if (out !== want) {
      return {
        label: check.label,
        passed: false,
        detail: `Expected exactly "${check.equals.trim()}".`,
      };
    }
  }
  if (check.contains != null) {
    if (!out.includes(normalize(check.contains, cs))) {
      return {
        label: check.label,
        passed: false,
        detail: `Output should contain "${check.contains}".`,
      };
    }
  }
  if (check.absent != null) {
    if (out.includes(normalize(check.absent, cs))) {
      return {
        label: check.label,
        passed: false,
        detail: `Output should not contain "${check.absent}".`,
      };
    }
  }
  if (check.matches != null) {
    const re = new RegExp(check.matches, cs ? "" : "i");
    if (!re.test(evidence.console)) {
      return { label: check.label, passed: false, detail: "Output is not in the expected shape." };
    }
  }
  if (check.sourceContains != null) {
    if (!src.includes(normalize(check.sourceContains, cs))) {
      return {
        label: check.label,
        passed: false,
        detail: `Your code needs to use \`${check.sourceContains}\`.`,
      };
    }
  }
  if (check.sourceAbsent != null) {
    if (src.includes(normalize(check.sourceAbsent, cs))) {
      return {
        label: check.label,
        passed: false,
        detail: `Solve it without \`${check.sourceAbsent}\`.`,
      };
    }
  }

  return { label: check.label, passed: true };
}

/**
 * Grade one lab run. A run that never executed fails every check with the
 * compiler/runtime message attached to the first one, so the learner sees the
 * build error rather than a wall of identical "expected output" failures.
 * Passing requires every check to be met — labs are pass/fail, the score is
 * only for the progress bar.
 */
export function gradeLabRun(checks: readonly LabCheck[], evidence: LabRunEvidence): LabGradeResult {
  if (checks.length === 0) {
    // No assertions authored — fall back to the runner's own clean-exit signal.
    return {
      passed: evidence.ranCleanly,
      score: evidence.ranCleanly ? 100 : 0,
      checks: [],
    };
  }

  if (!evidence.ranCleanly) {
    return {
      passed: false,
      score: 0,
      checks: checks.map((c, i) => ({
        label: c.label,
        passed: false,
        detail: i === 0 ? "Your code did not run — fix the error above first." : undefined,
      })),
    };
  }

  const results = checks.map((c) => evaluate(c, evidence));
  const met = results.filter((r) => r.passed).length;

  return {
    passed: met === results.length,
    score: Math.round((met / results.length) * 100),
    checks: results,
  };
}
