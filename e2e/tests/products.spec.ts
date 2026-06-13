import { expect, test } from "@playwright/test";

/**
 * BuggyShop products page (port 3001, public — no sandbox session needed). In
 * release v1.0 the price filter carries BS-008: the item priced exactly at the
 * max is wrongly excluded. This test pins that buggy behavior on purpose — it
 * is the bug learners hunt in the A3.3 lab.
 */
test.describe("buggyshop — products price filter (BS-008)", () => {
  const PRODUCTS_URL = "http://localhost:3001/products";

  test("the $100 item shows unfiltered", async ({ page }) => {
    await page.goto(PRODUCTS_URL);
    await expect(page.getByTestId("product-card-premium-test-plan")).toBeVisible();
    await expect(page.getByTestId("result-count")).toContainText("8 of 8");
  });

  test("BS-008: max price 100 wrongly excludes the $100 item", async ({ page }) => {
    await page.goto(PRODUCTS_URL);
    await page.getByTestId("max-price-input").fill("100");

    // the off-by-one: the boundary item disappears...
    await expect(page.getByTestId("product-card-premium-test-plan")).toBeHidden();
    // ...while a cheaper item still shows
    await expect(page.getByTestId("product-card-boundary-hoodie")).toBeVisible();
    await expect(page.getByTestId("result-count")).toContainText("7 of 8");
  });

  test("raising the max to 101 brings the $100 item back", async ({ page }) => {
    await page.goto(PRODUCTS_URL);
    await page.getByTestId("max-price-input").fill("101");
    await expect(page.getByTestId("product-card-premium-test-plan")).toBeVisible();
  });
});
