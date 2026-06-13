import { bugFlag, type Release } from "@qa-mastery/shared";

/**
 * Correct-enough email check for the profile editor: one `@`, a dotted domain
 * with no consecutive dots, and a TLD. Mirrors the spirit of signup's
 * STRICT_EMAIL — it rejects the invalid-class inputs (double `@`, `..`, missing
 * TLD) an equivalence-partitioning tester would try.
 */
const STRICT_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/**
 * Is the edited profile email acceptable to save?
 *
 * BS-019 (v1.0): editing the profile email skips re-validation entirely — the
 * buggy branch accepts any non-empty string, so an invalid address like
 * `bad@@x` is saved over the previously-valid one. The correct branch
 * re-validates with STRICT_EMAIL.
 */
export function isProfileEmailAccepted(email: string, release: Release): boolean {
  const trimmed = email.trim();
  if (bugFlag("BS-019", release)) return trimmed.length > 0;
  return STRICT_EMAIL.test(trimmed);
}
