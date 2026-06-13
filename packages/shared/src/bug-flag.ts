/**
 * Seeded-bug feature flags. Every deliberately-planted BuggyShop bug lives
 * behind `bugFlag('BS-###', release)` so one codebase serves all three releases
 * and a bug can be "fixed" in a later release to drive retest lessons — without
 * touching content. Never inline bug logic without this wrapper (invariant 7).
 *
 * See ../../My Qa Projecct/Product/BuggyShop-Spec.md for the full manifest.
 */
import { RELEASES, type Release } from "./releases";

export interface SeededBugSpec {
  /** First release the bug ships in. */
  introduced: Release;
  /** Release the bug is fixed in (active up to, but not including, this). */
  fixed?: Release;
}

/**
 * Registry of seeded bugs and the release window each is active in. Add an
 * entry here the moment its conditional lands behind `bugFlag` in BuggyShop —
 * an id with no entry is never active, so a half-built bug stays dormant.
 */
export const SEEDED_BUGS = {
  // BS-008 — product-list price filter excludes the item priced exactly at the
  // max (uses `<` where it should use `<=`). Fixed in v1.1 so the A5 retest
  // lessons have a genuine "verify the fix" to do.
  "BS-008": { introduced: "1.0", fixed: "1.1" },
} as const satisfies Record<string, SeededBugSpec>;

export type SeededBugId = keyof typeof SEEDED_BUGS;

const releaseOrder = (r: Release): number => RELEASES.indexOf(r);

/** Pure predicate: is a bug with this spec active in `release`? Exported for
 *  testing the window logic independently of the registry. */
export function isBugActive(spec: SeededBugSpec, release: Release): boolean {
  if (releaseOrder(release) < releaseOrder(spec.introduced)) return false;
  if (spec.fixed && releaseOrder(release) >= releaseOrder(spec.fixed)) return false;
  return true;
}

/** Is seeded bug `id` active for `release`? Unknown ids are never active. */
export function bugFlag(id: string, release: Release): boolean {
  const spec = (SEEDED_BUGS as Record<string, SeededBugSpec>)[id];
  return spec ? isBugActive(spec, release) : false;
}
