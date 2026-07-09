import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

/**
 * BuggyAPI-only suite. Runs as a separate playwright invocation (own
 * webServer) so the main cross-app run never pays for a third Next server —
 * on CI's 2-core runners that contention made timing-sensitive platform
 * tests flake. Same browser matrix as the main config.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/buggyapi.spec.ts",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
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
      command: "pnpm --filter @qa-mastery/buggyapi start",
      url: "http://localhost:3002/api/health",
      reuseExistingServer: false,
      timeout: 120_000,
      env: { ...process.env },
    },
  ],
});
