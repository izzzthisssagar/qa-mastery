import { expect, test } from "@playwright/test";

test.describe("platform", () => {
  test("homepage renders the brand and auth entry points", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await expect(
      page.getByRole("heading", { name: /don't watch testing\. do it\./i }),
    ).toBeVisible();
    // "Log in" appears in both header and hero — scope to the banner landmark.
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: /log in/i })).toBeVisible();
    await expect(header.getByRole("link", { name: /start learning/i })).toBeVisible();
  });
});

test.describe("buggyshop", () => {
  test("homepage renders the shop brand", async ({ page }) => {
    await page.goto("http://localhost:3001/");
    await expect(
      page.getByRole("heading", { name: /buggyshop/i }),
    ).toBeVisible();
  });
});
