import { DEFAULT_RELEASE, bugFlag, isRelease, type Release } from "@qa-mastery/shared";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

/**
 * Static demo catalog. Products are the same for every learner (not per-sandbox
 * data), so they don't live in the bs_* tables. Prices are chosen so the
 * max-price filter has a clean boundary case at $100 — the item priced exactly
 * at the max is where BS-008 hides.
 */
export const PRODUCTS: Product[] = [
  { id: "qa-sticker-pack", name: "QA Sticker Pack", price: 5, category: "Swag" },
  { id: "flaky-test-dice", name: "Flaky Test Dice", price: 7, category: "Swag" },
  { id: "tester-mug", name: "Tester Mug", price: 12, category: "Drinkware" },
  { id: "selenium-sippy-cup", name: "Selenium Sippy Cup", price: 18, category: "Drinkware" },
  { id: "bug-net-tote", name: "Bug Net Tote", price: 25, category: "Bags" },
  { id: "boundary-hoodie", name: "Boundary Hoodie", price: 49, category: "Apparel" },
  { id: "regression-runners", name: "Regression Runner Sneakers", price: 89, category: "Apparel" },
  { id: "premium-test-plan", name: "Premium Test Plan Template", price: 100, category: "Templates" },
];

/**
 * Filter the catalog to products at or below `maxPrice`.
 *
 * BS-008 (active in v1.0, fixed in v1.1): the comparison uses `<` where it
 * should use `<=`, so the item priced exactly at the max is wrongly excluded —
 * a classic off-by-one at the boundary. The buggy branch lives behind
 * `bugFlag` so the same code serves the fixed v1.1 release.
 */
export function filterByMaxPrice(
  products: Product[],
  maxPrice: number | null,
  release: Release,
): Product[] {
  if (maxPrice === null || Number.isNaN(maxPrice)) return products;
  return bugFlag("BS-008", release)
    ? products.filter((p) => p.price < maxPrice)
    : products.filter((p) => p.price <= maxPrice);
}

/**
 * The active sandbox release. Reads it from the session token's `release` claim
 * when present (set during the /enter handoff), else the default. Decoding the
 * unverified payload is fine here — the release only chooses which bugs render,
 * not anything trusted.
 */
export function getActiveRelease(sessionToken: string | null): Release {
  if (!sessionToken) return DEFAULT_RELEASE;
  try {
    const [, payload] = sessionToken.split(".");
    const claims = JSON.parse(atob(payload)) as { release?: string };
    return claims.release && isRelease(claims.release) ? claims.release : DEFAULT_RELEASE;
  } catch {
    return DEFAULT_RELEASE;
  }
}
