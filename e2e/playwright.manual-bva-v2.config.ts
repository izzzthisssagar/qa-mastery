import { defineConfig, devices } from "@playwright/test";

/** Sprint 03 public BuggyShop QA only. No auth, Docker, hosted endpoints, or write APIs. */
export default defineConfig({
  testDir: "./tests",
  testMatch: "manual-bva-v2-browser.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BVA_PUBLIC_ORIGIN ?? "http://127.0.0.1:3011",
    ...devices["Desktop Chrome"],
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
