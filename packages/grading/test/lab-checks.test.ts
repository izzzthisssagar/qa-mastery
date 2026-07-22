import { describe, expect, it } from "vitest";
import { gradeLabRun, type LabCheck, type LabRunEvidence } from "../src/lab-checks";

/** A run that executed cleanly and printed `output`. */
function ran(output: string, source = ""): LabRunEvidence {
  return { console: output, source, ranCleanly: true };
}

describe("gradeLabRun", () => {
  it("passes when every check is met", () => {
    const checks: LabCheck[] = [{ label: "prints the name", contains: "login_empty_password" }];
    const result = gradeLabRun(checks, ran("login_empty_password\ncart_total_rounding"));

    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.checks).toHaveLength(1);
  });

  it("fails the lab when any single check misses, and scores the rest", () => {
    const checks: LabCheck[] = [
      { label: "first failure", contains: "login_empty_password" },
      { label: "second failure", contains: "cart_total_rounding" },
      { label: "no passing tests", absent: "logout" },
      { label: "fourth", contains: "nope" },
    ];
    const result = gradeLabRun(checks, ran("login_empty_password\ncart_total_rounding"));

    expect(result.passed).toBe(false);
    expect(result.score).toBe(75);
    expect(result.checks.filter((c) => !c.passed)).toHaveLength(1);
  });

  it("explains the miss so the learner knows what to change", () => {
    const result = gradeLabRun([{ label: "prints total", contains: "42" }], ran("41"));
    expect(result.checks[0]?.detail).toContain("42");
  });

  // The whole reason this module exists: the runner's own `passed` flag only
  // means "exited 0", so an empty program must NOT pass a lab with assertions.
  it("rejects a clean run that produced nothing", () => {
    const result = gradeLabRun([{ label: "prints total", contains: "42" }], ran(""));
    expect(result.passed).toBe(false);
  });

  it("fails every check when the code did not run, and says so once", () => {
    const checks: LabCheck[] = [
      { label: "a", contains: "x" },
      { label: "b", contains: "y" },
    ];
    const result = gradeLabRun(checks, {
      console: "SyntaxError: invalid syntax",
      source: "for",
      ranCleanly: false,
    });

    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.checks.every((c) => !c.passed)).toBe(true);
    expect(result.checks.filter((c) => c.detail != null)).toHaveLength(1);
  });

  it("falls back to the clean-exit signal when no checks are authored", () => {
    expect(gradeLabRun([], ran("anything")).passed).toBe(true);
    expect(gradeLabRun([], { console: "", source: "", ranCleanly: false }).passed).toBe(false);
  });

  describe("comparison modes", () => {
    it("ignores case and surrounding whitespace by default", () => {
      const result = gradeLabRun([{ label: "equals", equals: "Pass" }], ran("  pass\n"));
      expect(result.passed).toBe(true);
    });

    it("honours caseSensitive when the exercise is about exact output", () => {
      const result = gradeLabRun(
        [{ label: "equals", equals: "Pass", caseSensitive: true }],
        ran("pass"),
      );
      expect(result.passed).toBe(false);
    });

    it("normalises CRLF so Windows submissions are not penalised", () => {
      const result = gradeLabRun([{ label: "equals", equals: "a\nb" }], ran("a\r\nb"));
      expect(result.passed).toBe(true);
    });

    it("matches a regex shape", () => {
      const result = gradeLabRun([{ label: "shape", matches: "^total: \\d+$" }], ran("Total: 42"));
      expect(result.passed).toBe(true);
    });
  });

  describe("source checks", () => {
    // Output assertions alone are gameable — printing the answer as a literal
    // satisfies them. sourceContains is what makes a technique lab real.
    it("requires the technique, not just the answer", () => {
      const checks: LabCheck[] = [
        { label: "prints it", contains: "login_empty_password" },
        { label: "uses a loop", sourceContains: "for" },
      ];

      const hardcoded = gradeLabRun(checks, ran("login_empty_password", 'print("login_empty_password")'));
      expect(hardcoded.passed).toBe(false);

      const looped = gradeLabRun(
        checks,
        ran("login_empty_password", "for name, status in results:\n    print(name)"),
      );
      expect(looped.passed).toBe(true);
    });

    it("bans a shortcut with sourceAbsent", () => {
      const checks: LabCheck[] = [{ label: "no builtin", sourceAbsent: "sorted(" }];
      expect(gradeLabRun(checks, ran("ok", "x = sorted(items)")).passed).toBe(false);
      expect(gradeLabRun(checks, ran("ok", "x = my_sort(items)")).passed).toBe(true);
    });
  });
});
