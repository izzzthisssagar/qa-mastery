#!/usr/bin/env node
// Verifies that every workspace package participates in lint/typecheck/test
// (so `turbo lint`/`turbo typecheck`/`turbo test` are truthful, not silently
// skipping shared packages and practice apps), and that root `verify`
// names its core static gates exactly once each -- no silent omission, no
// accidental duplicate that masks a missing one. See docs/superpowers/plans/
// 2026-07-26-release-repository-governance.md Task 2.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const REQUIRED_SCRIPTS = ["lint", "typecheck", "test"];

// The core gates Task 2 itself is responsible for wiring into `verify`.
// Later tasks append more script invocations (runtime-alignment, dep-cycles,
// doc-consistency, ...) as those checkers are created; this list is
// intentionally the fixed minimum, not the full eventual command, so this
// checker doesn't need editing every time a later task adds one more line.
export const REQUIRED_VERIFY_GATES = [
  "pnpm format:check",
  "pnpm lint",
  "pnpm typecheck",
  "pnpm test",
  "pnpm --filter @qa-mastery/curriculum sync",
];

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

function expandGlob(root, pattern) {
  if (!pattern.includes("*")) {
    return existsSync(path.join(root, pattern, "package.json")) ? [pattern] : [];
  }
  const base = pattern.replace(/\/\*$/, "");
  const baseDir = path.join(root, base);
  if (!existsSync(baseDir)) return [];
  return readdirSync(baseDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(base, e.name))
    .filter((rel) => existsSync(path.join(root, rel, "package.json")));
}

function findWorkspacePackages(root) {
  const workspaceFile = path.join(root, "pnpm-workspace.yaml");
  if (!existsSync(workspaceFile)) return [];
  const config = parseYaml(readFileSync(workspaceFile, "utf8"));
  const found = new Set();
  for (const pattern of config.packages ?? []) {
    for (const rel of expandGlob(root, pattern)) found.add(rel);
  }
  return [...found].sort();
}

/**
 * @param {string} root
 * @returns {string[]} human-readable violation messages, empty when clean
 */
export function checkWorkspaceScripts(root) {
  const violations = [];

  for (const rel of findWorkspacePackages(root)) {
    const pkgPath = path.join(root, rel, "package.json");
    const pkg = readJson(pkgPath);
    const scripts = pkg.scripts ?? {};
    for (const name of REQUIRED_SCRIPTS) {
      if (!scripts[name] || scripts[name].trim() === "") {
        violations.push(`${rel}/package.json: missing non-empty "${name}" script`);
      }
    }
  }

  const rootPkgPath = path.join(root, "package.json");
  if (existsSync(rootPkgPath)) {
    const rootPkg = readJson(rootPkgPath);
    const verify = rootPkg.scripts?.verify;
    if (!verify || verify.trim() === "") {
      violations.push('package.json: missing "verify" script');
    } else {
      const segments = verify.split("&&").map((s) => s.trim());
      for (const gate of REQUIRED_VERIFY_GATES) {
        const count = segments.filter((s) => s === gate).length;
        if (count === 0) {
          violations.push(`package.json verify: missing required gate "${gate}"`);
        } else if (count > 1) {
          violations.push(`package.json verify: gate "${gate}" appears more than once`);
        }
      }
    }
  }

  return violations;
}

function main() {
  const violations = checkWorkspaceScripts(process.cwd());
  if (violations.length > 0) {
    console.error("Workspace script violations:");
    for (const v of violations) console.error(`  - ${v}`);
    process.exitCode = 1;
    return;
  }
  console.log("Workspace scripts OK.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
