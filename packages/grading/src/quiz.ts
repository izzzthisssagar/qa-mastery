/**
 * Pure quiz scoring. Answer keys live in server-only *.quiz.json files in
 * packages/curriculum; the client never sees `correct` arrays.
 */

export interface QuizQuestion {
  id: string;
  type: "single" | "multi";
  prompt: string;
  options: string[];
  /** Indices into `options`. Single-choice questions have exactly one. */
  correct: number[];
  points?: number;
}

/** questionId → selected option indices. */
export type QuizAnswers = Record<string, number[]>;

export interface QuizQuestionResult {
  id: string;
  correct: boolean;
  earned: number;
  possible: number;
}

export interface QuizResult {
  score: number;
  maxScore: number;
  passed: boolean;
  passMark: number;
  perQuestion: QuizQuestionResult[];
}

const DEFAULT_POINTS = 1;
export const DEFAULT_PASS_MARK = 0.7;

function sameSelection(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((value, i) => value === sortedB[i]);
}

/**
 * v1 policy: all-or-nothing per question (multi-select gets no partial
 * credit — selecting a wrong option means the concept isn't solid yet).
 */
export function scoreQuiz(
  questions: QuizQuestion[],
  answers: QuizAnswers,
  passMark: number = DEFAULT_PASS_MARK,
): QuizResult {
  const perQuestion: QuizQuestionResult[] = questions.map((question) => {
    const possible = question.points ?? DEFAULT_POINTS;
    const selected = answers[question.id] ?? [];
    const correct = sameSelection(selected, question.correct);
    return { id: question.id, correct, earned: correct ? possible : 0, possible };
  });

  const score = perQuestion.reduce((sum, q) => sum + q.earned, 0);
  const maxScore = perQuestion.reduce((sum, q) => sum + q.possible, 0);
  const passed = maxScore > 0 && score / maxScore >= passMark;

  return { score, maxScore, passed, passMark, perQuestion };
}
