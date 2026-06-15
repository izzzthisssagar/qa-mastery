import { expect, test } from "@playwright/test";

/**
 * Release switching: bugs are release-gated via bugFlag, so flipping BuggyShop
 * from v1.0 to v1.1 fixes some of them — the retest / regression story (A5.2).
 * BS-007 (quantity 0) and BS-008 (price filter) are both fixed in v1.1.
 */
test.describe("buggyshop — release switch & retest", () => {
  test("the release switcher is present and defaults to v1.0", async ({ page }) => {
    await page.goto("http://localhost:3001/products");
    await expect(page.getByTestId("release-switcher")).toBeVisible();
    await expect(page.getByTestId("release-select")).toHaveValue("1.0");
  });

  test("v1.1 fixes BS-008: the $100 item survives the max-price filter", async ({ page }) => {
    await page.addInitScript('localStorage.setItem("bs-release", "1.1")');
    await page.goto("http://localhost:3001/products");
    await expect(page.getByTestId("release-select")).toHaveValue("1.1");

    await page.getByTestId("max-price-input").fill("100");
    // in v1.0 the $100 item would vanish; in v1.1 the filter is fixed
    await expect(page.getByTestId("product-card-premium-test-plan")).toBeVisible();
  });

  test("v1.1 fixes BS-007: quantity 0 is rejected", async ({ page }) => {
    await page.addInitScript('localStorage.setItem("bs-release", "1.1")');
    await page.goto("http://localhost:3001/products/tester-mug");
    await page.getByTestId("qty-input").fill("0");
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("qty-rejected")).toBeVisible();
  });

  test("switching the dropdown to v1.1 takes effect after reload", async ({ page }) => {
    await page.goto("http://localhost:3001/products");
    await page.getByTestId("max-price-input").fill("100");
    await expect(page.getByTestId("product-card-premium-test-plan")).toBeHidden(); // v1.0 bug

    await page.getByTestId("release-select").selectOption("1.1"); // triggers reload
    await page.getByTestId("max-price-input").fill("100");
    await expect(page.getByTestId("product-card-premium-test-plan")).toBeVisible(); // fixed
  });
});
