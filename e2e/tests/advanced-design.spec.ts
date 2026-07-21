import { expect, test, type Page } from "@playwright/test";
import { signUpFreshLearner as sharedSignUp } from "./signup-helper";

/**
 * Track A6 — Advanced Test Design (pairwise + use-case testing). Every lesson is
 * free (no paywall), so a fresh learner opens the pages directly. Mirrors the
 * signup helper used across the learn specs.
 */

async function signUpFreshLearner(page: Page): Promise<void> {
  await sharedSignUp(page, "learner");
}

test.describe("learn — A6 Advanced Test Design", () => {
  test("a learner can open the pairwise and use-case lessons and see their widgets", async ({
    page,
  }) => {
    await signUpFreshLearner(page);

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
