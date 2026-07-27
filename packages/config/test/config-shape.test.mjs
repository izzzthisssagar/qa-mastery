// packages/config ships no TypeScript of its own (it's the source of the
// shared tsconfig/eslint configs, not a consumer) -- these are the real
// checks that stand in for typecheck/test here: the JSON configs parse and
// have the expected shape, and the shared ESLint flat configs actually
// import and export what every other workspace's eslint.config.mjs expects.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function readJson(name) {
  return JSON.parse(readFileSync(path.join(ROOT, name), "utf8"));
}

test("tsconfig.base.json is valid JSON with strict mode on", () => {
  const config = readJson("tsconfig.base.json");
  assert.equal(config.compilerOptions.strict, true);
});

test("tsconfig.react.json is valid JSON", () => {
  const config = readJson("tsconfig.react.json");
  assert.ok(config.compilerOptions);
});

test("eslint.base.mjs exports a non-empty flat config array", async () => {
  const { base, default: def } = await import("../eslint.base.mjs");
  assert.ok(Array.isArray(base));
  assert.ok(base.length > 0);
  assert.equal(def, base);
});

test("eslint.react.mjs extends the base config and adds JSX/browser rules", async () => {
  const { base } = await import("../eslint.base.mjs");
  const { react, default: def } = await import("../eslint.react.mjs");
  assert.ok(Array.isArray(react));
  assert.ok(react.length > base.length);
  assert.equal(def, react);
  const reactEntry = react.find((entry) => entry.plugins && "react-hooks" in entry.plugins);
  assert.ok(reactEntry, "expected a config entry registering the react-hooks plugin");
  assert.deepEqual(reactEntry.files, ["**/*.{jsx,tsx}"]);
});
