import { bugFlag, type Release } from "@qa-mastery/shared";

/** The states a BuggyShop order moves through, in order. */
export type OrderStatus = "Placed" | "Paid" | "Shipped" | "Delivered" | "Cancelled";

/**
 * Can an order in `status` still be cancelled? The rule is that cancellation is
 * only allowed BEFORE the order ships — i.e. while it is still "Placed" or
 * "Paid". Once it is "Shipped" (or later) the transition is invalid.
 *
 * BS-014 (active in v1.0): the buggy branch also returns true for "Shipped", so
 * the UI lets a shipped order be cancelled — an invalid state transition. The
 * buggy branch lives behind `bugFlag` so the same code can serve a later fixed
 * release.
 */
export function canCancel(status: OrderStatus, release: Release): boolean {
  if (bugFlag("BS-014", release)) {
    return status === "Placed" || status === "Paid" || status === "Shipped";
  }
  return status === "Placed" || status === "Paid";
}
