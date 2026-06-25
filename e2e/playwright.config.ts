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
  ],
});
