import { expect, test } from "@playwright/test";
import { publishTester, signUp, uniqueHandle } from "./talent-helpers";

/**
 * Talent — tester onboarding flow. A new learner creates a profile, picks a
 * specialty, publishes, and their public profile is reachable. Covers the M1
 * "learn → get listed" path (Test-Plan §4.1).
 */
test.describe("talent — tester profile", () => {
  test("create, publish, and view a public tester profile", async ({ page }) => {
    await signUp(page);
    const handle = uniqueHandle();
    await publishTester(page, handle);

    // The public profile renders the handle + the chosen specialty.
    await page.goto(`http://localhost:3000/talent/u/${handle}`);
    await expect(page.getByRole("heading", { name: handle })).toBeVisible();
    await expect(page.getByText(/functional/i).first()).toBeVisible();
    // A Contact affordance is present for visitors.
    await expect(page.getByRole("button", { name: /^contact$/i })).toBeVisible();
  });
});
