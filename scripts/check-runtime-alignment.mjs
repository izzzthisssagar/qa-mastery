#!/usr/bin/env node
// Verifies the repository's single Node/pnpm/dependency policy: engines.node
// is exactly >=24 <25, every app's next and eslint-config-next patch
// versions match, BuggyAPI's direct fast-xml-parser is at least the patched
// minimum, every workspace's @types/node is ^24, and the protected
// supply-chain overrides in pnpm-workspace.yaml are all still present at or
// above their patched floor. See docs/superpowers/plans/
// 2026-07-26-release-repository-governance.md Task 1.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const REQUIRED_NODE_ENGINE = ">=24 <25";
const REQUIRED_TYPES_NODE = "^24";
const REQUIRED_NEXT_VERSION = "16.2.11";

const PROTECTED_OVERRIDES = [
  { name: "js-yaml", floor: [3, 15, 0] },
  { name: "sharp", floor: [0, 35, 0] },
  { name: "fast-xml-parser", floor: [5, 10, 1] },
  { name: "postcss", floor: [8, 5, 18] },
];

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

function parseSemver(raw) {
  const match = String(raw ?? "").match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function semverGte(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return true;
}

function expandGlob(root, pattern) {
  // Only the two shapes this repo's pnpm-workspace.yaml actually uses:
  // a literal directory ("e2e") or one level of "<dir>/*".
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
  const patterns = config.packages ?? [];
  const found = new Set();
  for (const pattern of patterns) {
    for (const rel of expandGlob(root, pattern)) found.add(rel);
  }
  return [...found].sort();
}

/**
 * @param {string} root
 * @returns {string[]} human-readable violation messages, empty when aligned
 */
export function checkRuntimeAlignment(root) {
  const violations = [];

  const rootPkg = readJson(path.join(root, "package.json"));
  if (rootPkg.engines?.node !== REQUIRED_NODE_ENGINE) {
    violations.push(`package.json: engines.node must be ${REQUIRED_NODE_ENGINE}`);
  }

  const workspacePackages = findWorkspacePackages(root);

  for (const rel of workspacePackages) {
    const pkgPath = path.join(root, rel, "package.json");
    const pkg = readJson(pkgPath);

    const nextVersion = pkg.dependencies?.next ?? pkg.devDependencies?.next;
    if (nextVersion) {
      const eslintNext =
        pkg.devDependencies?.["eslint-config-next"] ?? pkg.dependencies?.["eslint-config-next"];
      if (nextVersion !== eslintNext || nextVersion !== REQUIRED_NEXT_VERSION) {
        violations.push(
          `${rel}/package.json: next and eslint-config-next must both be ${REQUIRED_NEXT_VERSION}`,
        );
      }
    }

    const fastXmlParser =
      pkg.dependencies?.["fast-xml-parser"] ?? pkg.devDependencies?.["fast-xml-parser"];
    if (fastXmlParser) {
      const version = parseSemver(fastXmlParser);
      if (!version || !semverGte(version, [5, 10, 1])) {
        violations.push(`${rel}/package.json: fast-xml-parser must be >=5.10.1`);
      }
    }

    const typesNode = pkg.devDependencies?.["@types/node"] ?? pkg.dependencies?.["@types/node"];
    if (typesNode && typesNode !== REQUIRED_TYPES_NODE) {
      violations.push(`${rel}/package.json: @types/node must use ${REQUIRED_TYPES_NODE}`);
    }
  }

  const workspaceFile = path.join(root, "pnpm-workspace.yaml");
  const workspaceConfig = existsSync(workspaceFile)
    ? parseYaml(readFileSync(workspaceFile, "utf8"))
    : {};
  const overrides = workspaceConfig.overrides ?? {};
  const overrideVersions = new Map();
  for (const [key, value] of Object.entries(overrides)) {
    const name = key.split("@")[0];
    overrideVersions.set(name, value);
  }
  for (const { name, floor } of PROTECTED_OVERRIDES) {
    const declared = overrideVersions.get(name);
    const declaredVersion = declared ? parseSemver(declared) : null;
    if (!declaredVersion || !semverGte(declaredVersion, floor)) {
      violations.push(
        `pnpm-workspace.yaml: protected override for "${name}" must be present and >=${floor.join(".")}`,
      );
    }
  }

  return violations;
}

function main() {
  const root = process.cwd();
  const violations = checkRuntimeAlignment(root);
  if (violations.length > 0) {
    console.error("Runtime alignment violations:");
    for (const v of violations) console.error(`  - ${v}`);
    process.exitCode = 1;
    return;
  }
  console.log("Runtime alignment OK.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
