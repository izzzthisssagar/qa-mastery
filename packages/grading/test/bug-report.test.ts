import { describe, expect, it } from "vitest";
import {
  matchBugReport,
  type BugReportInput,
  type ManifestBug,
} from "../src/bug-report";

// BS-008 from the BuggyShop spec: price filter excludes the max boundary.
const BS_008: ManifestBug = {
  id: "BS-008",
  release: "1.0",
  page: "product-list",
  feature: "price-filter",
  category: "boundary",
  severity: "major",
  points: 10,
  titleInternal: "Price filter excludes items priced exactly at the max boundary",
  expected: "Filter range is inclusive: items priced exactly at max appear",
};

const MANIFEST: ManifestBug[] = [BS_008];

function report(overrides: Partial<BugReportInput> = {}): BugReportInput {
  return {
    page: "product-list",
    feature: "price-filter",
    category: "boundary",
    severity: "major",
    title: "Max price filter hides items at the boundary",
    steps: ["Open product list", "Set max price to 500", "Item priced 500 disappears"],
    expected: "Items priced exactly at the max are shown",
    actual: "They are hidden",
    ...overrides,
  };
}

describe("matchBugReport", () => {
  it("awards full points for an exact match", () => {
    const outcome = matchBugReport(report(), MANIFEST);
    expect(outcome.matched?.id).toBe("BS-008");
    expect(outcome.duplicate).toBe(false);
    expect(outcome.score).toBe(10);
  });

  it("halves points on category mismatch", () => {
    const outcome = matchBugReport(report({ category: "functional" }), MANIFEST);
    expect(outcome.matched?.id).toBe("BS-008");
    expect(outcome.score).toBe(5);
  });

  it("docks 20% when severity is one level off", () => {
    const outcome = matchBugReport(report({ severity: "critical" }), MANIFEST);
    expect(outcome.score).toBe(8);
  });

  it("scores duplicates as zero", () => {
    const outcome = matchBugReport(report(), MANIFEST, new Set(["BS-008"]));
    expect(outcome.duplicate).toBe(true);
    expect(outcome.score).toBe(0);
  });

  it("returns no match for an unseeded location", () => {
    const outcome = matchBugReport(report({ page: "checkout" }), MANIFEST);
    expect(outcome.matched).toBeNull();
    expect(outcome.score).toBe(0);
  });
});
