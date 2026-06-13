import { describe, expect, it } from "vitest";
import { bugFlag, isBugActive, SEEDED_BUGS, type SeededBugSpec } from "../src/bug-flag";

describe("isBugActive (release window)", () => {
  it("is inactive before the introduced release", () => {
    const spec: SeededBugSpec = { introduced: "1.1" };
    expect(isBugActive(spec, "1.0")).toBe(false);
  });

  it("is active from the introduced release onward when never fixed", () => {
    const spec: SeededBugSpec = { introduced: "1.0" };
    expect(isBugActive(spec, "1.0")).toBe(true);
    expect(isBugActive(spec, "1.1")).toBe(true);
    expect(isBugActive(spec, "2.0")).toBe(true);
  });

  it("is inactive from the fixed release onward", () => {
    const spec: SeededBugSpec = { introduced: "1.0", fixed: "1.1" };
    expect(isBugActive(spec, "1.0")).toBe(true);
    expect(isBugActive(spec, "1.1")).toBe(false);
    expect(isBugActive(spec, "2.0")).toBe(false);
  });
});

describe("bugFlag (registry)", () => {
  it("BS-008 is active in 1.0 and fixed from 1.1", () => {
    expect(bugFlag("BS-008", "1.0")).toBe(true);
    expect(bugFlag("BS-008", "1.1")).toBe(false);
    expect(bugFlag("BS-008", "2.0")).toBe(false);
  });

  it("matches the registry spec for BS-008", () => {
    expect(SEEDED_BUGS["BS-008"]).toEqual({ introduced: "1.0", fixed: "1.1" });
  });

  it("BS-001 is active across all releases (never fixed in the 1.x line)", () => {
    expect(bugFlag("BS-001", "1.0")).toBe(true);
    expect(bugFlag("BS-001", "1.1")).toBe(true);
    expect(bugFlag("BS-001", "2.0")).toBe(true);
  });

  it("unknown bug ids are never active", () => {
    expect(bugFlag("BS-999", "1.0")).toBe(false);
    expect(bugFlag("not-a-bug", "2.0")).toBe(false);
  });
});
