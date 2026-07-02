import { describe, expect, it } from "vitest";
import {
  matchApiBugReport,
  type ApiBugReportInput,
  type ApiManifestBug,
} from "../src/api-bug-report";

const MANIFEST: ApiManifestBug[] = [
  {
    id: "BA-002",
    surface: "rest",
    endpoint: "POST /v1/tickets",
    category: "wrong-status-code",
    severity: "minor",
    points: 10,
    titleInternal: "Create returns 200 instead of 201",
    expected: "201 Created",
  },
  {
    id: "BA-003",
    surface: "rest",
    endpoint: "GET /v1/tickets",
    category: "filtering",
    severity: "major",
    points: 15,
    titleInternal: "status filter silently dropped when combined with priority",
    expected: "Both filters apply",
  },
];

function report(overrides: Partial<ApiBugReportInput> = {}): ApiBugReportInput {
  return {
    surface: "rest",
    endpoint: "POST /v1/tickets",
    category: "wrong-status-code",
    severity: "minor",
    title: "Create ticket responds 200",
    steps: ["POST /v1/tickets", "observe status"],
    expected: "201",
    actual: "200",
    ...overrides,
  };
}

describe("matchApiBugReport", () => {
  it("full score on exact surface+endpoint+category+severity", () => {
    const outcome = matchApiBugReport(report(), MANIFEST);
    expect(outcome.matched?.id).toBe("BA-002");
    expect(outcome.score).toBe(10);
    expect(outcome.duplicate).toBe(false);
  });

  it("no match on the wrong endpoint", () => {
    const outcome = matchApiBugReport(report({ endpoint: "GET /v1/me" }), MANIFEST);
    expect(outcome.matched).toBeNull();
    expect(outcome.score).toBe(0);
  });

  it("no match when the surface differs (graphql report on a rest bug)", () => {
    const outcome = matchApiBugReport(report({ surface: "graphql" }), MANIFEST);
    expect(outcome.matched).toBeNull();
  });

  it("category miss halves the score", () => {
    const outcome = matchApiBugReport(report({ category: "validation" }), MANIFEST);
    expect(outcome.matched?.id).toBe("BA-002");
    expect(outcome.score).toBe(5);
  });

  it("adjacent severity applies the near multiplier", () => {
    const outcome = matchApiBugReport(report({ severity: "major" }), MANIFEST);
    expect(outcome.score).toBe(8);
  });

  it("far severity applies the far multiplier", () => {
    const outcome = matchApiBugReport(report({ severity: "blocker" }), MANIFEST);
    expect(outcome.score).toBe(5);
  });

  it("duplicates score 0", () => {
    const outcome = matchApiBugReport(report(), MANIFEST, new Set(["BA-002"]));
    expect(outcome.duplicate).toBe(true);
    expect(outcome.score).toBe(0);
  });

  it("never leaks titleInternal in feedback", () => {
    const outcome = matchApiBugReport(report(), MANIFEST);
    for (const line of outcome.feedback) {
      expect(line).not.toContain("Create returns 200");
    }
  });
});
