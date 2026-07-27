#!/usr/bin/env node
// Guards the Task 10 CI shape (adapted from the interrupted draft at
// 13dc612, extended for the merge/release-gate jobs that draft never had) so
// a later edit can't silently regress it back to one long-tail job: the
// e2e-core shard count must match the shard_total it passes to the reusable
// workflow, every shard/suite must get a unique artifact suffix, the reusable
// workflow must actually use the blob reporter, a merge job must exist, and
// release-gate's `needs` must list every job this task added. See
// docs/superpowers/plans/2026-07-26-release-repository-governance.md Task 10.

import { readFileSync } from "node:fs";

const CI_YML = ".github/workflows/ci.yml";
const SHARD_YML = ".github/workflows/e2e-shard.yml";

export function extractShardCounts(ciYml) {
  const matrixMatch = ciYml.match(/matrix:\s*\n\s*shard:\s*\[([\d,\s]+)\]/);
  const totalMatch = ciYml.match(/shard_total:\s*(\d+)/);
  return {
    matrixSize: matrixMatch
      ? matrixMatch[1].split(",").filter((s) => s.trim() !== "").length
      : null,
    shardTotal: totalMatch ? Number(totalMatch[1]) : null,
  };
}

export function extractFullGateCondition(ciYml) {
  const jobMatch = ciYml.match(/\n {2}e2e-full:\n(?:.*\n)*?\s*if:\s*(.+)\n/);
  return jobMatch ? jobMatch[1].trim() : null;
}

export function extractArtifactSuffixes(ciYml) {
  return [...ciYml.matchAll(/artifact_suffix:\s*(.+)/g)].map((m) => m[1].trim());
}

export function extractReleaseGateNeeds(ciYml) {
  const jobMatch = ciYml.match(/\n {2}release-gate:\n(?:.*\n)*?\s*needs:\s*\n?\s*\[([^\]]+)\]/);
  return jobMatch ? jobMatch[1].split(",").map((s) => s.trim()) : null;
}

export function extractReusableWorkflowInputs(shardYml) {
  const inputsBlockMatch = shardYml.match(/workflow_call:\s*\n\s*inputs:\s*\n([\s\S]*?)\nenv:/);
  if (!inputsBlockMatch) return [];
  return [...inputsBlockMatch[1].matchAll(/^ {6}([a-z_]+):\s*$/gm)].map((m) => m[1]);
}

export function usesBlobReporter(shardYml) {
  return /--reporter=blob/.test(shardYml);
}

export function hasMergeJob(ciYml) {
  return /\n {2}merge-playwright-reports:/.test(ciYml) && /playwright merge-reports/.test(ciYml);
}

const REQUIRED_GATE_NEEDS = [
  "checks",
  "rls",
  "e2e-core",
  "e2e-buggyapi",
  "e2e-first-paint",
  "e2e-full",
  "merge-playwright-reports",
];

const REQUIRED_REUSABLE_INPUTS = ["suite", "shard", "shard_total", "artifact_suffix"];

function main() {
  const errors = [];

  const ciYml = readFileSync(CI_YML, "utf8");
  const shardYml = readFileSync(SHARD_YML, "utf8");

  const { matrixSize, shardTotal } = extractShardCounts(ciYml);
  if (matrixSize === null || shardTotal === null) {
    errors.push("Could not find e2e-core's matrix.shard array or a shard_total value in ci.yml.");
  } else if (matrixSize !== 4) {
    errors.push(`e2e-core matrix has ${matrixSize} shard(s), expected exactly 4.`);
  } else if (matrixSize !== shardTotal) {
    errors.push(
      `e2e-core matrix has ${matrixSize} shard(s) but shard_total is ${shardTotal} — every job must cover exactly 1/total of the suite.`,
    );
  }

  const gateCondition = extractFullGateCondition(ciYml);
  if (!gateCondition) {
    errors.push("e2e-full job is missing an `if:` gate condition.");
  } else {
    if (!gateCondition.includes("refs/heads/main")) {
      errors.push("e2e-full's gate condition no longer checks for a push to `main`.");
    }
    if (!gateCondition.includes("full-e2e")) {
      errors.push("e2e-full's gate condition no longer checks for the `full-e2e` label.");
    }
  }

  const suffixes = extractArtifactSuffixes(ciYml);
  const literalSuffixes = suffixes.filter((s) => !s.includes("matrix."));
  const uniqueLiteral = new Set(literalSuffixes);
  if (uniqueLiteral.size !== literalSuffixes.length) {
    errors.push(
      `Duplicate literal artifact_suffix value(s) in ci.yml: ${literalSuffixes.join(", ")}`,
    );
  }
  if (!suffixes.some((s) => s.includes("matrix.shard"))) {
    errors.push(
      "e2e-core's artifact_suffix must incorporate matrix.shard so each shard's blob report is unique.",
    );
  }

  const gateNeeds = extractReleaseGateNeeds(ciYml);
  if (!gateNeeds) {
    errors.push("release-gate job is missing a `needs:` array.");
  } else {
    for (const required of REQUIRED_GATE_NEEDS) {
      if (!gateNeeds.includes(required)) {
        errors.push(`release-gate's needs is missing "${required}".`);
      }
    }
  }

  if (!hasMergeJob(ciYml)) {
    errors.push(
      "ci.yml must have a merge-playwright-reports job that runs `playwright merge-reports`.",
    );
  }

  const reusableInputs = extractReusableWorkflowInputs(shardYml);
  for (const required of REQUIRED_REUSABLE_INPUTS) {
    if (!reusableInputs.includes(required)) {
      errors.push(`e2e-shard.yml's workflow_call.inputs is missing "${required}".`);
    }
  }

  if (!usesBlobReporter(shardYml)) {
    errors.push("e2e-shard.yml must invoke Playwright with --reporter=blob.");
  }

  if (errors.length > 0) {
    console.error("E2E CI shape check failed (Task 10):");
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `E2E CI shape OK — ${matrixSize} shards, e2e-full gated on: ${gateCondition}, release-gate needs ${gateNeeds.length} jobs.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
