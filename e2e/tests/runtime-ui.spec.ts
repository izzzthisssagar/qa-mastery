import { expect, test, type Page } from "@playwright/test";
import { signUpFreshLearner as sharedSignUp } from "./signup-helper";

/**
 * UI-wiring smoke for the help-agent tutor and the code-runner lab. These cover
 * that the surfaces mount and open correctly — NOT the runtime round-trip: the
 * tutor's reply needs an LLM and the code run needs Judge0/Docker, neither of
 * which exists in CI. The guard/validation logic behind them is unit-tested.
 */

async function signUpFreshLearner(page: Page): Promise<void> {
  await sharedSignUp(page, "learner");
}

test.describe("help-agent — UI opens (no LLM)", () => {
  test("the launcher opens an accessible tutor dialog with a labelled input", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.getByRole("button", { name: /open qa tutor/i }).click();
    const dialog = page.getByRole("dialog", { name: /qa tutor/i });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel("Ask the tutor a question")).toBeVisible();
    // closes again
    await page.getByRole("button", { name: /close tutor/i }).click();
    await expect(dialog).toHaveCount(0);
  });
});

test.describe("code runner — lab renders (no Judge0)", () => {
  test("a code-run lesson shows the editor and run control", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.goto("http://localhost:3000/learn/java-setup-first-program");
    await expect(page.getByLabel("Java code editor")).toBeVisible();
    await expect(page.getByTestId("run-code")).toBeVisible();
  });
});
