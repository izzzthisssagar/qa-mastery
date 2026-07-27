// Lightweight structural checks on the Playwright config files -- a Node
// test, not an alias for the expensive browser suite itself (that stays
// `pnpm --filter @qa-mastery/e2e e2e`). Text-based rather than importing the
// .ts files directly, since these configs are plain TypeScript with no
// build step of their own. Task 10 (E2E sharding) extends this file/adds
// ci-shape.test.mjs alongside it.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const E2E_DIR = fileURLToPath(new URL("..", import.meta.url));

function readConfig(name) {
  return readFileSync(path.join(E2E_DIR, name), "utf8");
}

test("playwright.config.ts declares a testDir and excludes the specialized suites", () => {
  const text = readConfig("playwright.config.ts");
  assert.match(text, /testDir:\s*["']\.\/tests["']/);
  assert.match(text, /testIgnore:/);
  assert.match(text, /buggyapi\.spec\.ts/);
  assert.match(text, /dashboard-first-paint\.spec\.ts/);
  // Task 10: visual/a11y run gated, via playwright.full.config.ts, not here.
  assert.match(text, /visual\.spec\.ts/);
  assert.match(text, /a11y\.spec\.ts/);
});

test("playwright.full.config.ts exists and matches exactly the visual + a11y suites", () => {
  const text = readConfig("playwright.full.config.ts");
  assert.match(text, /defineConfig/);
  assert.match(text, /testMatch:\s*\[[^\]]*visual\.spec\.ts/);
  assert.match(text, /testMatch:\s*\[[^\]]*a11y\.spec\.ts/);
});

test("playwright.buggyapi.config.ts exists and defines its own config", () => {
  const text = readConfig("playwright.buggyapi.config.ts");
  assert.match(text, /defineConfig/);
});

test("playwright.first-paint.config.ts runs single-worker for stable throttled timing", () => {
  const text = readConfig("playwright.first-paint.config.ts");
  assert.match(text, /defineConfig/);
  assert.match(text, /workers:\s*1/);
});

test("no config file hardcodes a non-CI-conditional retry count above 0", () => {
  for (const name of [
    "playwright.config.ts",
    "playwright.buggyapi.config.ts",
    "playwright.first-paint.config.ts",
    "playwright.full.config.ts",
  ]) {
    const text = readConfig(name);
    const retriesMatch = text.match(/retries:\s*([^,\n]+)/);
    if (retriesMatch) {
      assert.match(
        retriesMatch[1].trim(),
        /CI/,
        `${name}: retries should be conditioned on CI, found "${retriesMatch[1].trim()}"`,
      );
    }
  }
});
