import { expect, test } from "@playwright/test";

/**
 * BuggyShop profile email editing (port 3001, public). In release v1.0 the
 * profile editor carries BS-019: editing the email skips re-validation, so a
 * clearly invalid address is saved over the previously-valid one. This is the
 * bug the A3.2 validation lab hunts.
 */
test.describe("buggyshop — profile email validation (BS-019)", () => {
  const PROFILE_URL = "http://localhost:3001/profile";

  test("BS-019: an invalid edited address (bad@@x) is wrongly saved", async ({ page }) => {
    await page.goto(PROFILE_URL);
    await page.getByTestId("profile-email").clear();
    await page.getByTestId("profile-email").fill("bad@@x");
    await page.getByTestId("profile-save").click();
    await expect(page.getByTestId("profile-verdict")).toContainText(/saved/i);
    await expect(page.getByTestId("profile-verdict")).not.toContainText(/invalid/i);
  });

  test("a clearly valid edited address is saved", async ({ page }) => {
    await page.goto(PROFILE_URL);
    await page.getByTestId("profile-email").clear();
    await page.getByTestId("profile-email").fill("sagar@example.com");
    await page.getByTestId("profile-save").click();
    await expect(page.getByTestId("profile-verdict")).toContainText(/saved/i);
  });
});
