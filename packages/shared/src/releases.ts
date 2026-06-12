/**
 * BuggyShop release versions (see Product/BuggyShop-Spec.md in the notes repo).
 * v1.0 = core app + BS-001…020 · v1.1 = wishlist + regressions · v2.0 = coupons + capstone.
 */
export const RELEASES = ["1.0", "1.1", "2.0"] as const;

export type Release = (typeof RELEASES)[number];

export const DEFAULT_RELEASE: Release = "1.0";

export function isRelease(value: string): value is Release {
  return (RELEASES as readonly string[]).includes(value);
}
