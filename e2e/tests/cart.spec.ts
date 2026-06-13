import { expect, test } from "@playwright/test";

/**
 * BuggyShop cart page (port 3001, public — no sandbox session needed). In
 * release v1.0 the shipping rule carries BS-012: free shipping should apply only
 * when the subtotal is STRICTLY over $999, but the buggy branch uses `>=`, so a
 * subtotal of exactly $999 (the single "Annual Membership" at qty 1) wrongly
 * qualifies for free shipping. This test pins that buggy behavior on purpose —
 * it is the boundary bug learners hunt in the A3.3 lab.
 */
test.describe("buggyshop — cart shipping boundary (BS-012)", () => {
  const CART_URL = "http://localhost:3001/cart";

  test("BS-012: subtotal of exactly $999 wrongly gets free shipping", async ({ page }) => {
    await page.goto(CART_URL);

    // default qty is 1, so the subtotal is exactly $999 — the boundary
    await expect(page.getByTestId("cart-qty")).toHaveText("1");
    await expect(page.getByTestId("cart-subtotal")).toContainText("$999.00");

    // the off-by-one: free shipping kicks in AT $999 instead of only above it
    await expect(page.getByTestId("cart-shipping")).toHaveText("Free");
  });

  test("a subtotal above $999 correctly gets free shipping", async ({ page }) => {
    await page.goto(CART_URL);

    await page.getByTestId("cart-qty-increment").click();
    await expect(page.getByTestId("cart-qty")).toHaveText("2");
    await expect(page.getByTestId("cart-subtotal")).toContainText("$1998.00");
    await expect(page.getByTestId("cart-shipping")).toHaveText("Free");
  });
});
