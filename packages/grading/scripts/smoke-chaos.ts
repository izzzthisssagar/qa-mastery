/**
 * Manual smoke test for the BS-022 "chaos mode" seeded bug via the
 * PlaywrightRunner: adds to cart repeatedly to catch the 30% intermittent
 * network error on release 2.0. Run with the buggyshop app up:
 *   pnpm --filter @qa-mastery/grading exec tsx scripts/smoke-chaos.ts
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

test('chaos mode test', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:3001');
  await page.evaluate(() => localStorage.setItem('bs-release', '2.0'));
  await page.goto('http://localhost:3001/products/qa-sticker-pack');

  // Try adding to cart repeatedly to catch the 30% flaky error
  let errorFound = false;
  for (let i = 0; i < 15; i++) {
    await page.click('button[data-testid="add-to-cart"]');
    await page.waitForTimeout(100);
    const errorText = await page.locator('[data-testid="network-error"]').count();
    if (errorText > 0) {
      errorFound = true;
      console.log("Caught flaky error on attempt " + (i + 1));
      break;
    }
  }

  expect(errorFound).toBe(true);
});
      `,
    },
  });

  let result;
  do {
    await new Promise((r) => setTimeout(r, 1000));
    result = await runner.getResult(res.runId);
  } while (result.status === "running");

  console.log("Passed:", result.passed);
  console.log("Output:");
  console.log(result.console);
}

main().catch(console.error);
