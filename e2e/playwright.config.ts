import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

/**
 * Cross-app suite: boots BOTH apps (platform :3000, buggyshop :3001).
 * Always runs against production builds (`next start`) — dev-mode cold
 * compiles swallow clicks before hydration and make WebKit flaky. The root
 * `pnpm e2e` script chains `turbo build` first (cached → cheap).
 * WebKit is in the matrix on purpose: the iframe/token handoff must stay
 * Safari-proof (architecture risk #1).
 */
export default defineConfig({
  testDir: "./tests",
  // BuggyAPI has its own config (playwright.buggyapi.config.ts) booting only
  // its own server — a third Next server in THIS run starved the CI runner
  // and made timing-sensitive talent/widget tests flake.
  testIgnore: "**/buggyapi.spec.ts",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  // Visual regression (visual.spec.ts) only produces stable diffs when every
  // run — baseline capture AND every comparison after — happens inside the
  // same pinned environment (see docs/known-issues/visual-regression-baselines.md).
  // CI runs the whole e2e job in mcr.microsoft.com/playwright:v1.60.0-noble
  // specifically for this; running it on a bare/host Playwright install
  // re-introduces font drift. A small tolerance absorbs harmless sub-pixel
  // anti-aliasing noise without hiding a real visual change.
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  use: {
    // retain-on-failure, not on-first-retry: the latter records only the
    // retry, so a first attempt that fails and then retry-passes leaves no
    // trace — which is exactly how the "WebKit save stall" stayed
    // undiagnosable for weeks (docs/known-issues/webkit-save-stall.md).
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
      // Talent ships dark behind TALENT_ENABLED; turn it on so the marketplace
      // e2e can reach /talent. Spread process.env to keep the Supabase vars CI
      // exports before running e2e.
      env: { ...process.env, TALENT_ENABLED: "true" },
    },
    {
      command: "pnpm --filter @qa-mastery/buggyshop start",
      url: "http://localhost:3001",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    // BuggyAPI is deliberately NOT booted here — this run ignores
    // buggyapi.spec.ts (see testIgnore above), so a third Next server on the
    // 2-core CI runner only adds contention that flakes the learner/talent
    // suites. BuggyAPI e2e boots its own server via playwright.buggyapi.config.ts.
  ],
});
