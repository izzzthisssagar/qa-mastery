import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";

/**
 * Shared signup for every suite. NOT a *.spec file, so Playwright doesn't
 * collect it.
 *
 * Sign up a fresh learner via the UI and land on /dashboard (local Supabase
 * has confirmations off, so signup yields a live session). The fills live
 * INSIDE the retry: an interaction that lands before React hydrates never
 * reaches component state (see docs/known-issues/webkit-save-stall.md), so
 * retrying only the click would resubmit an empty form forever — even in prod
 * builds, hydration loses the race on a starved CI runner. The URL guard
 * keeps a retry from re-filling after a slow-but-successful submit has
 * already left /signup.
 */
export async function signUpFreshLearner(page: Page, prefix = "learner"): Promise<string> {
  const email = `${prefix}-${randomUUID()}@e2e.local`;
  await page.goto("http://localhost:3000/signup");
  await expect(async () => {
    if (!/\/dashboard/.test(page.url())) {
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill("a-strong-password-1");
      await page.getByRole("button", { name: /start learning free/i }).click();
    }
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 4000 });
  }).toPass({ timeout: 20_000 });
  return email;
}
