import { expect, test } from "@playwright/test";

/**
 * BuggyShop newsletter signup (port 3001, public). The page requires the
 * "I accept the terms" checkbox before subscribing. In release v1.0 it carries
 * BS-004: a debounce/guard gap where a DOUBLE-CLICK on Subscribe slips past the
 * unchecked-terms gate.
 */
test.describe("buggyshop — newsletter terms gate (BS-004)", () => {
  const NEWSLETTER_URL = "http://localhost:3001/newsletter";

  test("terms unchecked + single click is correctly blocked", async ({ page }) => {
    await page.goto(NEWSLETTER_URL);
    await page.getByTestId("newsletter-email").fill("sagar@example.com");
    await page.getByTestId("newsletter-submit").click();
    await expect(page.getByTestId("newsletter-verdict")).toHaveText("Please accept the terms");
  });

  test("BS-004: terms unchecked + double-click wrongly subscribes", async ({ page }) => {
    await page.goto(NEWSLETTER_URL);
    await page.getByTestId("newsletter-email").fill("sagar@example.com");
    await page.getByTestId("newsletter-submit").dblclick();
    await expect(page.getByTestId("newsletter-verdict")).toHaveText("Subscribed");
  });
});
