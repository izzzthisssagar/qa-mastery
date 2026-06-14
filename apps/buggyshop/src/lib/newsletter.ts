import { bugFlag, type Release } from "@qa-mastery/shared";

/**
 * Is a newsletter subscription allowed to go through?
 *
 * The correct rule: only when the "I accept the terms" checkbox is checked —
 * regardless of how many times the Subscribe button is clicked.
 *
 * BS-004 (active in v1.0): the buggy branch has a debounce/guard gap where a
 * double-click slips past the unchecked-terms gate. `termsChecked || isDoubleClick`
 * means a double-click subscribes even with the terms still unchecked.
 */
export function submissionAllowed(
  termsChecked: boolean,
  isDoubleClick: boolean,
  release: Release,
): boolean {
  return bugFlag("BS-004", release) ? termsChecked || isDoubleClick : termsChecked;
}
