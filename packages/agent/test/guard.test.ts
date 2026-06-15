import { describe, expect, it } from "vitest";
import { guardResponse, wouldGuard } from "../src/guard";

describe("guardResponse — manifest leaks (every turn)", () => {
  for (const turn of [1, 3]) {
    it(`scrubs internal manifest field names on turn ${turn}`, () => {
      expect(guardResponse("The title_internal is X", turn)).not.toContain("title_internal");
      expect(guardResponse("see repro_steps_internal", turn)).not.toContain("repro_steps_internal");
      expect(guardResponse("matchedBugId: BS-008", turn)).not.toContain("matchedBugId");
    });
  }
});

describe("guardResponse — quiz answers (first turn only)", () => {
  const leaks = [
    "The correct answer is the second one.",
    "Option B is correct.",
    "Choose option C for this.",
    "The right choice is the boundary set.",
    "Go with the second option here.",
  ];

  it("scrubs answer give-aways on the first reply", () => {
    for (const leak of leaks) {
      expect(guardResponse(leak, 1)).not.toEqual(leak);
    }
  });

  it("allows the same discussion on later turns (post-attempt)", () => {
    for (const leak of leaks) {
      expect(guardResponse(leak, 2)).toEqual(leak);
    }
  });

  it("does not trip on normal teaching language", () => {
    const clean = "There's no single correct answer in exploratory testing — it depends on risk.";
    expect(guardResponse(clean, 1)).toEqual(clean);
    expect(wouldGuard(clean, 1)).toBe(false);
  });
});

describe("wouldGuard", () => {
  it("flags content the guard would scrub", () => {
    expect(wouldGuard("matchedBugId here", 3)).toBe(true);
    expect(wouldGuard("Option A is correct", 1)).toBe(true);
    expect(wouldGuard("Let's reason about boundaries.", 1)).toBe(false);
  });
});
