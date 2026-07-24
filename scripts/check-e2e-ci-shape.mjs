#!/usr/bin/env node
// Guards the P4-3 CI shape so a later edit can't silently regress it back to
// one long-tail job: the e2e-core shard count in ci.yml's matrix must match
// the `--shard=N/total` denominator it passes to e2e-shard.yml, and the
// visual/a11y suite must stay both (a) excluded from the un-gated main
// config and (b) gated behind `main` + the `full-e2e` label.

import { readFileSync } from "node:fs";

const CI_YML = ".github/workflows/ci.yml";
const MAIN_CONFIG = "e2e/playwright.config.ts";
const FULL_CONFIG = "e2e/playwright.full.config.ts";

export function extractShardCounts(ciYml) {
  const matrixMatch = ciYml.match(/matrix:\s*\n\s*shard:\s*\[([\d,\s]+)\]/);
  const argsMatch = ciYml.match(/--shard=\$\{\{\s*matrix\.shard\s*\}\}\/(\d+)/);
  return {
    matrixSize: matrixMatch ? matrixMatch[1].split(",").filter((s) => s.trim() !== "").length : null,
    shardTotal: argsMatch ? Number(argsMatch[1]) : null,
  };
}

export function extractFullGateCondition(ciYml) {
  const jobMatch = ciYml.match(/e2e-full:\n(?:.*\n)*?\s*if:\s*(.+)\n/);
  return jobMatch ? jobMatch[1].trim() : null;
}

function main() {
  const errors = [];

  const ciYml = readFileSync(CI_YML, "utf8");
  const mainConfig = readFileSync(MAIN_CONFIG, "utf8");
  const fullConfig = readFileSync(FULL_CONFIG, "utf8");

  const { matrixSize, shardTotal } = extractShardCounts(ciYml);
  if (matrixSize === null || shardTotal === null) {
    errors.push("Could not find e2e-core's matrix.shard array or --shard=N/total arg in ci.yml.");
  } else if (matrixSize !== shardTotal) {
    errors.push(
      `e2e-core matrix has ${matrixSize} shard(s) but --shard denominator is ${shardTotal} — every job must cover exactly 1/total of the suite.`,
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

  if (!/testIgnore:\s*\[[^\]]*visual\.spec\.ts/.test(mainConfig)) {
    errors.push("e2e/playwright.config.ts must testIgnore visual.spec.ts (it runs gated, via playwright.full.config.ts).");
  }
  if (!/testIgnore:\s*\[[^\]]*a11y\.spec\.ts/.test(mainConfig)) {
    errors.push("e2e/playwright.config.ts must testIgnore a11y.spec.ts (it runs gated, via playwright.full.config.ts).");
  }

  if (!/testMatch:\s*\[[^\]]*visual\.spec\.ts/.test(fullConfig)) {
    errors.push("e2e/playwright.full.config.ts must testMatch visual.spec.ts.");
  }
  if (!/testMatch:\s*\[[^\]]*a11y\.spec\.ts/.test(fullConfig)) {
    errors.push("e2e/playwright.full.config.ts must testMatch a11y.spec.ts.");
  }

  if (errors.length > 0) {
    console.error("E2E CI shape check failed (P4-3):");
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
    return;
  }

  console.log(`E2E CI shape OK — ${matrixSize} shards, e2e-full gated on: ${gateCondition}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
