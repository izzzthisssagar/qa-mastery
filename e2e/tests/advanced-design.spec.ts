import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

/**
 * Track A6 — Advanced Test Design (pairwise + use-case testing). Both lessons
 * are Pro-gated (`free: false`), so the learner upgrades before the pages
 * render. Mirrors the signup helper used across the learn specs.
 *
 * (Promoted from a root-level scratch script: the original visited the lessons
 * without upgrading, which a free learner can't do.)
 */

async function signUpFreshLearner(page: Page): Promise<void> {
  const email = `learner-${randomUUID()}@e2e.local`;
  const password = "a-strong-password-1";

  await page.goto("http://localhost:3000/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await expect(async () => {
    await page.getByRole("button", { name: /start learning free/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 4000 });
  }).toPass({ timeout: 20_000 });
}

async function upgradeToPro(page: Page): Promise<void> {
  await page.goto("http://localhost:3000/dashboard");
  await page.getByTestId("upgrade-pro").click();
  await expect(page.getByTestId("pro-badge")).toBeVisible();
}

test.describe("learn — A6 Advanced Test Design (Pro)", () => {
  test("a Pro learner can open the pairwise and use-case lessons and see their widgets", async ({
    page,
  }) => {
    await signUpFreshLearner(page);
    await upgradeToPro(page);

    // Pairwise (All-Pairs) — renders the PairwiseVisualizer (its parameter
    // grid heading is unique to the widget, unlike the section prose).
    await page.goto("http://localhost:3000/learn/pairwise-testing");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Pairwise (All-Pairs) Testing",
    );
    await expect(
      page.getByRole("heading", { name: /Testing Variables/i }),
    ).toBeVisible();

    // Use Case Testing renders (prose lesson, no widget).
    await page.goto("http://localhost:3000/learn/use-case-testing");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Use Case Testing");
    await expect(page.getByText("The Happy Path").first()).toBeVisible();
  });
});
