import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

/**
 * Cross-app suite: boots BOTH apps (platform :3000, buggyshop :3001).
 * Locally reuses already-running dev servers; in CI runs production builds
 * (`next start`) — CI builds both apps in an earlier step.
 * WebKit is in the matrix on purpose: the iframe/token handoff must stay
 * Safari-proof (architecture risk #1).
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      command: CI
        ? "pnpm --filter @qa-mastery/platform start"
        : "pnpm --filter @qa-mastery/platform dev",
      url: "http://localhost:3000",
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
    {
      command: CI
        ? "pnpm --filter @qa-mastery/buggyshop start"
        : "pnpm --filter @qa-mastery/buggyshop dev",
      url: "http://localhost:3001",
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
  ],
});
