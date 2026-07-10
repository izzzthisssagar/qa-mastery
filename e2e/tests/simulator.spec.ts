import { expect, test, type Page } from "@playwright/test";
import { signUpFreshLearner as sharedSignUp } from "./signup-helper";

/**
 * Coding-simulator smoke. Verifies the page is auth-gated, renders the Monaco
 * editor + language picker, and swaps the starter snippet when the language
 * changes. It deliberately does NOT click Run — execution hits the live Wandbox
 * API, which we keep out of CI (network + shared rate limit). The runner logic
 * is covered by unit tests (wandbox-runner.test.ts).
 */

async function signUpFreshLearner(page: Page): Promise<void> {
  await sharedSignUp(page, "sim");
}

test.describe("coding simulator", () => {
  test("anonymous visitor is redirected to login", async ({ page }) => {
    await page.goto("http://localhost:3000/simulator");
    await expect(page).toHaveURL(/\/login/);
  });

  test("renders the editor and swaps starters on language change", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.goto("http://localhost:3000/simulator");

    await expect(page.getByRole("heading", { name: /coding simulator/i })).toBeVisible();

    const langSelect = page.getByTestId("simulator-language");
    await expect(langSelect).toBeVisible();
    await expect(page.getByTestId("simulator-run")).toBeVisible();

    // Monaco renders its text into the DOM; the Java starter is the default.
    const editor = page.locator(".monaco-editor");
    await expect(editor).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).toContainText("public class Main");

    // Switching to Python replaces the untouched starter buffer.
    await langSelect.selectOption("python");
    await expect(page.locator("body")).toContainText('print("Hello, QA!")');
  });
});
