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

  // Hydration gate. Interactions that land before React hydrates are silently
  // lost: the input shows the text but component state stays empty, so the
  // save fails handle validation and "Saved." never appears — the intermittent
  // "WebKit save stall" (docs/known-issues/webkit-save-stall.md). The chip's
  // aria-pressed is rendered from React state, so once a click sticks the page
  // is interactive and the fill below reliably reaches state.
  const chip = page.getByRole("button", { name: /^functional$/i }); // pick a specialty chip
  await expect(async () => {
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true", { timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
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
