/**
 * Code-runner seam for Track B (deferred — see plan §RunnerProvider).
 * Fallback ladder of future implementations:
 *   1. Judge0Provider — hosted API for plain-Java exercises (module B0)
 *   2. RepoSubmissionProvider — learner runs locally, submits GitHub repo URL
 *      + Surefire/Allure XML; we fetch + parse + static-check, no containers
 *   3. ManualReviewProvider — queues for founder rubric grading
 * v1 ships only NullRunner so Track A never depends on any of this.
 */

export type RunStatus = "queued" | "running" | "passed" | "failed" | "error" | "unavailable";

export interface RunRequest {
  lessonSlug: string;
  userId: string;
  /** Provider-specific payload: source code, repo URL, etc. */
  payload: Record<string, unknown>;
}

/** Upper bound on a code submission — generous for a lesson, but a hard cap so
 *  oversized payloads can't be forwarded to the (paid/compute-heavy) runner. */
export const MAX_CODE_LENGTH = 10_000;

/** Validate + normalise a code submission before it reaches a runner. Throws a
 *  learner-facing message on empty or oversized input. */
export function validateCodeSubmission(code: string): string {
  const trimmed = (code ?? "").trim();
  if (!trimmed) throw new Error("Write some code before running it.");
  if (trimmed.length > MAX_CODE_LENGTH) {
    throw new Error(`Submission too large (max ${MAX_CODE_LENGTH.toLocaleString()} characters).`);
  }
  return trimmed;
}

export interface RunResult {
  status: RunStatus;
  passed: boolean;
  console: string;
  artifacts: Array<{ name: string; url: string }>;
  staticChecks: Array<{ name: string; passed: boolean; detail?: string }>;
}

export interface RunnerProvider {
  readonly name: string;
  submit(request: RunRequest): Promise<{ runId: string }>;
  getResult(runId: string): Promise<RunResult>;
}

/** Placeholder provider: labs render a "coming soon" state instead of a runner. */
export class NullRunner implements RunnerProvider {
  readonly name = "null";

  async submit(): Promise<{ runId: string }> {
    return { runId: "null-run" };
  }

  async getResult(): Promise<RunResult> {
    return {
      status: "unavailable",
      passed: false,
      console: "Code execution is not available yet. Track B labs land in M4.",
      artifacts: [],
      staticChecks: [],
    };
  }
}
