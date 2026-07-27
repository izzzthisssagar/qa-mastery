import { defineConfig } from "@playwright/test";

/**
 * Config for `playwright merge-reports` (Task 10) — takes the blob reports
 * every CI shard/suite uploads (core ×4, buggyapi, first-paint, and full
 * when it runs) and produces the one report humans actually look at: an HTML
 * report plus a JUnit XML for any downstream test-result tooling. Not a
 * normal test config — merge-reports only reads its `reporter` field.
 */
export default defineConfig({
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["junit", { outputFile: "playwright-report/junit.xml" }],
  ],
});
