import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  extractArtifactSuffixes,
  extractFullGateCondition,
  extractReleaseGateNeeds,
  extractReusableWorkflowInputs,
  extractShardCounts,
  hasMergeJob,
  usesBlobReporter,
} from "../check-e2e-ci-shape.mjs";

test("extractShardCounts reads the matrix size and shard_total", () => {
  const yml = `
  e2e-core:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    with:
      shard_total: 4
`;
  assert.deepEqual(extractShardCounts(yml), { matrixSize: 4, shardTotal: 4 });
});

test("extractShardCounts returns null fields when either is absent", () => {
  assert.deepEqual(extractShardCounts("no matrix here"), { matrixSize: null, shardTotal: null });
});

test("extractFullGateCondition reads e2e-full's if condition", () => {
  const yml = `
  e2e-full:
    needs: checks
    if: github.ref == 'refs/heads/main' || contains(github.event.pull_request.labels.*.name, 'full-e2e')
    uses: ./.github/workflows/e2e-shard.yml
`;
  const condition = extractFullGateCondition(yml);
  assert.ok(condition.includes("refs/heads/main"));
  assert.ok(condition.includes("full-e2e"));
});

test("extractFullGateCondition returns null when the job or its if is missing", () => {
  assert.equal(extractFullGateCondition("jobs:\n  checks:\n    runs-on: ubuntu-latest\n"), null);
});

test("extractArtifactSuffixes collects every artifact_suffix value", () => {
  const yml = `
  e2e-core:
    with:
      artifact_suffix: core-\${{ matrix.shard }}
  e2e-buggyapi:
    with:
      artifact_suffix: buggyapi
  e2e-full:
    with:
      artifact_suffix: full
`;
  const suffixes = extractArtifactSuffixes(yml);
  assert.equal(suffixes.length, 3);
  assert.ok(suffixes.some((s) => s.includes("matrix.shard")));
  assert.ok(suffixes.includes("buggyapi"));
  assert.ok(suffixes.includes("full"));
});

test("extractReleaseGateNeeds reads the needs array as a list of job ids", () => {
  const yml = `
  release-gate:
    needs: [checks, rls, e2e-core, e2e-buggyapi, e2e-first-paint, e2e-full, merge-playwright-reports]
    if: always()
`;
  const needs = extractReleaseGateNeeds(yml);
  assert.deepEqual(needs, [
    "checks",
    "rls",
    "e2e-core",
    "e2e-buggyapi",
    "e2e-first-paint",
    "e2e-full",
    "merge-playwright-reports",
  ]);
});

test("extractReleaseGateNeeds returns null when release-gate has no needs array", () => {
  assert.equal(extractReleaseGateNeeds("jobs:\n  checks:\n    runs-on: ubuntu-latest\n"), null);
});

test("extractReusableWorkflowInputs reads the workflow_call.inputs keys", () => {
  const yml = `
on:
  workflow_call:
    inputs:
      suite:
        required: true
        type: string
      shard:
        required: false
        type: number
      shard_total:
        required: false
        type: number
      artifact_suffix:
        required: true
        type: string

env:
  SANDBOX_JWT_SECRET: x
`;
  assert.deepEqual(extractReusableWorkflowInputs(yml), [
    "suite",
    "shard",
    "shard_total",
    "artifact_suffix",
  ]);
});

test("usesBlobReporter detects the --reporter=blob flag", () => {
  assert.equal(usesBlobReporter("run: playwright test --reporter=blob"), true);
  assert.equal(usesBlobReporter("run: playwright test --reporter=html"), false);
});

test("hasMergeJob detects the merge-playwright-reports job and its command", () => {
  const yml = `
  merge-playwright-reports:
    needs: [e2e-core]
    steps:
      - run: pnpm --filter @qa-mastery/e2e exec playwright merge-reports --config=merge.config.ts ./all-blob-reports
`;
  assert.equal(hasMergeJob(yml), true);
});

test("hasMergeJob is false when either the job or the command is missing", () => {
  assert.equal(hasMergeJob("jobs:\n  checks:\n    runs-on: ubuntu-latest\n"), false);
});

test("the real ci.yml and e2e-shard.yml satisfy every shape requirement today", () => {
  const ciYml = readFileSync(".github/workflows/ci.yml", "utf8");
  const shardYml = readFileSync(".github/workflows/e2e-shard.yml", "utf8");

  const { matrixSize, shardTotal } = extractShardCounts(ciYml);
  assert.equal(matrixSize, 4);
  assert.equal(shardTotal, 4);

  const gateCondition = extractFullGateCondition(ciYml);
  assert.ok(gateCondition.includes("refs/heads/main"));
  assert.ok(gateCondition.includes("full-e2e"));

  const needs = extractReleaseGateNeeds(ciYml);
  for (const required of [
    "checks",
    "rls",
    "e2e-core",
    "e2e-buggyapi",
    "e2e-first-paint",
    "e2e-full",
    "merge-playwright-reports",
  ]) {
    assert.ok(needs.includes(required), `release-gate needs is missing "${required}"`);
  }

  assert.equal(hasMergeJob(ciYml), true);

  const reusableInputs = extractReusableWorkflowInputs(shardYml);
  for (const required of ["suite", "shard", "shard_total", "artifact_suffix"]) {
    assert.ok(reusableInputs.includes(required), `e2e-shard.yml is missing input "${required}"`);
  }

  assert.equal(usesBlobReporter(shardYml), true);
});
