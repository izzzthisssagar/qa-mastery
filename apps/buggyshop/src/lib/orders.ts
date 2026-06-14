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

export type PaymentStatus = "Paid" | "Pending";

/**
 * The payment status shown for an order. A delivered (or shipped) order must
 * have been paid, so it should read "Paid".
 *
 * BS-015 (active in v1.0): a state mismatch — a Delivered order still shows its
 * payment as "Pending", so fulfillment and payment disagree.
 */
export function paymentStatusFor(fulfillment: OrderStatus, release: Release): PaymentStatus {
  if (bugFlag("BS-015", release) && fulfillment === "Delivered") return "Pending";
  if (fulfillment === "Placed" || fulfillment === "Cancelled") return "Pending";
  return "Paid";
}
