export {
  DEFAULT_PASS_MARK,
  scoreQuiz,
  type QuizAnswers,
  type QuizQuestion,
  type QuizQuestionResult,
  type QuizResult,
} from "./quiz";

export {
  SEVERITIES,
  matchBugReport,
  type BugReportInput,
  type ManifestBug,
  type MatchOutcome,
  type Severity,
} from "./bug-report";

export {
  BUG_PAGES,
  BUG_FEATURES,
  BUG_CATEGORIES,
  type BugPage,
  type BugFeature,
  type BugCategory,
} from "./bug-taxonomy";

export {
  matchApiBugReport,
  type ApiBugReportInput,
  type ApiManifestBug,
  type ApiMatchOutcome,
} from "./api-bug-report";

export {
  API_BUG_SURFACES,
  API_BUG_ENDPOINTS,
  API_BUG_CATEGORIES,
  type ApiBugSurface,
  type ApiBugEndpoint,
  type ApiBugCategory,
} from "./api-bug-taxonomy";

export {
  NullRunner,
  MAX_CODE_LENGTH,
  validateCodeSubmission,
  type RunRequest,
  type RunResult,
  type RunStatus,
  type RunnerProvider,
} from "./runner";

// Runner *implementations* (Judge0/Docker/Playwright) pull node:child_process,
// so they live behind the server-only "@qa-mastery/grading/runners" entry —
// importing them here would taint every client that touches this barrel.
export {
  SHIP_RECOMMENDATIONS,
  MIN_SCOPE_LENGTH,
  MIN_RISK_COUNT,
  gradeCapstone,
  isShipRecommendation,
  type ShipRecommendation,
  type CapstoneInput,
  type CapstoneCheck,
  type CapstoneResult,
} from "./capstone";
