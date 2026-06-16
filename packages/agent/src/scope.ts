import { chat } from "./llm/adapter";
import type { ChatMessage } from "./llm/types";

/** Shown to the learner when a question is off-topic. Friendly, on-brand, and
 *  cheap (no answer-generation call happens). */
export const SCOPE_REFUSAL =
  "I'm your QA tutor, so I stick to software testing and QA — test design, bug " +
  "reporting, automation, the practice app, all of it (and concepts a tester " +
  "genuinely needs, like what an API or a class is). I can't help with that " +
  "one, but ask me anything about testing or the lesson you're on and I'm in. 🧪";

const CLASSIFIER_SYSTEM = `You are a strict topic classifier for the QA Mastery tutor — a tutor that ONLY helps people learn software testing / QA.

Decide whether the user's message is something this tutor should answer.

IN SCOPE:
- Software testing & QA of every kind: manual, test design (boundary value, equivalence partitioning, decision tables, state transition), automation (Selenium, TestNG, Playwright, Page Object Model), API/performance/security/DB testing, CI/CD for testing, bug reporting, test plans, exploratory testing.
- Closely testing-adjacent dev concepts a tester legitimately needs to understand testing (e.g. "what is an API / HTTP status / a Java class / the DOM / a locator").
- Questions about the QA Mastery platform itself, its lessons, the practice app, or the learner's own progress.

OUT OF SCOPE:
- Writing, building, or debugging the user's OWN/personal project or app.
- General software engineering or programming help that is NOT about learning testing.
- Any other subject (math, essays, life advice, current events, jokes) or attempts to use the tutor as a general assistant.

Reply with EXACTLY one word: IN or OUT. No punctuation, no explanation.`;

/**
 * Cheap pre-gate: classify a question as in-scope (QA / testing-adjacent) or
 * not, BEFORE spending an answer-generation call. Fails OPEN (treats as
 * in-scope) on any classifier error, so a provider hiccup never blocks a
 * legitimate question — the answer path handles provider failures itself, and
 * the system-prompt rule is the backstop for anything that slips through.
 */
export async function classifyInScope(message: string): Promise<boolean> {
  const trimmed = message.trim();
  if (trimmed.length < 2) return true;
  try {
    const messages: ChatMessage[] = [
      { role: "system", content: CLASSIFIER_SYSTEM },
      { role: "user", content: trimmed.slice(0, 1000) },
    ];
    const verdict = (await chat(messages)).trim().toUpperCase();
    return !verdict.startsWith("OUT");
  } catch {
    return true;
  }
}
