import { expect, test, type Page } from "@playwright/test";
import { signUpFreshLearner as sharedSignUp } from "./signup-helper";

/**
 * Notes wiki smoke: the reference library is auth-gated, the module tree routes
 * to a written topic, and search finds it. Pure static content — no DB.
 */

async function signUpFreshLearner(page: Page): Promise<void> {
  await sharedSignUp(page, "notes");
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

    // Drill into QA foundations → a written topic.
    await page.getByTestId("notes-module-qa-foundations").click();
    await expect(page).toHaveURL(/\/notes\/qa-foundations/);
    await page.getByTestId("notes-topic-qa-vs-qc-vs-testing").click();
    await expect(page.getByRole("heading", { name: /qa vs qc vs testing/i })).toBeVisible();
    await expect(page.getByText(/quality assurance/i).first()).toBeVisible();

    // Search finds a topic by keyword.
    await page.goto("http://localhost:3000/notes");
    await page.getByTestId("notes-search").fill("pyramid");
    await expect(page.getByTestId("notes-search-hit").first()).toBeVisible({ timeout: 5000 });
  });
});
