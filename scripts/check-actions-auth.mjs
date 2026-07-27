#!/usr/bin/env node
// Fails CI if a Server Action exported from an apps/platform/src/app/**
// actions.ts file has no auth re-check and isn't explicitly allowlisted.
// CLAUDE.md: "the (app)/layout.tsx server check is the real boundary, and
// every mutating server action re-checks" — the proxy only redirects
// optimistically. This is a text-level guard-call presence check, not a
// data-flow proof (same class of gate as check-rls-coverage.mjs). See
// docs/superpowers/plans/2026-07-26-release-repository-governance.md Task 5.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const APP_DIR = "apps/platform/src/app";

const GUARD_CALL_RE = /\b(?:getAuthedUserId|requireUser)\s*\(|auth\s*\.\s*getUser\s*\(/;
const EXEMPT_COMMENT_RE = /\/\/\s*auth-check:\s*exempt\b/;

// Whole files exempt from this gate — the pre-auth flow itself. login/signup
// mint the session; there is no caller identity yet to re-check.
export const EXEMPT_FILES = new Set(["apps/platform/src/app/(auth)/actions.ts"]);

// Per-function allowlist for reads that are intentionally public — gated by
// an is_public/status column via RLS, not by caller identity. Triaged by
// hand against the real repo when this gate was added (Task 5, 2026-07). A
// new public read needs its own entry here (or an inline
// `// auth-check: exempt — <reason>` comment right above it) — do not widen
// a whole-file exemption to dodge this.
export const ACTION_AUTH_EXEMPTIONS = {
  "apps/platform/src/app/(app)/talent/actions.ts": [
    "getPublicProfile", // public tester profile page — RLS: talent_public_profile is a public view
    "searchTesters", // public marketplace directory — RLS: is_public = true filter
    "getOpenProjects", // public project board — RLS: status = 'open' filter
    "getPortfolioSignedUrl", // asset URL keyed by opaque item id, not caller identity
    "getCvSignedUrl", // CV URL for a public profile handle, same as above
  ],
  "apps/platform/src/app/(app)/notes/actions.ts": [
    "searchNotes", // searches in-memory published curriculum content, not learner data
  ],
};

function findActionFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...findActionFiles(full));
    else if (entry === "actions.ts") out.push(full.split("\\").join("/"));
  }
  return out;
}

// Index of the `{` that opens the function body, given the index of the
// `(` that opens its parameter list. Skips past the params (by paren depth)
// and then past a possible return-type annotation — which can itself
// contain braces, e.g. `): Promise<{ ok: boolean }> {` — by tracking angle-
// bracket and inline-object-type depth separately from the real body brace.
function findBodyBraceStart(src, parenOpenIndex) {
  let parenDepth = 1;
  let i = parenOpenIndex + 1;
  while (i < src.length && parenDepth > 0) {
    if (src[i] === "(") parenDepth++;
    else if (src[i] === ")") parenDepth--;
    i++;
  }
  let angleDepth = 0;
  let nestedBraceDepth = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "<") angleDepth++;
    else if (c === ">") angleDepth = Math.max(0, angleDepth - 1);
    else if (c === "{") {
      if (angleDepth === 0 && nestedBraceDepth === 0) return i;
      nestedBraceDepth++;
    } else if (c === "}") {
      nestedBraceDepth = Math.max(0, nestedBraceDepth - 1);
    }
    i++;
  }
  return -1;
}

// Top-level `export [async] function NAME(...) { ... }` blocks, with the
// ~200 chars right before the signature (for a preceding exemption comment).
export function extractExportedFunctions(src) {
  const fns = [];
  const re = /^export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/gm;
  let m;
  while ((m = re.exec(src))) {
    const bodyStart = findBodyBraceStart(src, re.lastIndex - 1);
    if (bodyStart === -1) continue;
    let depth = 1;
    let i = bodyStart + 1;
    while (i < src.length && depth > 0) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") depth--;
      i++;
    }
    fns.push({
      name: m[1],
      body: src.slice(m.index, i),
      preceding: src.slice(Math.max(0, m.index - 200), m.index),
    });
  }
  return fns;
}

export function findAuthViolations(file, src, exemptions = new Set()) {
  const violations = [];
  for (const fn of extractExportedFunctions(src)) {
    if (exemptions.has(fn.name)) continue;
    if (GUARD_CALL_RE.test(fn.body)) continue;
    if (EXEMPT_COMMENT_RE.test(fn.preceding) || EXEMPT_COMMENT_RE.test(fn.body)) continue;
    violations.push(`${file}#${fn.name}`);
  }
  return violations;
}

function main() {
  const files = findActionFiles(APP_DIR).filter((f) => !EXEMPT_FILES.has(f));
  const violations = files.flatMap((file) =>
    findAuthViolations(
      file,
      readFileSync(file, "utf8"),
      new Set(ACTION_AUTH_EXEMPTIONS[file] ?? []),
    ),
  );

  if (violations.length > 0) {
    console.error("Exported action(s) with no auth re-check and no exemption:");
    for (const v of violations) console.error(`  ${v}`);
    console.error(
      "\nAdd the auth guard, a per-function entry in ACTION_AUTH_EXEMPTIONS, or an inline\n" +
        "`// auth-check: exempt — <reason>` comment in scripts/check-actions-auth.mjs.",
    );
    process.exitCode = 1;
    return;
  }

  console.log(`check-actions-auth: OK (${files.length} actions.ts files checked)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
