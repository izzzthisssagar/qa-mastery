/**
 * The "stripped" bug-report taxonomy: the option universe a learner picks from
 * when filing a report. It deliberately lists every plausible page / feature /
 * category across BuggyShop — NOT just the ones that have seeded bugs — so the
 * dropdowns never reveal where a bug is. The manifest (server-only) is the only
 * thing that knows which combination is buggy.
 */

export const BUG_PAGES = [
  "signup",
  "login",
  "product-list",
  "product-detail",
  "cart",
  "checkout",
  "order-history",
  "profile",
] as const;

export const BUG_FEATURES = [
  "email-validation",
  "password-rules",
  "search",
  "sort",
  "price-filter",
  "product-card",
  "add-to-cart",
  "quantity",
  "cart-totals",
  "shipping",
  "coupon",
  "address-form",
  "payment",
  "order-status",
  "profile-email",
] as const;

export const BUG_CATEGORIES = [
  "functional",
  "boundary",
  "validation",
  "calculation",
  "state-transition",
  "security",
  "ui",
  "regression",
] as const;

export type BugPage = (typeof BUG_PAGES)[number];
export type BugFeature = (typeof BUG_FEATURES)[number];
export type BugCategory = (typeof BUG_CATEGORIES)[number];
