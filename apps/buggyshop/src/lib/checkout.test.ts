import { describe, expect, it } from "vitest";
import { isZipAccepted } from "./checkout";

describe("isZipAccepted", () => {
  it("accepts a valid digits-only ZIP in every release", () => {
    expect(isZipAccepted("12345", "1.0")).toBe(true);
    expect(isZipAccepted("12345", "1.1")).toBe(true);
    expect(isZipAccepted("12345", "2.0")).toBe(true);
  });

  it("rejects a ZIP that is too short or too long regardless of release", () => {
    expect(isZipAccepted("123", "1.0")).toBe(false);
    expect(isZipAccepted("1234567", "1.0")).toBe(false);
  });

  // BS-016's registry entry is `{ introduced: "1.0" }` with NO `fixed` field --
  // the seeded-bug window logic (isBugActive) treats a bug with no `fixed`
  // release as active forever. Letters in the ZIP are wrongly accepted in
  // EVERY release, including 1.1 and 2.0. A prior interrupted draft
  // apparently assumed 1.1 fixes this -- it doesn't, per the current
  // registry, and this suite must reflect the real behavior, not the wrong
  // assumption.
  describe("BS-016 (no fixed release in the registry -- active in every release)", () => {
    it.each(["1.0", "1.1", "2.0"] as const)(
      "wrongly accepts letters in the ZIP in release %s",
      (release) => {
        expect(isZipAccepted("AB12C", release)).toBe(true);
      },
    );
  });

  it("trims surrounding whitespace before validating in every release", () => {
    expect(isZipAccepted("  12345  ", "1.0")).toBe(true);
  });
});
