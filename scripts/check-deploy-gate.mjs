#!/usr/bin/env node
// Guards the Task 12 deploy gate: a deploy workflow must trigger from CI's
// own completion (never a raw `push`), every release job must explicitly
// re-check `head_branch == 'main'` and `conclusion == 'success'` (a
// workflow_run event fires for every CI run on every branch/outcome — the
// job itself is what has to filter), every checkout must pin to the exact
// `head_sha` CI verified rather than whatever HEAD is when the job starts,
// nothing may `rm -rf .git` (a plain `git archive` at that SHA is the
// reproducible equivalent), every CLI invocation stays pinned to an exact
// version, and every release target must prove it's actually healthy after
// deploying, not just that the deploy command exited 0. See
// docs/superpowers/plans/2026-07-26-release-repository-governance.md Task 12.

import { readFileSync } from "node:fs";
import { extractNpxVersionedCommands, findNpxVersionViolations } from "./check-workflow-pins.mjs";

const DEPLOY_WORKFLOWS = [".github/workflows/deploy.yml", ".github/workflows/deploy-staging.yml"];

export function hasPushTrigger(text) {
  const onMatch = text.match(/^on:\s*\n([\s\S]*?)(?=\njobs:)/m);
  if (!onMatch) return false;
  return /^\s*push:/m.test(onMatch[1]);
}

export function hasWorkflowRunTrigger(text) {
  const onMatch = text.match(/^on:\s*\n([\s\S]*?)(?=\njobs:)/m);
  if (!onMatch) return false;
  return /^\s*workflow_run:\s*\n\s*workflows:\s*\[CI\]/m.test(onMatch[1]);
}

/** Top-level job names in declaration order, e.g. "  deploy:" at 2-space
 *  indent -- not a step, not a matrix key. */
export function extractJobNames(text) {
  const jobsMatch = text.match(/^jobs:\s*\n([\s\S]*)$/m);
  if (!jobsMatch) return [];
  return [...jobsMatch[1].matchAll(/^ {2}([a-zA-Z0-9_-]+):\s*$/gm)].map((m) => m[1]);
}

/** The job-level `if:` condition for one named job (inline or a `>-`/`|`
 *  block scalar), or null if it has none. Anchored to exactly 4-space indent
 *  (one level under a 2-space job name) so a step's own `if:` deeper inside
 *  the job body is never mistaken for the job-level gate. */
export function extractJobGateCondition(text, jobName) {
  const jobRe = new RegExp(`\\n {2}${jobName}:\\n([\\s\\S]*?)(?=\\n {2}[a-zA-Z0-9_-]+:\\n|$)`);
  const jobMatch = text.match(jobRe);
  if (!jobMatch) return null;
  const jobBody = jobMatch[1];

  const blockMatch = jobBody.match(/^ {4}if:\s*[>|]-?\s*\n((?: {6,}.+\n?)+)/m);
  if (blockMatch) {
    return blockMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ");
  }

  const inlineMatch = jobBody.match(/^ {4}if:\s*(.+)$/m);
  return inlineMatch ? inlineMatch[1].trim() : null;
}

export function findJobGateViolations(text) {
  const violations = [];
  for (const job of extractJobNames(text)) {
    const condition = extractJobGateCondition(text, job);
    if (!condition) {
      violations.push(`job "${job}" has no if: gate condition`);
      continue;
    }
    if (!condition.includes("head_branch") || !condition.includes("'main'")) {
      violations.push(`job "${job}" does not check head_branch == 'main'`);
    }
    if (!condition.includes("conclusion") || !condition.includes("'success'")) {
      violations.push(`job "${job}" does not check conclusion == 'success'`);
    }
  }
  return violations;
}

/** Every `ref:` value that immediately follows a checkout step. */
export function extractCheckoutRefs(text) {
  const refs = [];
  const re = /uses:\s*actions\/checkout@[^\n]*\n(?:.*\n)*?\s*ref:\s*(.+)/g;
  let m;
  while ((m = re.exec(text))) refs.push(m[1].trim());
  return refs;
}

export function findCheckoutRefViolations(refs) {
  return refs
    .filter((ref) => ref !== "${{ github.event.workflow_run.head_sha }}")
    .map((ref) => `checkout ref "${ref}" is not the exact workflow_run.head_sha`);
}

export function hasRmRfGit(text) {
  return /rm\s+-rf\s+\.git\b/.test(text);
}

export function hasHealthCheck(text) {
  return /(health.?check|smoke.?check)/i.test(text) && /curl\b/.test(text);
}

function main() {
  const errors = [];

  for (const file of DEPLOY_WORKFLOWS) {
    const text = readFileSync(file, "utf8");

    if (hasPushTrigger(text)) {
      errors.push(`${file}: triggers on push -- must trigger from CI's completion instead`);
    }
    if (!hasWorkflowRunTrigger(text)) {
      errors.push(`${file}: missing a workflow_run: { workflows: [CI], ... } trigger`);
    }
    for (const v of findJobGateViolations(text)) errors.push(`${file}: ${v}`);

    const checkoutRefs = extractCheckoutRefs(text);
    if (checkoutRefs.length === 0) {
      errors.push(`${file}: no checkout step pins a ref at all`);
    }
    for (const v of findCheckoutRefViolations(checkoutRefs)) errors.push(`${file}: ${v}`);

    if (hasRmRfGit(text)) {
      errors.push(`${file}: runs "rm -rf .git" -- use git archive at the exact SHA instead`);
    }

    for (const v of findNpxVersionViolations(extractNpxVersionedCommands(text))) {
      errors.push(`${file}: ${v}`);
    }

    if (!hasHealthCheck(text)) {
      errors.push(`${file}: no post-deploy health check found`);
    }
  }

  if (errors.length > 0) {
    console.error("Deploy gate check failed (Task 12):");
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
    return;
  }

  console.log(`check-deploy-gate: OK (${DEPLOY_WORKFLOWS.length} deploy workflow(s) checked)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
