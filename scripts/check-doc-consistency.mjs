#!/usr/bin/env node
// Guards prose docs against drifting away from the code they describe.
// Derives the facts that actually change over time (app/service names, the
// Node engine range, the migration count, and which `pnpm <script>` commands
// really exist) from the repo itself, then checks each doc for the specific
// stale phrasings this drifts into: "two apps"/"both apps" once there are
// three, an old Node major, a stale migration count, a documented command
// that no longer exists. This is a text-level presence check, not an NLP
// fact-checker — new stale phrasing needs a new pattern here, the same as
// every other check-*.mjs gate in this repo. See docs/superpowers/plans/
// 2026-07-26-release-repository-governance.md Task 13.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { parse as parseYaml } from "yaml";

export const GOVERNANCE_FILES = [
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  ".github/ISSUE_TEMPLATE/technical_debt.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/pull_request_template.md",
];

const PLACEHOLDER_CONTACT_PATTERNS = [
  /\[INSERT[^\]]*\]/i,
  /your-?email@example\.com/i,
  /you@example\.com/i,
  /INSERT_EMAIL/i,
  /TODO:?\s*(add|insert|fill in)?\s*contact/i,
  /conduct@example\.com/i,
  /security@example\.com/i,
  /<[^>]*email[^>]*>/i,
];

export const DOC_FILES = [
  "README.md",
  "ARCHITECTURE.md",
  "CLAUDE.md",
  "DEPLOYMENT.md",
  "SECURITY.md",
  "docs/README.md",
  "docs/01-overview.md",
  "docs/02-architecture.md",
  "docs/04-invariants.md",
  "docs/07-development.md",
  "docs/08-decisions.md",
  "docs/09-deployment.md",
  "docs/10-caching.md",
];

export function getAppNames(root = ".") {
  return readdirSync(`${root}/apps`, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

export function getServiceNames(root = ".") {
  try {
    return readdirSync(`${root}/services`, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

export function getMigrationCount(root = ".") {
  return readdirSync(`${root}/supabase/migrations`).filter((f) => f.endsWith(".sql")).length;
}

export function getNodeMajor(root = ".") {
  const pkg = JSON.parse(readFileSync(`${root}/package.json`, "utf8"));
  const m = String(pkg.engines?.node ?? "").match(/>=\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

export function getRootScripts(root = ".") {
  const pkg = JSON.parse(readFileSync(`${root}/package.json`, "utf8"));
  return Object.keys(pkg.scripts ?? {});
}

/** A doc claiming exactly "two apps"/"both apps" is stale once there are a
 *  different number of real apps in apps/. */
export function findAppCountViolations(text, appNames) {
  const violations = [];
  if (appNames.length !== 2) {
    for (const m of text.matchAll(/\b(two apps|both apps)\b/gi)) {
      violations.push(`says "${m[0]}" but apps/ has ${appNames.length}: ${appNames.join(", ")}`);
    }
  }
  return violations;
}

/** A stale prior Node major mentioned as a floor (">=20", "Node 20",
 *  "node-version: 20") once the real floor has moved on. */
export function findNodeVersionViolations(text, actualMajor) {
  const violations = [];
  const re = /\bnode(?:[\s.-]?version)?\s*(?:is\s*)?(?:>=)?\s*(\d{2})\b/gi;
  for (const m of text.matchAll(re)) {
    const major = Number(m[1]);
    if (major !== actualMajor && major >= 16 && major <= 22) {
      violations.push(`mentions Node ${major}, but the repo now requires >=${actualMajor}`);
    }
  }
  return violations;
}

/** A stale migration count ("N migrations", plural) once the real count has
 *  grown. Requires the plural form and a non-hyphenated digit so an
 *  unrelated "Phase-0 migration" doesn't false-positive as a count claim. */
export function findMigrationCountViolations(text, actualCount) {
  const violations = [];
  for (const m of text.matchAll(/(?<!-)\b(\d+)\s+migrations\b/gi)) {
    const claimed = Number(m[1]);
    if (claimed !== actualCount) {
      violations.push(`says "${claimed} migrations" but supabase/migrations/ has ${actualCount}`);
    }
  }
  return violations;
}

/** Every `` `pnpm <word...>` `` (or bare `pnpm <word>` in a fenced block,
 *  matched line-by-line by the caller) mentioning a root script that isn't
 *  actually declared in package.json's "scripts". Subcommands like
 *  `pnpm --filter X run` or `pnpm exec` are intentionally not root scripts
 *  and are skipped. */
export function findUndocumentedCommandViolations(text, rootScripts) {
  const violations = [];
  const re = /`pnpm ([a-z][a-z0-9:_-]*)`/g;
  for (const m of text.matchAll(re)) {
    const script = m[1];
    if (script === "install" || script === "exec" || script.startsWith("--")) continue;
    if (!rootScripts.includes(script)) {
      violations.push(`references \`pnpm ${script}\`, which is not a root package.json script`);
    }
  }
  return violations;
}

/** Every file a contributor/issue/PR workflow needs is actually present. */
export function findMissingGovernanceFiles(root = ".") {
  return GOVERNANCE_FILES.filter((f) => !existsSync(`${root}/${f}`));
}

/** Every ISSUE_TEMPLATE `.yml` file must be syntactically valid YAML — a
 *  broken template silently fails to render as a GitHub issue form. */
export function findGovernanceYamlSyntaxViolations(root = ".") {
  const violations = [];
  for (const f of GOVERNANCE_FILES) {
    if (!f.endsWith(".yml")) continue;
    const path = `${root}/${f}`;
    if (!existsSync(path)) continue;
    try {
      parseYaml(readFileSync(path, "utf8"));
    } catch (err) {
      violations.push(`${f}: invalid YAML (${err.message})`);
    }
  }
  return violations;
}

/** A governance doc that still carries a generic template placeholder
 *  (copy-pasted from Contributor Covenant boilerplate, an example.com
 *  address, etc.) instead of this repo's real enforcement contact. */
export function findPlaceholderContactViolations(text, fileLabel) {
  const violations = [];
  for (const re of PLACEHOLDER_CONTACT_PATTERNS) {
    if (re.test(text)) {
      violations.push(`${fileLabel}: contains a placeholder contact value (matched ${re})`);
    }
  }
  return violations;
}

/** The PR template must carry the intentional-bug-registry field so a
 *  reviewer can tell a real regression from a seeded BuggyShop/BuggyAPI bug. */
export function findPrTemplateFieldViolations(text) {
  const violations = [];
  if (!/Intentional bug registry checked/i.test(text)) {
    violations.push(
      '.github/pull_request_template.md: missing the "Intentional bug registry checked" field',
    );
  }
  return violations;
}

function checkGovernance(root = ".") {
  const violations = [];
  for (const f of findMissingGovernanceFiles(root)) {
    violations.push(`${f}: required governance file is missing`);
  }
  violations.push(...findGovernanceYamlSyntaxViolations(root));

  for (const f of ["CODE_OF_CONDUCT.md", "CONTRIBUTING.md", ".github/ISSUE_TEMPLATE/config.yml"]) {
    const path = `${root}/${f}`;
    if (!existsSync(path)) continue;
    violations.push(...findPlaceholderContactViolations(readFileSync(path, "utf8"), f));
  }

  const prTemplatePath = `${root}/.github/pull_request_template.md`;
  if (existsSync(prTemplatePath)) {
    violations.push(...findPrTemplateFieldViolations(readFileSync(prTemplatePath, "utf8")));
  }

  return violations;
}

function main() {
  const appNames = getAppNames();
  const nodeMajor = getNodeMajor();
  const migrationCount = getMigrationCount();
  const rootScripts = getRootScripts();

  const allViolations = [];
  for (const file of DOC_FILES) {
    const text = readFileSync(file, "utf8");
    const violations = [
      ...findAppCountViolations(text, appNames),
      ...findNodeVersionViolations(text, nodeMajor),
      ...findMigrationCountViolations(text, migrationCount),
      ...findUndocumentedCommandViolations(text, rootScripts),
    ];
    for (const v of violations) allViolations.push(`${file}: ${v}`);
  }
  allViolations.push(...checkGovernance());

  if (allViolations.length > 0) {
    console.error("Documentation drift found (Task 13):");
    for (const v of allViolations) console.error(`  - ${v}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `check-doc-consistency: OK (${DOC_FILES.length} doc(s) checked against ${appNames.length} apps, Node >=${nodeMajor}, ${migrationCount} migrations, ${rootScripts.length} root scripts, ${GOVERNANCE_FILES.length} governance files present)`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
