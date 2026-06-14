import { expect, test } from "@playwright/test";

/**
 * BuggyShop home hub — every testable area should be reachable from the landing
 * page, not just by typing a URL.
 */
test.describe("buggyshop — home hub", () => {
  const SECTIONS = [
    "section-products",
    "section-signup",
    "section-login",
    "section-cart",
    "section-checkout",
    "section-payment",
    "section-orders",
    "section-profile",
  ];

  test("links to every shop section", async ({ page }) => {
    await page.goto("http://localhost:3001/");
    for (const id of SECTIONS) {
      await expect(page.getByTestId(id)).toBeVisible();
    }
  });

  test("a section link navigates", async ({ page }) => {
    await page.goto("http://localhost:3001/");
    await page.getByTestId("section-orders").click();
    await expect(page).toHaveURL(/\/orders/);
    await expect(page.getByTestId("order-status")).toBeVisible();
  });
});
