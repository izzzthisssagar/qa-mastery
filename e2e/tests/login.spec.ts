import { expect, test } from "@playwright/test";

/**
 * BuggyShop login (port 3001, public). The demo account is
 * shopper@buggyshop.test / password1. In release v1.0 the login carries BS-006:
 * a failed login leaks "User does not exist" instead of the generic
 * "Incorrect email or password" a correct app returns. This is the
 * information-leak / misleading-message bug the security lab hunts.
 */
test.describe("buggyshop — login (BS-006)", () => {
  const LOGIN_URL = "http://localhost:3001/login";

  test("valid credentials log in", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.getByTestId("login-email").fill("shopper@buggyshop.test");
    await page.getByTestId("login-password").fill("password1");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-message")).toContainText(/Welcome back/i);
  });

  test("BS-006: a known email with the wrong password leaks 'does not exist'", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.getByTestId("login-email").fill("shopper@buggyshop.test");
    await page.getByTestId("login-password").fill("wrong-password");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-message")).toContainText(/does not exist/i);
  });

  test("BS-005: checking 'Remember me' has no effect — the preference is dropped", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.getByTestId("login-email").fill("shopper@buggyshop.test");
    await page.getByTestId("login-password").fill("password1");
    await page.getByTestId("remember-me").check();
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-message")).toContainText(/Welcome back/i);
    // Bug: the box was ticked, but the status silently reads "off".
    await expect(page.getByTestId("remember-status")).toContainText("Remember me: off");
  });
});
