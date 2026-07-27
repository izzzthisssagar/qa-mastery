import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

/**
 * Visual-regression + a11y suite. Both specs only ever hit the platform app
 * (BASE=localhost:3000), so this boots a single webServer — same reasoning
 * as playwright.buggyapi.config.ts / playwright.first-paint.config.ts for why
 * this lives in its own invocation rather than the main config.
 * Gated to `main` pushes + PRs carrying the `full-e2e` label (see
 * .github/workflows/ci.yml's e2e-full job, Task 10) rather than run on every
 * push: toHaveScreenshot's baselines and axe's full-page scans are the
 * slowest, most environment-sensitive specs in the suite (see
 * docs/known-issues/visual-regression-baselines.md).
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/visual.spec.ts", "**/a11y.spec.ts"],
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  // CI overrides this to blob via `--reporter=blob` on the command line (see
  // .github/workflows/e2e-shard.yml) so every suite's report can be merged
  // into one; this default stays list/html for a plain local run.
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  use: {
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      command: "pnpm --filter @qa-mastery/platform start",
      url: "http://localhost:3000",
      reuseExistingServer: false,
      timeout: 120_000,
      // a11y's talent-directory case hits /talent/testers, which ships dark
      // behind TALENT_ENABLED.
      env: { ...process.env, TALENT_ENABLED: "true" },
    },
  ],
});
