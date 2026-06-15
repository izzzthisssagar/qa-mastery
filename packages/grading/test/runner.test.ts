import { describe, expect, it } from "vitest";
import { MAX_CODE_LENGTH, validateCodeSubmission } from "../src/runner";

describe("validateCodeSubmission", () => {
  it("returns trimmed code for a valid submission", () => {
    expect(validateCodeSubmission("  print('hi')  ")).toBe("print('hi')");
  });

  it("rejects empty or whitespace-only input", () => {
    expect(() => validateCodeSubmission("")).toThrow(/write some code/i);
    expect(() => validateCodeSubmission("   \n  ")).toThrow(/write some code/i);
  });

  it("rejects a submission over the size cap", () => {
    expect(() => validateCodeSubmission("x".repeat(MAX_CODE_LENGTH + 1))).toThrow(/too large/i);
  });

  it("accepts a submission exactly at the cap", () => {
    const atCap = "x".repeat(MAX_CODE_LENGTH);
    expect(validateCodeSubmission(atCap)).toBe(atCap);
  });
});
