/**
 * Task grading — a pure function over criteria + evidence, mirroring capstone.ts.
 * The server action gathers evidence (counting service-role-scored bug_reports
 * and the learner's test_cases) and calls this; the score/pass verdict is then
 * written to user_task_grades by the service role. No DB access here — keeps the
 * grading package DB-free and unit-testable.
 */

export interface TaskCriteria {
  /** bug_hunt / api_bug_hunt: how many of the learner's bug reports must be valid. */
  minValidBugs?: number;
  /** test_design: how many authored test cases are required. */
  minTestCases?: number;
}

export interface TaskEvidence {
  /** Count of the learner's bug_reports scored valid by the service role. */
  validBugReports: number;
  /** Count of the learner's authored test cases. */
  testCases: number;
}

export interface TaskRequirement {
  label: string;
  required: number;
  actual: number;
  met: boolean;
}

export interface TaskGradeResult {
  passed: boolean;
  /** 0–100, the mean progress across the task's requirements. */
  score: number;
  requirements: TaskRequirement[];
}

/**
 * Grade a task. A requirement contributes `min(actual/required, 1)` to the mean;
 * the task passes only when every requirement is fully met. A task with no
 * thresholds (kind 'custom' / personal todo) is graded purely on completion by
 * the caller and should not reach here.
 */
export function gradeTask(criteria: TaskCriteria, evidence: TaskEvidence): TaskGradeResult {
  const requirements: TaskRequirement[] = [];

  if (criteria.minValidBugs != null) {
    const required = criteria.minValidBugs;
    const actual = evidence.validBugReports;
    requirements.push({ label: "Valid bug reports", required, actual, met: actual >= required });
  }
  if (criteria.minTestCases != null) {
    const required = criteria.minTestCases;
    const actual = evidence.testCases;
    requirements.push({ label: "Test cases authored", required, actual, met: actual >= required });
  }

  if (requirements.length === 0) {
    // No measurable criteria — treat as satisfied (completion-graded elsewhere).
    return { passed: true, score: 100, requirements };
  }

  const progress =
    requirements.reduce(
      (sum, r) => sum + (r.required === 0 ? 1 : Math.min(r.actual / r.required, 1)),
      0,
    ) / requirements.length;

  return {
    passed: requirements.every((r) => r.met),
    score: Math.round(progress * 100),
    requirements,
  };
}
