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
 * Filter the catalog by a name search.
 *
 * BS-010 (active in v1.0): the query is NOT trimmed, so a stray leading/trailing
 * space (" mug") matches nothing even though "mug" would.
 */
export function searchByName(products: Product[], query: string, release: Release): Product[] {
  const q = bugFlag("BS-010", release) ? query : query.trim();
  if (q === "") return products;
  const needle = q.toLowerCase();
  return products.filter((p) => p.name.toLowerCase().includes(needle));
}

export type SortDir = "none" | "asc";

/**
 * Sort the catalog by price ascending.
 *
 * BS-009 (active in v1.0): the comparison is done on the price as TEXT, so the
 * order comes out "100, 12, 18, ... 5, 7, 89" instead of numeric — the classic
 * "1000 < 200 < 30" string-sort bug.
 */
export function sortByPrice(products: Product[], dir: SortDir, release: Release): Product[] {
  if (dir === "none") return products;
  const sorted = [...products];
  if (bugFlag("BS-009", release)) {
    sorted.sort((a, b) => String(a.price).localeCompare(String(b.price)));
  } else {
    sorted.sort((a, b) => a.price - b.price);
  }
  return sorted;
}

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/**
 * Is a quantity acceptable to add to the cart?
 *
 * BS-007 (active in v1.0, fixed in v1.1): the check uses `>= 0`, so a quantity
 * of 0 is wrongly accepted and adds a $0 line item. The correct rule requires
 * at least 1.
 */
export function isQuantityAccepted(qty: number, release: Release): boolean {
  if (!Number.isInteger(qty)) return false;
  return bugFlag("BS-007", release) ? qty >= 0 : qty >= 1;
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

const RELEASE_STORAGE_KEY = "bs-release";

/**
 * The release the shopper is currently browsing. An explicit override (set by
 * the release switcher) wins, then the sandbox session's release, then the
 * default. Lets a learner flip between v1.0 and a later release to retest fixes.
 */
export function readRelease(): Release {
  if (typeof window === "undefined") return DEFAULT_RELEASE;
  const override = localStorage.getItem(RELEASE_STORAGE_KEY);
  if (override && isRelease(override)) return override;
  return getActiveRelease(localStorage.getItem("bs-session"));
}

export function setRelease(release: Release): void {
  if (typeof window !== "undefined") localStorage.setItem(RELEASE_STORAGE_KEY, release);
}
