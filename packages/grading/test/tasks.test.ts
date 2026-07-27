import { describe, expect, it } from "vitest";
import { gradeTask } from "../src/tasks";

describe("gradeTask", () => {
  it("passes when a single bug threshold is fully met", () => {
    const r = gradeTask({ minValidBugs: 3 }, { validBugReports: 3, testCases: 0 });
    expect(r.passed).toBe(true);
    expect(r.score).toBe(100);
  });

  it("fails and scores partial when under the threshold", () => {
    const r = gradeTask({ minValidBugs: 4 }, { validBugReports: 1, testCases: 0 });
    expect(r.passed).toBe(false);
    expect(r.score).toBe(25);
  });

  it("caps a single requirement's progress at 100%", () => {
    const r = gradeTask({ minTestCases: 2 }, { validBugReports: 0, testCases: 10 });
    expect(r.passed).toBe(true);
    expect(r.score).toBe(100);
  });

  it("requires every threshold met to pass, averages the score", () => {
    const r = gradeTask({ minValidBugs: 4, minTestCases: 2 }, { validBugReports: 4, testCases: 1 });
    // bugs 4/4 = 1.0, tests 1/2 = 0.5 → mean 0.75
    expect(r.passed).toBe(false);
    expect(r.score).toBe(75);
    expect(r.requirements).toHaveLength(2);
  });

  it("treats a criteria-less task as satisfied", () => {
    const r = gradeTask({}, { validBugReports: 0, testCases: 0 });
    expect(r.passed).toBe(true);
    expect(r.score).toBe(100);
    expect(r.requirements).toHaveLength(0);
  });
});
