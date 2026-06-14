import { describe, expect, it } from "vitest";
import { gradeCapstone, isShipRecommendation, type CapstoneInput } from "../src/capstone";

const PASSING: CapstoneInput = {
  scope: "In: coupon apply/remove/validate at checkout. Out: payment gateway.",
  risks: "Discount could go negative\nCoupon stacks with a sale\nExpired code still applies",
  approach: "Boundary analysis on the $20 threshold and a decision table per coupon type.",
  recommendation: "go-with-conditions",
};

describe("gradeCapstone", () => {
  it("scores a complete, well-formed plan 100", () => {
    const result = gradeCapstone(PASSING);
    expect(result.score).toBe(100);
    expect(result.checklist.every((c) => c.passed)).toBe(true);
  });

  it("trims inputs and returns them normalised for persistence", () => {
    const result = gradeCapstone({ ...PASSING, scope: `   ${PASSING.scope}   ` });
    expect(result.normalized.scope).toBe(PASSING.scope);
  });

  it("fails the scope check when it is too short to be a real statement", () => {
    const result = gradeCapstone({ ...PASSING, scope: "coupons" });
    const scopeCheck = result.checklist.find((c) => c.label.startsWith("Scope"));
    expect(scopeCheck?.passed).toBe(false);
    expect(result.score).toBe(75);
  });

  it("requires at least three risks, counting non-empty lines only", () => {
    const twoRisks = gradeCapstone({ ...PASSING, risks: "Risk one\n\n   \nRisk two" });
    expect(twoRisks.checklist.find((c) => c.label.includes("risks"))?.passed).toBe(false);

    const threeRisks = gradeCapstone({ ...PASSING, risks: "a\nb\nc" });
    expect(threeRisks.checklist.find((c) => c.label.includes("risks"))?.passed).toBe(true);
  });

  it("only passes the approach check when a recognised technique is named", () => {
    const vague = gradeCapstone({ ...PASSING, approach: "I will test everything carefully." });
    expect(vague.checklist.find((c) => c.label.includes("technique"))?.passed).toBe(false);

    for (const phrase of [
      "equivalence partitioning",
      "boundary value analysis",
      "a decision-table",
      "state transition coverage",
      "some error guessing",
    ]) {
      const r = gradeCapstone({ ...PASSING, approach: phrase });
      expect(r.checklist.find((c) => c.label.includes("technique"))?.passed).toBe(true);
    }
  });

  it("a blank plan with only a recommendation scores 25 (one of four checks)", () => {
    const result = gradeCapstone({ scope: "", risks: "", approach: "", recommendation: "go" });
    expect(result.score).toBe(25);
    expect(result.checklist.filter((c) => c.passed)).toHaveLength(1);
  });
});

describe("isShipRecommendation", () => {
  it("accepts the three valid recommendations and rejects others", () => {
    expect(isShipRecommendation("go")).toBe(true);
    expect(isShipRecommendation("no-go")).toBe(true);
    expect(isShipRecommendation("go-with-conditions")).toBe(true);
    expect(isShipRecommendation("maybe")).toBe(false);
    expect(isShipRecommendation("")).toBe(false);
  });
});
