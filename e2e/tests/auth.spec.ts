import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

/**
 * Requires the local Supabase stack (`pnpm db:start`) — locally and in CI.
 * Local config has email confirmations disabled, so signup returns a live
 * session immediately.
 */
test.describe("auth", () => {
  test("signup → dashboard → sign out → log back in", async ({ page }) => {
    const email = `learner-${randomUUID()}@e2e.local`;
    const password = "a-strong-password-1";

    // signup — the click is wrapped in toPass(): on a cold dev compile the
    // first click can land before hydration and get swallowed; retrying is
    // a no-op in prod builds where hydration beats any human (or robot).
    await page.goto("http://localhost:3000/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await expect(async () => {
      await page.getByRole("button", { name: /start learning free/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 4000 });
    }).toPass({ timeout: 20_000 });
    await expect(
      page.getByRole("heading", { name: /your learning/i }),
    ).toBeVisible();

    // sign out lands back on the marketing homepage
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL("http://localhost:3000/");

    // log back in with the same credentials
    await page.goto("http://localhost:3000/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /^log in$/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("anonymous visitor is redirected from dashboard to login", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("wrong password shows an error, not a dashboard", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByLabel("Email").fill(`nobody-${randomUUID()}@e2e.local`);
    await page.getByLabel("Password").fill("definitely-wrong-1");
    await page.getByRole("button", { name: /^log in$/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
