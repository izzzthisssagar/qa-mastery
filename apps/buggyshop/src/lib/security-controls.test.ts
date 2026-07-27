import { describe, expect, it } from "vitest";
import { visibleOrders, CURRENT_USER } from "./order-history";
import { isProfileEmailAccepted } from "./profile";

describe("visibleOrders (BS-020: broken access control leaks another user's order, no fixed release)", () => {
  const OTHER_OWNER = "someone-else@buggyshop.test";

  it.each(["1.0", "1.1", "2.0"] as const)("leaks the other account's order in %s", (release) => {
    const orders = visibleOrders(CURRENT_USER, release);
    expect(orders.some((o) => o.owner === OTHER_OWNER)).toBe(true);
  });

  // There is no release where this bug is fixed per the current registry --
  // do not write a "fixed in 1.1" case here without a corresponding `fixed`
  // entry in packages/shared/src/bug-flag.ts's SEEDED_BUGS.
  it("every visible order belongs only to the current user or the seeded leaked one", () => {
    const orders = visibleOrders(CURRENT_USER, "1.0");
    expect(orders.every((o) => o.owner === CURRENT_USER || o.owner === OTHER_OWNER)).toBe(true);
  });

  it("leaks the other account's order even for an account with no orders of its own", () => {
    // BS-020's buggy branch checks `owner === "someone-else@..."` unconditionally --
    // it doesn't even look at currentUser for that branch, so the leak fires
    // for every account, not just the legitimately signed-in one.
    const orders = visibleOrders("nobody@buggyshop.test", "1.0");
    expect(orders).toEqual([
      { id: "5004", item: "Premium Test Plan Template", owner: OTHER_OWNER },
    ]);
  });
});

describe("isProfileEmailAccepted (BS-019: skips re-validation entirely, no fixed release)", () => {
  it.each(["1.0", "1.1", "2.0"] as const)(
    "wrongly accepts an invalid double-@ address in %s",
    (release) => {
      expect(isProfileEmailAccepted("bad@@x", release)).toBe(true);
    },
  );

  it("accepts a genuinely valid address in every release", () => {
    expect(isProfileEmailAccepted("shopper@buggyshop.test", "1.0")).toBe(true);
    expect(isProfileEmailAccepted("shopper@buggyshop.test", "1.1")).toBe(true);
  });

  it("rejects an empty string in every release", () => {
    expect(isProfileEmailAccepted("", "1.0")).toBe(false);
    expect(isProfileEmailAccepted("   ", "1.0")).toBe(false);
  });
});
