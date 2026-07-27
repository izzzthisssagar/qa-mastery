// Companion to playwright-config-shape.test.mjs (Task 10): where that file
// checks the individual Playwright configs, this checks the artifacts the
// merged-report pipeline depends on -- merge.config.ts's shape, and that
// every suite name scripts/check-e2e-ci-shape.mjs validates in ci.yml maps
// to a real config file in this package. The ci.yml/e2e-shard.yml text
// itself is scripts/check-e2e-ci-shape.mjs's job, not this file's.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const E2E_DIR = fileURLToPath(new URL("..", import.meta.url));

function read(relPath) {
  return readFileSync(path.join(E2E_DIR, relPath), "utf8");
}

test("merge.config.ts exists and configures an HTML and a JUnit reporter", () => {
  const text = read("merge.config.ts");
  assert.match(text, /defineConfig/);
  assert.match(text, /["']html["']/);
  assert.match(text, /["']junit["']/);
});

// e2e-shard.yml's suite -> --config mapping (checks() in the reusable
// workflow) must resolve to a config file that actually exists, or a CI run
// fails with a Playwright "config file not found" error instead of a
// meaningful one.
const SUITE_CONFIGS = {
  core: "playwright.config.ts",
  buggyapi: "playwright.buggyapi.config.ts",
  "first-paint": "playwright.first-paint.config.ts",
  full: "playwright.full.config.ts",
};

test("every suite the reusable workflow can select has a corresponding config file", () => {
  const shardYml = readFileSync(
    fileURLToPath(new URL("../../.github/workflows/e2e-shard.yml", import.meta.url)),
    "utf8",
  );
  for (const [suite, configFile] of Object.entries(SUITE_CONFIGS)) {
    assert.match(
      shardYml,
      new RegExp(
        `${suite}\\)[^;]*--config=${configFile.replace(/\./g, "\\.")}|${suite}\\)\\s*CONFIG_ARGS=""`,
      ),
      `e2e-shard.yml's suite case for "${suite}" doesn't reference ${configFile}`,
    );
    // The file itself must exist and load-parse as a config.
    const text = read(configFile);
    assert.match(text, /defineConfig/, `${configFile} does not call defineConfig`);
  }
});
