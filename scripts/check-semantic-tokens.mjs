#!/usr/bin/env node
// Fails CI on a raw `zinc-*` utility, or a raw unprefixed pastel `text-*`
// color class (shades 50-400) used as text color. CLAUDE.md: "New UI must
// use semantic classes ... never raw zinc-*, and never a raw Tailwind
// pastel ... as text color either: those are tuned for the dark palette
// only and measure well under AA ... against the light background — axe
// caught this repeatedly in Phase 7." A `dark:`-prefixed pastel is fine (the
// dark palette already accounted for it); an unprefixed high shade (500+)
// is fine too. Scoped to apps/platform/src — BuggyShop stays dark-only on
// purpose. Ticket P1-10.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC_DIR = "apps/platform/src";
const EXTENSIONS = new Set([".ts", ".tsx"]);

const ZINC_RE = /\b(?:[a-z]+-)*zinc-\d{2,3}\b/g;
const PASTEL_COLORS =
  "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const PASTEL_TEXT_RE = new RegExp(`\\btext-(?:${PASTEL_COLORS})-(?:50|100|150|200|300|400)\\b`, "g");

// Pre-existing findings from when this gate was added (P1-10, 2026-07) —
// this list only shrinks. Do NOT add a newly written zinc-*/pastel-text
// class here; swap it for the semantic token instead (see CLAUDE.md).
// Follow-up (tracked outside this ticket): swap these three to
// `ring-offset-background` / `text-accent-text`.
export const LEGACY_TOKEN_VIOLATIONS = new Set([
  "apps/platform/src/components/help-agent/help-agent-widget.tsx#ring-offset-zinc-950",
  "apps/platform/src/components/feedback/feedback-widget.tsx#ring-offset-zinc-950",
  "apps/platform/src/app/(app)/talent/_components/conversation-thread.tsx#text-emerald-50",
]);

function findSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...findSourceFiles(full));
    else if (EXTENSIONS.has(full.slice(full.lastIndexOf(".")))) out.push(full.split("\\").join("/"));
  }
  return out;
}

// Class tokens found only inside string/template literals (so a `zinc-400`
// mentioned in a prose comment doesn't trip the gate).
function stringLiterals(src) {
  const out = [];
  const re = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
  let m;
  while ((m = re.exec(src))) out.push(m[2]);
  return out;
}

export function findTokenViolations(src) {
  const found = new Set();
  for (const literal of stringLiterals(src)) {
    for (const m of literal.matchAll(ZINC_RE)) found.add(m[0]);
    for (const m of literal.matchAll(PASTEL_TEXT_RE)) {
      const precededByDark = literal.slice(Math.max(0, m.index - 5), m.index) === "dark:";
      if (!precededByDark) found.add(m[0]);
    }
  }
  return [...found].sort();
}

// `files` is an array of { file, content } — file is the key path used in
// LEGACY_TOKEN_VIOLATIONS, content is that file's text (decoupled so callers
// can pass a different working directory's file list, e.g. from a test).
export function findStaleExemptions(files, legacy) {
  const live = new Set();
  for (const { file, content } of files) {
    for (const token of findTokenViolations(content)) live.add(`${file}#${token}`);
  }
  return [...legacy].filter((entry) => !live.has(entry)).sort();
}

function main() {
  const files = findSourceFiles(SRC_DIR).map((file) => ({ file, content: readFileSync(file, "utf8") }));
  const violations = [];
  for (const { file, content } of files) {
    for (const token of findTokenViolations(content)) {
      const key = `${file}#${token}`;
      if (!LEGACY_TOKEN_VIOLATIONS.has(key)) violations.push(key);
    }
  }
  const stale = findStaleExemptions(files, LEGACY_TOKEN_VIOLATIONS);

  if (stale.length > 0) {
    console.error("These LEGACY_TOKEN_VIOLATIONS entries no longer exist — remove them from scripts/check-semantic-tokens.mjs:");
    for (const entry of stale) console.error(`  ${entry}`);
  }

  if (violations.length > 0) {
    console.error("\nRaw zinc-*/pastel-text-color class(es) — use a semantic token (bg-surface, text-muted-foreground, text-accent-text, ...):");
    for (const v of violations) console.error(`  ${v}`);
  }

  if (stale.length > 0 || violations.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(
    `check-semantic-tokens: OK (${files.length} files checked, ${LEGACY_TOKEN_VIOLATIONS.size} pre-existing exemptions)`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
