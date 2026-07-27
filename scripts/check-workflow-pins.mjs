#!/usr/bin/env node
// Fails CI if any .github/workflows/*.yml uses a mutable reference for a
// third-party action, a Docker image, or an `npx <package>@version` command
// -- a floating branch (@main/@master), a floating tag (@latest, a bare
// version), or an abbreviated commit SHA can be force-pushed or re-tagged out
// from under a pinned workflow at any time, silently changing what CI runs.
// A local same-repo reusable workflow (`uses: ./...`) is exempt -- it
// resolves to a file in the same commit, so there's nothing to pin. See
// docs/superpowers/plans/2026-07-26-release-repository-governance.md Task 11.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const WORKFLOWS_DIR = ".github/workflows";
const FULL_SHA_RE = /^[0-9a-f]{40}$/i;
const SHA256_DIGEST_RE = /^sha256:[0-9a-f]{64}$/i;

function findWorkflowFiles(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => join(dir, f));
}

/** Every `uses: owner/repo@ref` line, local reusable-workflow calls excluded. */
export function extractActionRefs(text) {
  const refs = [];
  const re = /^\s*(?:-\s*)?uses:\s*([^\s#]+)/gm;
  let m;
  while ((m = re.exec(text))) {
    const usesValue = m[1];
    if (usesValue.startsWith("./") || usesValue.startsWith("../")) continue;
    const at = usesValue.lastIndexOf("@");
    if (at === -1) {
      refs.push({ ref: usesValue, pin: null });
      continue;
    }
    refs.push({ ref: usesValue.slice(0, at), pin: usesValue.slice(at + 1) });
  }
  return refs;
}

/** Every `registry?/namespace/image:tag` reference, e.g. inside a `docker
 *  run` command -- one or more leading path segments, then `:tag`, with an
 *  optional trailing `@sha256:<digest>` pin. */
export function extractDockerImageRefs(text) {
  const re =
    /\b([a-zA-Z0-9][a-zA-Z0-9._-]*(?:\.[a-zA-Z0-9][a-zA-Z0-9._-]*)*(?:\/[a-zA-Z0-9][a-zA-Z0-9._-]*)+):([a-zA-Z0-9][a-zA-Z0-9._-]*)(@sha256:[0-9a-f]{64})?/g;
  const refs = [];
  let m;
  while ((m = re.exec(text))) {
    refs.push({ image: m[1], tag: m[2], digest: m[3] ? m[3].slice(1) : null });
  }
  return refs;
}

/** Every `npx [--yes] <package>@<version>` invocation. */
export function extractNpxVersionedCommands(text) {
  const re = /npx\s+(?:--yes\s+)?(@?[\w.-]+(?:\/[\w.-]+)?)@([\w.-]+)/g;
  const refs = [];
  let m;
  while ((m = re.exec(text))) refs.push({ package: m[1], version: m[2] });
  return refs;
}

export function findActionPinViolations(refs) {
  const violations = [];
  for (const { ref, pin } of refs) {
    if (pin === null) violations.push(`${ref}: no @ pin at all`);
    else if (!FULL_SHA_RE.test(pin))
      violations.push(`${ref}@${pin}: not a full 40-character commit SHA`);
  }
  return violations;
}

export function findDockerPinViolations(imageRefs) {
  const violations = [];
  for (const { image, tag, digest } of imageRefs) {
    if (tag === "latest") violations.push(`${image}:${tag}: mutable "latest" tag`);
    if (!digest) violations.push(`${image}:${tag}: missing an @sha256:<digest> pin`);
    else if (!SHA256_DIGEST_RE.test(digest))
      violations.push(`${image}:${tag}@${digest}: malformed sha256 digest`);
  }
  return violations;
}

export function findNpxVersionViolations(npxRefs) {
  const violations = [];
  for (const { package: pkg, version } of npxRefs) {
    if (version === "latest") violations.push(`npx ${pkg}@${version}: mutable "latest" version`);
  }
  return violations;
}

function main() {
  const files = findWorkflowFiles(WORKFLOWS_DIR);
  const allViolations = [];

  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const violations = [
      ...findActionPinViolations(extractActionRefs(text)),
      ...findDockerPinViolations(extractDockerImageRefs(text)),
      ...findNpxVersionViolations(extractNpxVersionedCommands(text)),
    ];
    for (const v of violations) allViolations.push(`${file}: ${v}`);
  }

  if (allViolations.length > 0) {
    console.error("Mutable execution input(s) found in .github/workflows:");
    for (const v of allViolations) console.error(`  - ${v}`);
    console.error(
      "\nPin every third-party action to its full commit SHA, every Docker image to an\n" +
        "@sha256:<digest>, and every `npx <package>@version` to an exact version.",
    );
    process.exitCode = 1;
    return;
  }

  console.log(`check-workflow-pins: OK (${files.length} workflow file(s) checked)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
