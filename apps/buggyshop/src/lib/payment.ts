import { bugFlag, type Release } from "@qa-mastery/shared";

export type PayMethod = "card" | "cash";

/**
 * Whether the Card payment method is OFFERED for an order total. The decision
 * table says Card is always available regardless of total, so this returns true
 * for every total — Card is shown on the payment page no matter what.
 */
export function cardOffered(total: number): boolean {
  return total >= 0;
}

/**
 * Submit a payment for an order. Correct behaviour: if a method is offered it
 * must also be accepted, so Card always succeeds.
 *
 * BS-011 (active in v1.0): a decision-table rule conflict. Card is OFFERED for
 * every total (see `cardOffered`), but the submit path refuses Card on orders
 * under $100 — the same condition the offer ignores. So a $50 order shows the
 * Card option yet errors out on submit. The buggy branch lives behind `bugFlag`
 * so the same code can serve a later fixed release.
 */
export function submitPayment(
  total: number,
  method: PayMethod,
  release: Release,
): { ok: boolean; message: string } {
  if (bugFlag("BS-011", release) && method === "card" && total < 100) {
    return { ok: false, message: "Card payment unavailable for orders under $100" };
  }
  return { ok: true, message: "Payment accepted" };
}
