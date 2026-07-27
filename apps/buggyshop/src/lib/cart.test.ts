import { describe, expect, it } from "vitest";
import { shippingLabel } from "./cart";

describe("shippingLabel", () => {
  describe("v1.0 (BS-012 active: >= instead of > at the $999 boundary)", () => {
    it("wrongly grants free shipping at exactly $999", () => {
      expect(shippingLabel(999, "1.0")).toBe("Free");
    });
    it("still charges below the boundary", () => {
      expect(shippingLabel(998.99, "1.0")).toBe("$12.00");
    });
    it("still grants free shipping above the boundary", () => {
      expect(shippingLabel(1000, "1.0")).toBe("Free");
    });
  });

  // BS-012 has no `fixed` release in the seeded registry -- it is never
  // corrected in the 1.x/2.x line. A future test suite must not assume v1.1
  // fixes it; assert the actual (still-buggy) behavior instead.
  describe("v1.1 and v2.0 (BS-012 has no fixed release -- still active)", () => {
    it.each(["1.1", "2.0"] as const)(
      "still wrongly grants free shipping at exactly $999 in %s",
      (release) => {
        expect(shippingLabel(999, release)).toBe("Free");
      },
    );
  });
});
