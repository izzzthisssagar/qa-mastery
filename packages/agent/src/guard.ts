const MANIFEST_LEAK_PATTERNS = [
  /title_internal/i,
  /repro_steps_internal/i,
  /matchedBugId/i,
];

const QUIZ_ANSWER_PATTERNS = [
  /\bthe correct answer is\b/i,
  /\banswer is option [a-d]\b/i,
  /\bchoose option [a-d]\b/i,
  /\bcorrect (option|choice|answer)\b/i,
];

export function guardResponse(content: string, turn: number): string {
  for (const pattern of MANIFEST_LEAK_PATTERNS) {
    if (pattern.test(content)) {
      return safeFallback();
    }
  }
  if (turn <= 1) {
    for (const pattern of QUIZ_ANSWER_PATTERNS) {
      if (pattern.test(content)) {
        return safeFallback();
      }
    }
  }
  return content;
}

function safeFallback(): string {
  return "I can help you think through this — what have you tried so far, and which part feels unclear?";
}
