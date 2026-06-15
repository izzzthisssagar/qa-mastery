/**
 * Manual smoke test for the PlaywrightRunner — submits a trivial spec against
 * BuggyShop and polls for the result. Run with the buggyshop app up:
 *   pnpm --filter @qa-mastery/grading exec tsx scripts/smoke-runner.ts
 * Not part of the automated suite (needs Docker + a running app).
 */
import { PlaywrightRunner } from "../src/playwright-runner";

async function main() {
  const runner = new PlaywrightRunner();
  const res = await runner.submit({
    lessonSlug: "test",
    userId: "test",
    payload: {
      code: `
import { test, expect } from '@playwright/test';
test('basic', async ({ page }) => {
  await page.goto('http://127.0.0.1:3001');
  await expect(page).toHaveTitle('BuggyShop');
});
      `,
    },
  });

  console.log("Run ID:", res.runId);

  let result;
  do {
    await new Promise((r) => setTimeout(r, 1000));
    result = await runner.getResult(res.runId);
    console.log("Status:", result.status);
  } while (result.status === "running");

  console.log("Passed:", result.passed);
  console.log("Output:");
  console.log(result.console);
}

main().catch(console.error);
