import { expect, test } from "@playwright/test";

/**
 * BuggyShop payment page (port 3001, public — no sandbox session needed). In
 * release v1.0 the payment decision table carries BS-011: a rule conflict. The
 * Card method is OFFERED for every order total, but SUBMITTING with Card on an
 * order under $100 errors out — even though the option was shown. Cash on the
 * same order succeeds. These tests pin that buggy behaviour on purpose — it is
 * the decision-table rule conflict learners hunt in the A3.4 lab.
 */
test.describe("buggyshop — payment decision-table conflict (BS-011)", () => {
  const PAYMENT_URL = "http://localhost:3001/payment";

  test("BS-011: Card is offered but rejected on a $50 order", async ({ page }) => {
    await page.goto(PAYMENT_URL);

    // the demo order is fixed under $100 — the conflicting condition
    await expect(page.getByTestId("order-total")).toContainText("$50");

    // Card is offered (the option is shown) and selected by default
    await page.getByTestId("pay-method").selectOption("card");
    await page.getByTestId("pay-submit").click();

    // the rule conflict: the offered method is refused on submit
    await expect(page.getByTestId("pay-message")).toContainText("unavailable");
  });

  test("Cash on the same $50 order succeeds", async ({ page }) => {
    await page.goto(PAYMENT_URL);

    await expect(page.getByTestId("order-total")).toContainText("$50");

    await page.getByTestId("pay-method").selectOption("cash");
    await page.getByTestId("pay-submit").click();

    await expect(page.getByTestId("pay-message")).not.toContainText("unavailable");
  });
});
