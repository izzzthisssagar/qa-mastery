import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";

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
  const email = `talent-${randomUUID()}@e2e.local`;
  await page.goto(`${BASE}/signup`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await expect(async () => {
    await page.getByRole("button", { name: /start learning free/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 4000 });
  }).toPass({ timeout: 20_000 });
  return email;
}

/** Create + publish a tester profile with the given handle and one specialty. */
export async function publishTester(page: Page, handle: string): Promise<void> {
  await page.goto(`${BASE}/talent/profile`);
  await page.getByLabel("Handle").fill(handle);
  await page.getByRole("button", { name: /^functional$/i }).click(); // pick a specialty chip
  await page.getByRole("button", { name: /save profile/i }).click();
  await expect(page.getByText(/^saved\.?$/i)).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /^publish$/i }).click();
  await expect(page.getByText(/your profile is live/i)).toBeVisible({ timeout: 10_000 });
}
