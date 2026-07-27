import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  extractCheckoutRefs,
  extractJobGateCondition,
  extractJobNames,
  findCheckoutRefViolations,
  findJobGateViolations,
  hasHealthCheck,
  hasPushTrigger,
  hasRmRfGit,
  hasWorkflowRunTrigger,
} from "../check-deploy-gate.mjs";

const DEPLOY_WORKFLOWS = [".github/workflows/deploy.yml", ".github/workflows/deploy-staging.yml"];

test("hasPushTrigger detects a push trigger", () => {
  assert.equal(hasPushTrigger("on:\n  push:\n    branches: [main]\njobs:\n  x:\n"), true);
});

test("hasPushTrigger is false once push is replaced by workflow_run", () => {
  assert.equal(
    hasPushTrigger(
      "on:\n  workflow_run:\n    workflows: [CI]\n    types: [completed]\njobs:\n  x:\n",
    ),
    false,
  );
});

test("hasWorkflowRunTrigger requires the CI workflow name specifically", () => {
  assert.equal(
    hasWorkflowRunTrigger(
      "on:\n  workflow_run:\n    workflows: [CI]\n    types: [completed]\njobs:\n  x:\n",
    ),
    true,
  );
  assert.equal(hasWorkflowRunTrigger("on:\n  push:\n    branches: [main]\njobs:\n  x:\n"), false);
});

test("extractJobNames lists top-level jobs only, not steps or matrix keys", () => {
  const yml = `
jobs:
  deploy:
    strategy:
      matrix:
        include:
          - app: platform
    steps:
      - name: checkout
  deploy-ws:
    runs-on: ubuntu-latest
`;
  assert.deepEqual(extractJobNames(yml), ["deploy", "deploy-ws"]);
});

test("extractJobGateCondition reads a >- block-scalar job-level if", () => {
  const yml = `
jobs:
  deploy:
    if: >-
      github.event.workflow_run.conclusion == 'success' &&
      github.event.workflow_run.head_branch == 'main'
    runs-on: ubuntu-latest
    steps:
      - name: a step
        if: matrix.project_id != ''
`;
  const condition = extractJobGateCondition(yml, "deploy");
  assert.ok(condition.includes("conclusion == 'success'"));
  assert.ok(condition.includes("head_branch == 'main'"));
});

test("extractJobGateCondition does not mistake a step-level if for the job-level gate", () => {
  const yml = `
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: a step
        if: matrix.project_id != ''
`;
  assert.equal(extractJobGateCondition(yml, "deploy"), null);
});

test("findJobGateViolations flags a job with no gate at all", () => {
  const yml = "jobs:\n  deploy:\n    runs-on: ubuntu-latest\n";
  const violations = findJobGateViolations(yml);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /no if: gate condition/);
});

test("findJobGateViolations flags a gate missing either required check", () => {
  const yml = "jobs:\n  deploy:\n    if: github.event.workflow_run.conclusion == 'success'\n";
  const violations = findJobGateViolations(yml);
  assert.ok(violations.some((v) => v.includes("head_branch")));
});

test("findJobGateViolations passes a job gated on both conditions", () => {
  const yml = `
jobs:
  deploy:
    if: >-
      github.event.workflow_run.conclusion == 'success' &&
      github.event.workflow_run.head_branch == 'main'
`;
  assert.deepEqual(findJobGateViolations(yml), []);
});

test("extractCheckoutRefs reads the ref: that follows a checkout step", () => {
  const yml = `
      - uses: actions/checkout@abc123
        with:
          ref: \${{ github.event.workflow_run.head_sha }}
`;
  assert.deepEqual(extractCheckoutRefs(yml), ["${{ github.event.workflow_run.head_sha }}"]);
});

test("findCheckoutRefViolations rejects anything but the exact head_sha", () => {
  assert.deepEqual(findCheckoutRefViolations(["${{ github.event.workflow_run.head_sha }}"]), []);
  const violations = findCheckoutRefViolations(["main", "${{ github.sha }}"]);
  assert.equal(violations.length, 2);
});

test("hasRmRfGit detects the destructive pattern", () => {
  assert.equal(hasRmRfGit("run: |\n  rm -rf .git\n  npx vercel deploy"), true);
  assert.equal(hasRmRfGit("run: npx vercel deploy"), false);
});

test("hasHealthCheck requires both a health/smoke-check marker and curl", () => {
  assert.equal(hasHealthCheck("- name: Health check\n  run: curl -s http://x/health"), true);
  assert.equal(hasHealthCheck("- name: Smoke-check the API\n  run: curl -s http://x"), true);
  assert.equal(hasHealthCheck("- name: Deploy\n  run: npx vercel deploy"), false);
});

test("every real deploy workflow satisfies the Task 12 gate today", () => {
  for (const file of DEPLOY_WORKFLOWS) {
    const text = readFileSync(file, "utf8");

    assert.equal(hasPushTrigger(text), false, `${file} still triggers on push`);
    assert.equal(hasWorkflowRunTrigger(text), true, `${file} is missing the workflow_run trigger`);

    const gateViolations = findJobGateViolations(text);
    assert.deepEqual(gateViolations, [], `${file}: ${gateViolations.join("; ")}`);

    const checkoutRefs = extractCheckoutRefs(text);
    assert.ok(checkoutRefs.length > 0, `${file} has no pinned checkout ref`);
    assert.deepEqual(findCheckoutRefViolations(checkoutRefs), []);

    assert.equal(hasRmRfGit(text), false, `${file} still runs rm -rf .git`);
    assert.equal(hasHealthCheck(text), true, `${file} has no post-deploy health check`);
  }
});
