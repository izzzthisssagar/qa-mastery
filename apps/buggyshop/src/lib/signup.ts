import { bugFlag, type Release } from "@qa-mastery/shared";

/**
 * Correct-enough email check: one `@`, a domain with no consecutive dots, and a
 * TLD. Rejects the invalid-class inputs an equivalence-partitioning tester
 * would try (double `@`, `..`, missing TLD).
 */
const STRICT_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/**
 * BS-001 (v1.0): the regex is far too lax — it only checks "something, an `@`,
 * something, a dot, something", so `user@@domain..com` sails through. This is
 * the bug the A3.2 equivalence-partitioning lab hunts.
 */
const LAX_EMAIL = /^.+@.+\..+$/;

export function isEmailAccepted(email: string, release: Release): boolean {
  const pattern = bugFlag("BS-001", release) ? LAX_EMAIL : STRICT_EMAIL;
  return pattern.test(email.trim());
}
