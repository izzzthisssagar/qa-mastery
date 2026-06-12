import { describe, expect, it } from "vitest";
import { scoreQuiz, type QuizQuestion } from "../src/quiz";

const QUESTIONS: QuizQuestion[] = [
  { id: "q1", type: "single", prompt: "?", options: ["a", "b"], correct: [1] },
  { id: "q2", type: "multi", prompt: "?", options: ["a", "b", "c"], correct: [0, 2] },
  { id: "q3", type: "single", prompt: "?", options: ["a", "b"], correct: [0], points: 2 },
];

describe("scoreQuiz", () => {
  it("scores a perfect run as passed with full marks", () => {
    const result = scoreQuiz(QUESTIONS, { q1: [1], q2: [2, 0], q3: [0] });
    expect(result.score).toBe(4);
    expect(result.maxScore).toBe(4);
    expect(result.passed).toBe(true);
  });

  it("multi-select is all-or-nothing (no partial credit)", () => {
    const result = scoreQuiz(QUESTIONS, { q1: [1], q2: [0], q3: [0] });
    expect(result.perQuestion.find((q) => q.id === "q2")?.earned).toBe(0);
    expect(result.score).toBe(3);
  });

  it("fails below the pass mark and treats missing answers as wrong", () => {
    const result = scoreQuiz(QUESTIONS, { q1: [1] });
    expect(result.score).toBe(1);
    expect(result.passed).toBe(false);
  });

  it("an empty quiz can never pass", () => {
    const result = scoreQuiz([], {});
    expect(result.maxScore).toBe(0);
    expect(result.passed).toBe(false);
  });
});
