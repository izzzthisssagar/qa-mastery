import { expect, test } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

/**
 * Guards apps/platform/next.config.ts's outputFileTracingIncludes (P4-2).
 * Notes pages read packages/curriculum/content/**\/*.mdx from disk at
 * request time (packages/curriculum/src/notes/load.ts); Next's tracer can't
 * follow that computed path, so without the include this route 500s on a
 * production build (Vercel serverless / `next start`) even though it renders
 * fine in dev. This suite always runs against `next start`
 * (e2e/playwright.config.ts), so it fails loudly the moment someone deletes
 * the include — see docs/known-issues if this ever regresses.
 */
test.describe("curriculum content tracing", () => {
  test("a notes topic page renders its MDX body on the production build", async ({
    page,
  }) => {
    await signUpFreshLearner(page, "tracing");

    const response = await page.goto(
      "http://localhost:3000/notes/test-design-techniques/boundary-value-analysis/why-edges-fail",
    );
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: "Why edges fail", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText(/cluster at the exact edges of input ranges/i),
    ).toBeVisible();
  });
});
