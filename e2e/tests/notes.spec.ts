import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

/**
 * Notes wiki smoke: the reference library is auth-gated, the module tree routes
 * to a written topic, and search finds it. Pure static content — no DB.
 */

async function signUpFreshLearner(page: Page): Promise<void> {
  const email = `notes-${randomUUID()}@e2e.local`;
  await page.goto("http://localhost:3000/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("a-strong-password-1");
  await expect(async () => {
    await page.getByRole("button", { name: /start learning free/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 4000 });
  }).toPass({ timeout: 20_000 });
}

test.describe("notes wiki", () => {
  test("anonymous visitor is redirected to login", async ({ page }) => {
    await page.goto("http://localhost:3000/notes");
    await expect(page).toHaveURL(/\/login/);
  });

  test("browse module → topic, and search finds a topic", async ({ page }) => {
    await signUpFreshLearner(page);

    await page.goto("http://localhost:3000/notes");
    await expect(page.getByRole("heading", { name: /notes wiki/i })).toBeVisible();

    // Drill into Foundations → a written topic.
    await page.getByTestId("notes-module-foundations").click();
    await expect(page).toHaveURL(/\/notes\/foundations/);
    await page.getByTestId("notes-topic-what-is-qa").click();
    await expect(page.getByRole("heading", { name: /what is qa\?/i })).toBeVisible();
    await expect(page.getByText(/quality assurance/i).first()).toBeVisible();

    // Search finds a topic by keyword.
    await page.goto("http://localhost:3000/notes");
    await page.getByTestId("notes-search").fill("pyramid");
    await expect(page.getByTestId("notes-search-hit").first()).toBeVisible({ timeout: 5000 });
  });
});
