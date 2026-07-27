import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  DOC_FILES,
  GOVERNANCE_FILES,
  findAppCountViolations,
  findGovernanceYamlSyntaxViolations,
  findMigrationCountViolations,
  findMissingGovernanceFiles,
  findNodeVersionViolations,
  findPlaceholderContactViolations,
  findPrTemplateFieldViolations,
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

test("findMissingGovernanceFiles flags a nonexistent root", () => {
  const missing = findMissingGovernanceFiles("/nonexistent-root-for-test");
  assert.deepEqual(missing, GOVERNANCE_FILES);
});

test("findMissingGovernanceFiles passes once every real governance file exists", () => {
  assert.deepEqual(findMissingGovernanceFiles(), []);
});

test("findGovernanceYamlSyntaxViolations flags invalid YAML", () => {
  const dir = mkdtempSync(join(tmpdir(), "gov-yaml-"));
  mkdirSync(join(dir, ".github", "ISSUE_TEMPLATE"), { recursive: true });
  writeFileSync(join(dir, ".github", "ISSUE_TEMPLATE", "bug_report.yml"), "name: [unterminated");
  const violations = findGovernanceYamlSyntaxViolations(dir);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /invalid YAML/);
});

test("findGovernanceYamlSyntaxViolations passes on the real repo's templates", () => {
  assert.deepEqual(findGovernanceYamlSyntaxViolations(), []);
});

test("findPlaceholderContactViolations flags a generic example.com address", () => {
  const violations = findPlaceholderContactViolations(
    "Report to conduct@example.com.",
    "CODE_OF_CONDUCT.md",
  );
  assert.equal(violations.length, 1);
});

test("findPlaceholderContactViolations passes a real address", () => {
  assert.deepEqual(
    findPlaceholderContactViolations("Report to izzzthisssagar@gmail.com.", "CODE_OF_CONDUCT.md"),
    [],
  );
});

test("findPrTemplateFieldViolations flags a template missing the bug-registry field", () => {
  const violations = findPrTemplateFieldViolations("## Summary\n\n## Tests\n");
  assert.equal(violations.length, 1);
});

test("findPrTemplateFieldViolations passes a template with the field", () => {
  assert.deepEqual(
    findPrTemplateFieldViolations(
      "- [ ] Intentional bug registry checked (BS-###/BA-### unaffected)",
    ),
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
