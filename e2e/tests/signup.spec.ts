import { expect, test } from "@playwright/test";

/**
 * BuggyShop signup email validation (port 3001, public). In release v1.0 the
 * validator carries BS-001: a lax regex that accepts clearly invalid addresses.
 * This is the bug the A3.2 equivalence-partitioning lab hunts.
 */
test.describe("buggyshop — signup email validation (BS-001)", () => {
  const SIGNUP_URL = "http://localhost:3001/signup";

  test("BS-001: an invalid address (user@@domain..com) is wrongly accepted", async ({ page }) => {
    await page.goto(SIGNUP_URL);
    await page.getByTestId("signup-email").fill("user@@domain..com");
    await page.getByTestId("signup-submit").click();
    await expect(page.getByTestId("signup-verdict")).toContainText(/accepted/i);
  });

  test("a clearly malformed address with no domain is rejected", async ({ page }) => {
    await page.goto(SIGNUP_URL);
    await page.getByTestId("signup-email").fill("not-an-email");
    await page.getByTestId("signup-submit").click();
    await expect(page.getByTestId("signup-verdict")).toContainText(/rejected/i);
  });

  test("a valid address is accepted", async ({ page }) => {
    await page.goto(SIGNUP_URL);
    await page.getByTestId("signup-email").fill("sagar@example.com");
    await page.getByTestId("signup-submit").click();
    await expect(page.getByTestId("signup-verdict")).toContainText(/accepted/i);
  });
});
