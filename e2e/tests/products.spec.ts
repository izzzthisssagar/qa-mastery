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

  test("BS-009: sort by price asc orders prices as text ($100 first)", async ({ page }) => {
    await page.goto(PRODUCTS_URL);
    await page.getByTestId("sort-select").selectOption("asc");
    // string sort puts "100" before "12","5",... so the $100 item lands first
    const first = page.getByTestId("product-grid").locator("li").first();
    await expect(first).toHaveAttribute("data-testid", "product-card-premium-test-plan");
  });

  test("BS-010: search with a trailing space finds nothing (no trim)", async ({ page }) => {
    await page.goto(PRODUCTS_URL);
    // "mug" matches Tester Mug; "mug " (trailing space) should too, but the
    // untrimmed query never matches because the name has no trailing space.
    await page.getByTestId("search-input").fill("mug");
    await expect(page.getByTestId("product-card-tester-mug")).toBeVisible();
    await page.getByTestId("search-input").fill("mug ");
    await expect(page.getByTestId("product-card-tester-mug")).toBeHidden();
    await expect(page.getByTestId("empty-state")).toBeVisible();
  });

  test("BS-007: product detail accepts a quantity of 0", async ({ page }) => {
    await page.goto(PRODUCTS_URL);
    await page.getByTestId("view-tester-mug").click();
    await expect(page.getByTestId("product-name")).toContainText("Tester Mug");

    // quantity 0 should be rejected, but BS-007 accepts it as a $0 line
    await page.getByTestId("qty-input").fill("0");
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-line")).toBeVisible();
    await expect(page.getByTestId("cart-line")).toContainText("$0.00");
  });
});
