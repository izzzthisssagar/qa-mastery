import { describe, expect, it } from "vitest";
import { apiBugFlag, IMPLEMENTED_BUGS } from "./bugs";

describe("apiBugFlag", () => {
  it("is false in clean mode for every implemented bug", () => {
    for (const bugId of IMPLEMENTED_BUGS) {
      expect(apiBugFlag(bugId, "clean")).toBe(false);
    }
  });

  it("is true in bughunt mode for every implemented bug", () => {
    for (const bugId of IMPLEMENTED_BUGS) {
      expect(apiBugFlag(bugId, "bughunt")).toBe(true);
    }
  });

  it("is false in bughunt mode for a bug id not in the registry", () => {
    expect(apiBugFlag("BA-999", "bughunt")).toBe(false);
  });
});

describe("IMPLEMENTED_BUGS", () => {
  it("lists the five currently-implemented BuggyAPI bugs", () => {
    expect([...IMPLEMENTED_BUGS].sort()).toEqual([
      "BA-001",
      "BA-002",
      "BA-003",
      "BA-004",
      "BA-005",
    ]);
  });
});
