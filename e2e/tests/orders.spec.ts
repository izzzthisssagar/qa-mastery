import { expect, test } from "@playwright/test";

/**
 * BuggyShop orders page (port 3001, public — no sandbox session needed). In
 * release v1.0 the cancel rule carries BS-014: an order may only be cancelled
 * BEFORE it ships (states "Placed" or "Paid"). The buggy branch also allows
 * cancelling an order that is already "Shipped" — an invalid state transition.
 * This test pins that buggy behavior on purpose: the seeded order is "Shipped",
 * yet clicking Cancel succeeds. It is the state-transition bug learners hunt in
 * the A3.5 lab.
 */
test.describe("buggyshop — order cancel state transition (BS-014)", () => {
  const ORDERS_URL = "http://localhost:3001/orders";

  test("BS-014: a shipped order can be wrongly cancelled", async ({ page }) => {
    await page.goto(ORDERS_URL);

    // the seeded order starts out already Shipped — cancellation should be invalid
    await expect(page.getByTestId("order-status")).toHaveText("Shipped");

    await page.getByTestId("order-cancel").click();

    // the bug: a shipped order accepts the cancel instead of rejecting it
    await expect(page.getByTestId("cancel-result")).toBeVisible();
    await expect(page.getByTestId("cancel-result")).toHaveText("Order cancelled");
  });
});
