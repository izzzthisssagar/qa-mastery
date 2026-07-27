import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

/**
 * Requires the local Supabase stack (`pnpm db:start`) — locally and in CI.
 * Local config has email confirmations disabled, so signup returns a live
 * session immediately.
 */
test.describe("auth", () => {
  test("signup → dashboard → sign out → log back in", async ({ page }) => {
    const email = `learner-${randomUUID()}@e2e.local`;
    const password = "a-strong-password-1";

    // signup — the whole form interaction is wrapped in toPass(): anything
    // that lands before hydration is silently lost (fills included — state
    // stays empty even in prod builds on a starved runner, see
    // docs/known-issues/webkit-save-stall.md), so the retry redoes the fills,
    // not just the click.
    await page.goto("http://localhost:3000/signup");
    await expect(async () => {
      if (!/\/dashboard/.test(page.url())) {
        await page.getByLabel("Email").fill(email);
        await page.getByLabel("Password").fill(password);
        await page.getByRole("button", { name: /start learning free/i }).click();
      }
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 4000 });
    }).toPass({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /your learning/i })).toBeVisible();

    // sign out (now inside the avatar menu) lands back on the marketing homepage
    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await expect(page).toHaveURL("http://localhost:3000/");

    // log back in with the same credentials
    await page.goto("http://localhost:3000/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /^log in$/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("anonymous visitor is redirected from dashboard to login", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("preserves protected destination through the login round trip", async ({ page }) => {
    // Task 6: a deep link to any protected (app) route should land back on
    // that same route after logging in, not get dropped on /dashboard.
    const email = await signUpFreshLearner(page, "deeplink");
    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await expect(page).toHaveURL("http://localhost:3000/");

    await page.goto("http://localhost:3000/notes");
    await expect(page).toHaveURL(/\/login\?next=%2Fnotes/);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("a-strong-password-1");
    await page.getByRole("button", { name: /^log in$/i }).click();
    await expect(page).toHaveURL("http://localhost:3000/notes");
  });

  test("rejects external next and falls back to /dashboard", async ({ page }) => {
    const email = await signUpFreshLearner(page, "openredirect");
    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await expect(page).toHaveURL("http://localhost:3000/");

    await page.goto(
      "http://localhost:3000/login?next=" + encodeURIComponent("https://evil.example"),
    );
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("a-strong-password-1");
    await page.getByRole("button", { name: /^log in$/i }).click();
    await expect(page).toHaveURL("http://localhost:3000/dashboard");
  });

  test("wrong password shows an error, not a dashboard", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByLabel("Email").fill(`nobody-${randomUUID()}@e2e.local`);
    await page.getByLabel("Password").fill("definitely-wrong-1");
    await page.getByRole("button", { name: /^log in$/i }).click();
    // Target the form's own error, not Next's framework route-announcer
    // (which is also role="alert") — avoids a strict-mode 2-match on WebKit.
    await expect(page.getByTestId("form-error")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
