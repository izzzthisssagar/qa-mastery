import { expect, test } from "@playwright/test";

/**
 * BuggyShop checkout ZIP validation (port 3001, public). In release v1.0 the
 * validator carries BS-016: the ZIP field accepts alphanumeric input instead of
 * digits only, so a code with letters ("AB12C") is wrongly accepted.
 */
test.describe("buggyshop — checkout ZIP validation (BS-016)", () => {
  const CHECKOUT_URL = "http://localhost:3001/checkout";

  test("a valid digits-only ZIP (12345) is accepted", async ({ page }) => {
    await page.goto(CHECKOUT_URL);
    await page.getByTestId("zip-input").fill("12345");
    await page.getByTestId("checkout-submit").click();
    await expect(page.getByTestId("zip-verdict")).toContainText(/accepted/i);
  });

  test("BS-016: an alphanumeric code (AB12C) is wrongly accepted", async ({ page }) => {
    await page.goto(CHECKOUT_URL);
    await page.getByTestId("zip-input").fill("AB12C");
    await page.getByTestId("checkout-submit").click();
    await expect(page.getByTestId("zip-verdict")).toContainText(/accepted/i);
  });

  test("a clearly malformed code (!!) is rejected", async ({ page }) => {
    await page.goto(CHECKOUT_URL);
    await page.getByTestId("zip-input").fill("!!");
    await page.getByTestId("checkout-submit").click();
    await expect(page.getByTestId("zip-verdict")).toContainText(/rejected/i);
  });
});
