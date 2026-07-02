import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 4 nav + hub smoke: the header is now just logo + Dashboard + bell +
 * avatar menu, and the dashboard carries the hub grid. Verifies the old nav
 * links are gone, the avatar menu opens, and hub cards route.
 */

async function signUpFreshLearner(page: Page): Promise<void> {
  const email = `hub-${randomUUID()}@e2e.local`;
  await page.goto("http://localhost:3000/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("a-strong-password-1");
  await expect(async () => {
    await page.getByRole("button", { name: /start learning free/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 4000 });
  }).toPass({ timeout: 20_000 });
}

test.describe("hub nav", () => {
  test("header is minimal; avatar menu + bell present; hub routes", async ({ page }) => {
    await signUpFreshLearner(page);

    // Header: bell + avatar; no Portfolio/Test cases/Settings links.
    await expect(page.getByTestId("notification-bell")).toBeVisible();
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: /^Portfolio$/ })).toHaveCount(0);
    await expect(header.getByRole("link", { name: /^Test cases$/ })).toHaveCount(0);

    // Avatar menu opens and offers a theme toggle.
    await page.getByRole("button", { name: /account menu/i }).click();
    await expect(page.getByRole("menuitem", { name: /mode/i })).toBeVisible();
    await page.keyboard.press("Escape");

    // Hub grid routes to the community.
    await page.getByTestId("hub-card-community").click();
    await expect(page).toHaveURL(/\/community/);
  });
});
