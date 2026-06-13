import { bugFlag, type Release } from "@qa-mastery/shared";

/**
 * Correct shipping ZIP/postal-code check: digits only, 4–6 of them. Rejects the
 * invalid-class inputs a tester would try (letters, symbols, wrong length).
 */
const DIGITS_ZIP = /^[0-9]{4,6}$/;

/**
 * BS-016 (v1.0): the pattern is alphanumeric, so a code with letters like
 * "AB12C" is wrongly accepted. The ZIP field must accept digits only — this is
 * the validation bug behind the A3.2 checkout lesson.
 */
const ALNUM_ZIP = /^[A-Za-z0-9]{4,6}$/;

export function isZipAccepted(zip: string, release: Release): boolean {
  const pattern = bugFlag("BS-016", release) ? ALNUM_ZIP : DIGITS_ZIP;
  return pattern.test(zip.trim());
}
