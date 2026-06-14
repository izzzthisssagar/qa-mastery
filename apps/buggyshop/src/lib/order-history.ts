import { bugFlag, type Release } from "@qa-mastery/shared";

export interface HistoryOrder {
  id: string;
  item: string;
  owner: string;
}

/** The account whose order history this page renders. */
export const CURRENT_USER = "shopper@buggyshop.test";

/**
 * The full seeded set of order-history rows. Most belong to the signed-in
 * shopper; one belongs to a DIFFERENT account on purpose, so the access-control
 * filter has something to (correctly) exclude.
 */
const ALL_ORDERS: HistoryOrder[] = [
  { id: "5001", item: "QA Sticker Pack", owner: "shopper@buggyshop.test" },
  { id: "5002", item: "Tester Mug", owner: "shopper@buggyshop.test" },
  { id: "5003", item: "Boundary Hoodie", owner: "shopper@buggyshop.test" },
  { id: "5004", item: "Premium Test Plan Template", owner: "someone-else@buggyshop.test" },
];

/**
 * The orders that should be visible to `currentUser`. The rule is simple: an
 * account may only see ITS OWN orders, so the list is filtered to rows where
 * `owner === currentUser`.
 *
 * BS-020 (active in v1.0): the buggy branch drops that ownership check and also
 * returns an order belonging to a different account — a data leak / broken
 * access control. The buggy branch lives behind `bugFlag` so the same code can
 * serve a later fixed release.
 */
export function visibleOrders(currentUser: string, release: Release): HistoryOrder[] {
  if (bugFlag("BS-020", release)) {
    return ALL_ORDERS.filter(
      (order) => order.owner === currentUser || order.owner === "someone-else@buggyshop.test",
    );
  }
  return ALL_ORDERS.filter((order) => order.owner === currentUser);
}
