import { expect, test } from "@playwright/test";

/**
 * Smoke the real public BuggyShop production-mode cart, which is safe to
 * visit without a logged-in QA Mastery learner. This is NOT an authenticated
 * lesson test, a human usability acceptance, or a hosted sandbox check.
 */
test.describe("Sprint 03 BVA browser evidence — public BuggyShop only", () => {
  for (const width of [390, 768, 1440] as const) {
    test(`cart at ${width}px: loads, responds to quantity change, fits viewport`, async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto("/cart", { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { name: "Cart", exact: true })).toBeVisible();
      await expect(page.getByTestId("cart-qty")).toHaveText("1");
      await expect(async () => {
        if ((await page.getByTestId("cart-qty").innerText()) === "1") {
          await page.getByTestId("cart-qty-increment").click();
        }
        await expect(page.getByTestId("cart-qty")).toHaveText("2", { timeout: 1500 });
      }).toPass({ timeout: 7000 });
      await expect(page.getByTestId("cart-subtotal")).toContainText("$1998.00");
      await expect(page.getByTestId("cart-shipping")).toHaveText("Free");

      const dimensions = await page.locator("html").evaluate((element) => ({
        contentWidth: (element as unknown as { scrollWidth: number }).scrollWidth,
        viewportWidth: (element as unknown as { clientWidth: number }).clientWidth,
      }));
      expect(dimensions.contentWidth).toBeLessThanOrEqual(width + 1);
      expect(dimensions.viewportWidth).toBe(width);
      expect(errors).toEqual([]);

      await page.screenshot({
        path: info.outputPath(`buggyshop-cart-responsive-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
    });
  }

  test("quantity buttons respond to keyboard Enter and Space", async ({ page }) => {
    await page.goto("/cart", { waitUntil: "networkidle" });
    const increment = page.getByTestId("cart-qty-increment");
    const decrement = page.getByTestId("cart-qty-decrement");
    await increment.focus();
    await expect(increment).toBeFocused();
    await increment.press("Enter");
    await expect(page.getByTestId("cart-qty")).toHaveText("2");
    await decrement.focus();
    await expect(decrement).toBeFocused();
    await decrement.press("Space");
    await expect(page.getByTestId("cart-qty")).toHaveText("1");
  });

  test("products navigation is visible and navigable from the cart", async ({ page }) => {
    await page.goto("/cart", { waitUntil: "networkidle" });
    await expect(page.getByTestId("nav-products")).toBeVisible();
    await page.getByTestId("nav-products").click();
    await expect(page).toHaveURL(/\/products$/);
  });

  test("written shipping requirement is visible without logging in", async ({ page }) => {
    const response = await page.goto("/cart", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(
      page.getByText("Free shipping on orders over $999.", { exact: true }),
    ).toBeVisible();
    const controls = await Promise.all([
      page.getByTestId("cart-qty-increment").getAttribute("aria-label"),
      page.getByTestId("cart-qty-decrement").getAttribute("aria-label"),
    ]);
    // Capture a QA observation (symbol-only labels), without changing seeded app behavior.
    console.log(`Quantity control descriptive aria-labels: ${JSON.stringify(controls)}`);
  });
});
