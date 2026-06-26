import { expect, test } from "@playwright/test";
import { publishTester, signUp, uniqueHandle } from "./talent-helpers";

/**
 * Talent — directory discovery (Test-Plan §4.2). A published tester must be
 * findable in the public directory and survive a specialty filter. This is the
 * "get listed → get found" half of the marketplace, which shipped at launch
 * with no e2e coverage. Newest-first ordering (updated_at desc) puts a
 * just-published tester on page 1, so the assertion is deterministic.
 */
test.describe("talent — directory", () => {
  test("a published tester is discoverable and filterable by specialty", async ({ page }) => {
    await signUp(page);
    const handle = uniqueHandle();
    await publishTester(page, handle); // publishes with the 'functional' specialty

    const profileLink = `a[href*="/talent/u/${handle}"]`;

    await page.goto("http://localhost:3000/talent/testers");
    await expect(page.getByRole("heading", { name: /find a qa tester/i })).toBeVisible();
    await expect(page.locator(profileLink).first()).toBeVisible({ timeout: 15_000 });

    // The filter rail is URL-driven; filtering by their specialty keeps them.
    await page.getByRole("button", { name: /^functional$/i }).click();
    await expect(page).toHaveURL(/[?&]spec=/);
    await expect(page.locator(profileLink).first()).toBeVisible({ timeout: 15_000 });
  });
});
