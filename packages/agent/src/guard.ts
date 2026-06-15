// Internal manifest field names that must never surface in a tutor reply, on
// any turn. The context builder never feeds these to the model — this is
// defence-in-depth in case a future change does.
const MANIFEST_LEAK_PATTERNS = [/title_internal/i, /repro_steps_internal/i, /matchedBugId/i];

// Phrasings that hand a learner a quiz answer outright. Kept specific so normal
// teaching ("there's no single correct answer in exploratory testing") doesn't
// trip them. Enforced on the first reply — the "hints only" window before the
// learner has likely submitted; later turns may discuss the quiz once an
// attempt exists in context.
const QUIZ_ANSWER_PATTERNS = [
  /\bthe correct answer is\b/i,
  /\b(answer|correct option|right option) is option [a-d]\b/i,
  /\b(choose|select|pick|go with) option [a-d]\b/i,
  /\boption [a-d] is (the )?(correct|right|answer)\b/i,
  /\bthe (correct|right) (option|choice|answer) is\b/i,
  /\bgo with (the )?(first|second|third|fourth|last) (option|one|choice)\b/i,
];

/**
 * Scrub a tutor reply. Manifest leaks are blocked on every turn; quiz answer
 * give-aways are blocked on the first turn. Returns the original content when
 * clean, or a safe redirect when a pattern trips.
 */
export function guardResponse(content: string, turn: number): string {
  for (const pattern of MANIFEST_LEAK_PATTERNS) {
    if (pattern.test(content)) return safeFallback();
  }
  if (turn <= 1) {
    for (const pattern of QUIZ_ANSWER_PATTERNS) {
      if (pattern.test(content)) return safeFallback();
    }
  }
  return content;
}

/**
 * True when the text so far already contains content the guard would scrub.
 * Used by the streaming route to stop before an unsafe chunk reaches the client.
 */
export function wouldGuard(content: string, turn: number): boolean {
  return guardResponse(content, turn) !== content;
}

export function guardFallback(): string {
  return safeFallback();
}

function safeFallback(): string {
  return "I can help you think through this — what have you tried so far, and which part feels unclear?";
}
