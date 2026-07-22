import { expect, test, type Page } from "@playwright/test";
import { signUpFreshLearner as sharedSignUp } from "./signup-helper";

/**
 * UI-wiring smoke for the help-agent tutor. Covers that the surface mounts and
 * opens correctly — NOT the runtime round-trip: the tutor's reply needs an LLM,
 * which doesn't exist in CI. The guard/validation logic behind it is
 * unit-tested. (The code-runner lab's equivalent smoke — editor + run control
 * render once a chapter unlocks — now lives in chapter-lab.spec.ts on the
 * notes spine; the legacy /learn lesson this test used to point at was
 * retired 2026-07-22.)
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

