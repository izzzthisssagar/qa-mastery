import { expect, test, type Page, type Request } from "@playwright/test";
import { signUpFreshLearner as sharedSignUp } from "./signup-helper";

/**
 * Tasks smoke: the hub is auth-gated, a personal planner to-do can be added and
 * completed, and a seeded system task can be accepted. Grading against live
 * evidence is covered by the RLS + unit suites; here we prove the UI wiring.
 */

async function signUpFreshLearner(page: Page): Promise<void> {
  await sharedSignUp(page, "tasks");
}

type LocalPost = { method: string; route: string; startedAt: number };
type CompletedLocalPost = {
  method: string;
  route: string;
  status?: number;
  result: "response" | "failed";
  durationMs: number;
};

test.describe("tasks", () => {
  let localPosts = new Map<Request, LocalPost>();
  let completedLocalPosts: CompletedLocalPost[] = [];

  test.beforeEach(({ page }) => {
    localPosts = new Map();
    completedLocalPosts = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.origin !== "http://localhost:3000" || request.method() !== "POST") return;
      const route = url.pathname.replace(/\/[0-9a-f-]{20,}(?=\/|$)/gi, "/:id");
      localPosts.set(request, { method: request.method(), route, startedAt: Date.now() });
    });
    page.on("response", (response) => {
      const request = response.request();
      const started = localPosts.get(request);
      if (!started) return;
      completedLocalPosts.push({
        method: started.method,
        route: started.route,
        status: response.status(),
        result: "response",
        durationMs: Date.now() - started.startedAt,
      });
      localPosts.delete(request);
    });
    page.on("requestfailed", (request) => {
      const started = localPosts.get(request);
      if (!started) return;
      completedLocalPosts.push({
        method: started.method,
        route: started.route,
        result: "failed",
        durationMs: Date.now() - started.startedAt,
      });
      localPosts.delete(request);
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) return;
    const pending = [...localPosts.values()].map(({ method, route, startedAt }) => ({
      method,
      route,
      pendingMs: Date.now() - startedAt,
    }));
    const pagePath = page.url().startsWith("http") ? new URL(page.url()).pathname : "";
    // Safe timing summary only: no query strings, headers, cookies, or bodies.
    await testInfo.attach("sanitized-local-post-timings.json", {
      body: JSON.stringify({ pagePath, completed: completedLocalPosts, pending }),
      contentType: "application/json",
    });
  });
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
