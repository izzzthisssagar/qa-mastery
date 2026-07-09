import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

/**
 * Tasks smoke: the hub is auth-gated, a personal planner to-do can be added and
 * completed, and a seeded system task can be accepted. Grading against live
 * evidence is covered by the RLS + unit suites; here we prove the UI wiring.
 */

async function signUpFreshLearner(page: Page): Promise<void> {
  const email = `tasks-${randomUUID()}@e2e.local`;
  await page.goto("http://localhost:3000/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("a-strong-password-1");
  await expect(async () => {
    await page.getByRole("button", { name: /start learning free/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 4000 });
  }).toPass({ timeout: 20_000 });
}

test.describe("tasks", () => {
  test("anonymous visitor is redirected to login", async ({ page }) => {
    await page.goto("http://localhost:3000/tasks");
    await expect(page).toHaveURL(/\/login/);
  });

  test("add + complete a personal to-do, and accept a system task", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.goto("http://localhost:3000/tasks");
    await expect(page.getByRole("heading", { name: /^tasks$/i })).toBeVisible();

    // Personal planner: add a to-do.
    await page.getByTestId("planner-input").fill("write boundary tests");
    await page.getByRole("button", { name: /^add$/i }).click();
    const row = page.getByTestId("planner-row").filter({ hasText: "write boundary tests" });
    await expect(row).toBeVisible();

    // Complete it.
    await row.getByRole("checkbox").check();
    await expect(row.getByText("write boundary tests")).toHaveClass(/line-through/);

    // Accept a seeded system task.
    const firstBlood = page.getByTestId("task-first-blood");
    await expect(firstBlood).toBeVisible();
    await firstBlood.getByRole("button", { name: /accept task/i }).click();
    await expect(firstBlood.getByRole("button", { name: /grade my work/i })).toBeVisible();
  });
});
