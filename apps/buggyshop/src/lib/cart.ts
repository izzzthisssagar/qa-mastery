import { bugFlag, type Release } from "@qa-mastery/shared";

/** Flat shipping fee charged when the order doesn't qualify for free shipping. */
const FLAT_SHIPPING = "$12.00";

/**
 * The shipping label for a cart subtotal. Free shipping is the promised perk for
 * orders OVER $999 — strictly greater than, so a $999 order still pays shipping.
 *
 * BS-012 (active in v1.0): the qualifying check uses `>=` instead of `>`, so a
 * subtotal of EXACTLY $999 wrongly gets free shipping too — a classic boundary
 * off-by-one. The buggy branch lives behind `bugFlag` so the same code can serve
 * a later fixed release.
 */
export function shippingLabel(subtotal: number, release: Release): "Free" | string {
  const qualifies = bugFlag("BS-012", release) ? subtotal >= 999 : subtotal > 999;
  return qualifies ? "Free" : FLAT_SHIPPING;
}
