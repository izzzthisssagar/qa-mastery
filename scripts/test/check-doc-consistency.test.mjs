import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  DOC_FILES,
  findAppCountViolations,
  findMigrationCountViolations,
  findNodeVersionViolations,
  findUndocumentedCommandViolations,
  getAppNames,
  getMigrationCount,
  getNodeMajor,
  getRootScripts,
} from "../check-doc-consistency.mjs";

test("findAppCountViolations flags 'two apps' once there are three", () => {
  const violations = findAppCountViolations("Both apps deploy together.", [
    "buggyapi",
    "buggyshop",
    "platform",
  ]);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /both apps/i);
});

test("findAppCountViolations passes when the count actually is two", () => {
  assert.deepEqual(findAppCountViolations("Both apps deploy together.", ["a", "b"]), []);
});

test("findAppCountViolations ignores text that doesn't claim a specific count", () => {
  assert.deepEqual(findAppCountViolations("Three apps and one service.", ["a", "b", "c"]), []);
});

test("findNodeVersionViolations flags a stale prior Node major", () => {
  const violations = findNodeVersionViolations("Requires Node >=20.", 24);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /Node 20/);
});

test("findNodeVersionViolations passes when the major matches", () => {
  assert.deepEqual(findNodeVersionViolations("Requires Node >=24.", 24), []);
});

test("findNodeVersionViolations does not flag an unrelated two-digit number", () => {
  assert.deepEqual(findNodeVersionViolations("Runs on port 3000, Node.js.", 24), []);
});

test("findMigrationCountViolations flags a stale count", () => {
  const violations = findMigrationCountViolations("Postgres, 13 migrations", 37);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /13 migrations/);
});

test("findMigrationCountViolations passes when the count matches", () => {
  assert.deepEqual(findMigrationCountViolations("Postgres, 37 migrations", 37), []);
});

test("findMigrationCountViolations ignores an unrelated hyphenated number (e.g. 'Phase-0 migration')", () => {
  assert.deepEqual(findMigrationCountViolations("continuing the Phase-0 migration", 37), []);
});

test("findUndocumentedCommandViolations flags a pnpm command that isn't a real root script", () => {
  const violations = findUndocumentedCommandViolations("Run `pnpm nonexistent-script`.", [
    "dev",
    "build",
  ]);
  assert.equal(violations.length, 1);
});

test("findUndocumentedCommandViolations passes a real root script", () => {
  assert.deepEqual(findUndocumentedCommandViolations("Run `pnpm build`.", ["dev", "build"]), []);
});

test("findUndocumentedCommandViolations does not flag `pnpm exec` or `pnpm install`", () => {
  assert.deepEqual(
    findUndocumentedCommandViolations("Run `pnpm exec` then `pnpm install`.", ["dev"]),
    [],
  );
});

test("every real doc in the file list has zero drift violations today", () => {
  const appNames = getAppNames();
  const nodeMajor = getNodeMajor();
  const migrationCount = getMigrationCount();
  const rootScripts = getRootScripts();

  assert.ok(appNames.length > 0);
  assert.ok(nodeMajor !== null);
  assert.ok(migrationCount > 0);
  assert.ok(rootScripts.length > 0);

  const violations = [];
  for (const file of DOC_FILES) {
    const text = readFileSync(file, "utf8");
    violations.push(
      ...findAppCountViolations(text, appNames).map((v) => `${file}: ${v}`),
      ...findNodeVersionViolations(text, nodeMajor).map((v) => `${file}: ${v}`),
      ...findMigrationCountViolations(text, migrationCount).map((v) => `${file}: ${v}`),
      ...findUndocumentedCommandViolations(text, rootScripts).map((v) => `${file}: ${v}`),
    );
  }
  assert.deepEqual(violations, []);
});
