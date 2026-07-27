"use server";

import { createServiceClient } from "@qa-mastery/db";
import type {
  BugReportInput,
  CapstoneInput,
  CapstoneResult,
  QuizAnswers,
  RunResult,
} from "@qa-mastery/grading";
import { getAuthedUserId } from "@/lib/auth";
import { withLogging } from "@/lib/logging";
import type { BugReportResult, HuntStatus, Step, SubmitQuizResult } from "./action-types";
import { huntStatusForUser, recordBugReport } from "./server/bug-hunt";
import { gradeAndRecordCapstone } from "./server/capstone";
import { pollCodeRunResult, runCodeSubmission } from "./server/code-lab";
import { saveProgressForUser } from "./server/progress";
import { scoreAndRecordQuiz } from "./server/quiz";
import { provisionSandboxAndMintUrl } from "./server/sandbox";

export type {
  BugReportResult,
  HuntStatus,
  QuizQuestionResultForClient,
  Step,
  SubmitQuizResult,
} from "./action-types";

/** Record progress. `step` marks one of the see/try/do/prove milestones; no
 *  step just ensures a 'started' row exists. Completion is owned by submitQuiz. */
export async function saveProgress(slug: string, step?: Step): Promise<{ ok: true }> {
  const userId = await getAuthedUserId();
  return saveProgressForUser(createServiceClient(), userId, slug, step);
}

export async function submitQuiz(slug: string, answers: QuizAnswers): Promise<SubmitQuizResult> {
  const userId = await getAuthedUserId();
  return withLogging("submitQuiz", userId, () =>
    scoreAndRecordQuiz(createServiceClient(), userId, slug, answers),
  );
}

export async function submitBugReport(
  slug: string,
  report: BugReportInput,
): Promise<BugReportResult> {
  const userId = await getAuthedUserId();
  return recordBugReport(createServiceClient(), userId, slug, report);
}

export async function getHuntStatus(slug: string): Promise<HuntStatus> {
  const userId = await getAuthedUserId();
  return huntStatusForUser(createServiceClient(), userId, slug);
}

/** Provision a BuggyShop sandbox for this user if they don't have one, and return
 *  the handoff URL populated with a short-lived JWT. */
export async function launchSandbox(slug: string): Promise<string> {
  const userId = await getAuthedUserId();
  return provisionSandboxAndMintUrl(createServiceClient(), userId, slug);
}

export async function submitCapstone(slug: string, input: CapstoneInput): Promise<CapstoneResult> {
  const userId = await getAuthedUserId();
  return gradeAndRecordCapstone(createServiceClient(), userId, slug, input);
}

export async function submitCodeLab(slug: string, code: string): Promise<{ runId: string }> {
  const userId = await getAuthedUserId();
  return withLogging("submitCodeLab", userId, () =>
    runCodeSubmission(createServiceClient(), userId, slug, code),
  );
}

export async function pollCodeRun(slug: string, runId: string): Promise<RunResult> {
  const userId = await getAuthedUserId();
  return pollCodeRunResult(createServiceClient(), userId, slug, runId);
}
