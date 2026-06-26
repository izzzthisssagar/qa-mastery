import { expect, test } from "@playwright/test";
import { signUp } from "./talent-helpers";

/**
 * Talent — client posts a project (Test-Plan §4.4). The demand side of the
 * marketplace: a signed-in user posts a testing project and gets the "posted"
 * confirmation. Shipped at launch with no e2e coverage.
 */
test.describe("talent — post a project", () => {
  test("a signed-in user can post a testing project", async ({ page }) => {
    await signUp(page);
    await page.goto("http://localhost:3000/talent/post");
    await expect(page.getByRole("heading", { name: /post a testing project/i })).toBeVisible();

    await page.getByLabel("Title").fill("Regression + API testing for our checkout");
    await page
      .getByLabel("Description")
      .fill("Need a tester to cover the cart and checkout flows on our React app.");

    await page.getByRole("button", { name: /^post project$/i }).click();

    // postProject is a server action against the live DB — give cold-start
    // headroom (same lesson as the WebKit save-latency fix in publishTester).
    await expect(page.getByRole("heading", { name: /project posted/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /browse testers/i })).toBeVisible();
  });
});
