import { expect, test } from "@playwright/test";

/**
 * BuggyShop order-history page (port 3001, public — no sandbox session needed).
 * The list should show ONLY the signed-in account's own orders. In release v1.0
 * the page carries BS-020: the buggy branch drops the ownership filter and also
 * surfaces an order belonging to a DIFFERENT account — a data leak / broken
 * access control. This test pins that buggy behavior on purpose: a row owned by
 * "someone-else@buggyshop.test" is visible. It is the access-control bug
 * learners hunt in the A5.1 lab.
 */
test.describe("buggyshop — order history data leak (BS-020)", () => {
  const ORDER_HISTORY_URL = "http://localhost:3001/order-history";

  test("BS-020: another account's order leaks into the history list", async ({ page }) => {
    await page.goto(ORDER_HISTORY_URL);

    // the leaked row belongs to a different account than the signed-in shopper
    const leakedOwner = page.getByTestId("history-owner-5004");
    await expect(leakedOwner).toBeVisible();
    await expect(leakedOwner).toHaveText("someone-else@buggyshop.test");

    // the foreign row is rendered as a real order in the list
    await expect(page.getByTestId("history-order-5004")).toBeVisible();
  });
});
