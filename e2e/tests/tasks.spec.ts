import { expect, test, type Page } from "@playwright/test";
import { signUpFreshLearner as sharedSignUp } from "./signup-helper";

/**
 * Tasks smoke: the hub is auth-gated, a personal planner to-do can be added and
 * completed, and a seeded system task can be accepted. Grading against live
 * evidence is covered by the RLS + unit suites; here we prove the UI wiring.
 */

async function signUpFreshLearner(page: Page): Promise<void> {
  await sharedSignUp(page, "tasks");
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
    // .first(): hydration can transiently double-render the freshly-navigated
    // page under CI concurrency (docs/known-issues/hydration-double-render.md)
    await page.getByTestId("planner-input").first().fill("write boundary tests");
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
