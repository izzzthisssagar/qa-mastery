import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

/**
 * dashboard-first-paint-only suite. CDP's 6x CPU throttle + slow-4G network
 * emulation over 20 consecutive reloads is real CPU load on the runner (the
 * emulation, not the app, is what's expensive) — running it fullyParallel
 * alongside the main suite starved CI's 2-core runner and flaked unrelated
 * tests (e.g. tasks.spec.ts's server-action round trip blowing its own
 * timeout under the contention). workers: 1 + its own invocation keeps that
 * load off the main run, same reasoning as playwright.buggyapi.config.ts.
 * Chromium only — CDP throttling isn't available on WebKit, and the spec
 * itself skips non-chromium.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/dashboard-first-paint.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter @qa-mastery/platform start",
      url: "http://localhost:3000",
      reuseExistingServer: false,
      timeout: 120_000,
      env: { ...process.env, TALENT_ENABLED: "true" },
    },
  ],
});
