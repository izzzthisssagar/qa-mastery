"use client";

import { useState } from "react";
import { Button } from "@qa-mastery/ui";
import { submitQuiz, type SubmitQuizResult } from "../actions";

/** Client-safe quiz question — the answer key (`correct`/`explanation`) is
 *  stripped server-side and only returned after grading. */
export interface PublicQuizQuestion {
  id: string;
  type: "single" | "multi";
  prompt: string;
  options: string[];
}

export function QuizPanel({
  slug,
  questions,
}: {
  slug: string;
  questions: PublicQuizQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [result, setResult] = useState<SubmitQuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const graded = result !== null;
  const allAnswered = questions.every((q) => (answers[q.id]?.length ?? 0) > 0);

  function toggle(question: PublicQuizQuestion, index: number) {
    if (graded) return;
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      if (question.type === "single") return { ...prev, [question.id]: [index] };
      return {
        ...prev,
        [question.id]: current.includes(index)
          ? current.filter((i) => i !== index)
          : [...current, index],
      };
    });
  }

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      setResult(await submitQuiz(slug, answers));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong grading your quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setResult(null);
    setAnswers({});
    setError(null);
  }

  function resultFor(qid: string) {
    return result?.perQuestion.find((p) => p.id === qid) ?? null;
  }

  return (
    <section data-testid="quiz-panel" className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      {graded && (
        <div
          data-testid="quiz-result-banner"
          className={
            result.passed
              ? "mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3"
              : "mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3"
          }
        >
          <p className="text-sm font-semibold text-zinc-100">
            {result.passed ? "🎉 Passed" : "Not yet — keep going"} · {result.score}/{result.maxScore}{" "}
            ({Math.round((result.score / result.maxScore) * 100)}%)
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {result.passed
              ? "Lesson complete. Your flashcards are now in the review queue."
              : `You need ${Math.round(result.passMark * 100)}% to pass. Review the explanations below, then try again.`}
          </p>
        </div>
      )}

      <ol className="space-y-6">
        {questions.map((q, qi) => {
          const selected = answers[q.id] ?? [];
          const r = resultFor(q.id);
          return (
            <li key={q.id} data-testid={`quiz-q-${q.id}`}>
              <p className="text-sm font-medium text-zinc-100">
                <span className="text-zinc-500">{qi + 1}.</span> {q.prompt}
                {q.type === "multi" && (
                  <span className="ml-2 text-xs text-zinc-500">(select all that apply)</span>
                )}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = selected.includes(oi);
                  const isCorrect = r?.correctIndices.includes(oi) ?? false;
                  const stateClass = !graded
                    ? isSelected
                      ? "border-accent bg-accent/10 text-zinc-50"
                      : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                    : isCorrect
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                      : isSelected
                        ? "border-red-500/60 bg-red-500/10 text-red-200"
                        : "border-zinc-800 text-zinc-500";
                  return (
                    <button
                      key={oi}
                      type="button"
                      data-testid={`quiz-opt-${q.id}-${oi}`}
                      aria-pressed={isSelected}
                      disabled={graded}
                      onClick={() => toggle(q, oi)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default ${stateClass}`}
                    >
                      <span
                        className={`grid h-4 w-4 shrink-0 place-items-center border text-[10px] ${
                          q.type === "single" ? "rounded-full" : "rounded"
                        } ${isSelected ? "border-current" : "border-zinc-600"}`}
                        aria-hidden
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {graded && r?.explanation && (
                <p
                  data-testid={`quiz-explanation-${q.id}`}
                  className="mt-2 rounded-lg bg-zinc-800/50 px-3 py-2 text-xs text-zinc-400"
                >
                  {r.correct ? "✓ " : "✗ "}
                  {r.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {error && (
        <p data-testid="quiz-error" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        {graded ? (
          <Button variant="secondary" onClick={retry} data-testid="quiz-retry">
            Try again
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={!allAnswered || submitting}
            data-testid="quiz-submit"
          >
            {submitting ? "Grading…" : "Submit answers"}
          </Button>
        )}
        {!graded && !allAnswered && (
          <span className="text-xs text-zinc-500">Answer every question to submit.</span>
        )}
      </div>
    </section>
  );
}
