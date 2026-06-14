import { bugFlag, type Release } from "@qa-mastery/shared";

/**
 * The one hardcoded demo account. BuggyShop auth is fake (invariant 3) — login
 * is a curriculum subject, not real identity — so a single known-good user is
 * enough to exercise the happy path and the seeded failure-message bug.
 */
const DEMO_EMAIL = "shopper@buggyshop.test";
// Fake practice-app credential — BuggyShop auth is a curriculum subject, not real
// identity (invariant 3). Not a secret. gitleaks:allow
const DEMO_PASSWORD = "password1";

export interface AuthResult {
  ok: boolean;
  message: string;
}

/**
 * Authenticate against the demo user.
 *
 * BS-006 (v1.0): on any failed login a correct app returns a single generic
 * "Incorrect email or password" so an attacker can't tell which field was
 * wrong. The buggy branch instead returns "User does not exist" — an
 * information-leak / misleading message that confirms whether an email is
 * registered (and misleads a real user who typed the right email but a wrong
 * password). The bug lives behind `bugFlag` so the fixed release reuses this
 * same code.
 */
export function authenticate(email: string, password: string, release: Release): AuthResult {
  const normalized = email.trim().toLowerCase();
  if (normalized === DEMO_EMAIL && password === DEMO_PASSWORD) {
    return { ok: true, message: "Welcome back!" };
  }
  return {
    ok: false,
    message: bugFlag("BS-006", release) ? "User does not exist" : "Incorrect email or password",
  };
}

/**
 * Does the "Remember me" preference actually get honored?
 *
 * BS-006 covers the failure message; BS-005 (v1.0) lives here: the login page
 * offers a "Remember me" checkbox that promises to keep you signed in, but the
 * buggy branch silently drops the preference — `rememberMeHonored` always
 * returns false no matter what the user ticked, so a checked box has no effect.
 * A correct app returns the box's own value (ticked → honored). The bug lives
 * behind `bugFlag` so the fixed release reuses this same code.
 */
export function rememberMeHonored(checked: boolean, release: Release): boolean {
  if (bugFlag("BS-005", release)) return false;
  return checked;
}
