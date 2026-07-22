import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

/**
 * Shared helpers for the Talent (marketplace) e2e specs. NOT a *.spec file, so
 * Playwright doesn't collect it as a suite. The marketplace ships behind
 * TALENT_ENABLED, which the platform webServer sets to "true" (playwright.config).
 */

const BASE = "http://localhost:3000";
const PASSWORD = "a-strong-password-1";

/** A valid handle: ^[a-z0-9-]{3,32}$ */
export function uniqueHandle(): string {
  return `t${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

/** Sign up a fresh learner via the UI (local Supabase has confirmations off, so
 *  signup yields a live session and lands on /dashboard). */
export async function signUp(page: Page): Promise<string> {
  return signUpFreshLearner(page, "talent");
}

/** Create + publish a tester profile with the given handle and one specialty. */
export async function publishTester(page: Page, handle: string): Promise<void> {
  await page.goto(`${BASE}/talent/profile`);

  // ProfileEditor now disables its fields until useHydrated() flips true
  // (data-hydrated="true" on the root), so interactions can't land before
  // React attaches — the pre-hydration lost-keystroke race this used to
  // paper over with a click-and-retry loop is now impossible at the
  // component level (docs/known-issues/webkit-save-stall.md). Wait for the
  // gate directly instead of retrying a chip click.
  await expect(page.locator('[data-hydrated="true"]')).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /^functional$/i }).click(); // pick a specialty chip
  // .first(): hydration can transiently double-render the freshly-navigated
  // page under CI concurrency (docs/known-issues/hydration-double-render.md)
  await page.getByLabel("Handle").first().fill(handle);

  // Save runs a server action against the live DB; give the confirmation
  // cold-start headroom, and fail fast with the real message if the action
  // returns an error instead of silently timing out waiting for "Saved.".
  const saveBtn = page.getByRole("button", { name: /^save profile$/i });
  await saveBtn.click();
  const errorText = page.locator("p.text-red-300");
  await expect(page.getByText(/^saved\.?$/i).or(errorText)).toBeVisible({ timeout: 30_000 });
  if (await errorText.isVisible()) {
    throw new Error(`profile save failed: ${await errorText.textContent()}`);
  }

  await page.getByRole("button", { name: /^publish$/i }).click();
  await expect(page.getByText(/your profile is live/i)).toBeVisible({ timeout: 30_000 });
}
