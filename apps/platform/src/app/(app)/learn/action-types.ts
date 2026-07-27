import type { ManifestBug } from "@qa-mastery/grading";

export type Step = "see" | "try" | "do" | "prove";

export interface LessonRegistryRow {
  id: string;
  free: boolean;
  status: string;
}

export interface QuizQuestionResultForClient {
  id: string;
  correct: boolean;
  correctIndices: number[];
  explanation: string | null;
}

export interface SubmitQuizResult {
  score: number;
  maxScore: number;
  passed: boolean;
  passMark: number;
  perQuestion: QuizQuestionResultForClient[];
}

export interface BugManifestRow {
  bug_id: string;
  release: string;
  page: string;
  feature: string;
  category: string;
  severity: ManifestBug["severity"];
  points: number;
  title_internal: string;
  expected: string | null;
}

export interface BugReportResult {
  matched: boolean;
  duplicate: boolean;
  score: number;
  feedback: string[];
  matchedBugId: string | null;
}

export interface HuntStatus {
  /** Distinct seeded-bug ids this learner has matched on this lesson. */
  found: string[];
  /** Seeded bugs available to find in the lesson's release. */
  total: number;
}
