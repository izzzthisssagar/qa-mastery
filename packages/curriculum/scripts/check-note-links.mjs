#!/usr/bin/env node
// Gate: every note-to-note link must resolve to a real note.
//
// Two kinds of link connect notes: frontmatter `related:` triples and prose
// `[[module/chapter/topic]]` wikilinks. Both are validated only for SHAPE
// elsewhere — the zod frontmatter schema (src/notes/load.ts) regex-checks that a
// related entry LOOKS like "a/b/c", never that "a/b/c" is a real note; the vault
// sync (sync-notes-to-vault.mjs) silently falls back to the raw slug on an
// unresolved target. So a renamed/typo'd link ships green and renders as a dead
// link in the related sidebar and the Obsidian graph. This closes that gap.
//
// Valid targets = the file-backed notes on disk. That set is identical to the
// non-planned taxonomy leaves (the notes test asserts the 1:1 mapping), and
// linking to a `planned` stub would be a dead link too — so the filesystem set
// is exactly right and needs no taxonomy import. Run from the package root:
//   node scripts/check-note-links.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const notesRoot = path.join(pkgRoot, "content", "notes");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".mdx")) out.push(full);
  }
  return out;
}

const files = walk(notesRoot).sort();

// The valid-target set: "module/chapter/topic" for every note file on disk.
const validLeaves = new Set(
  files.map((f) => path.relative(notesRoot, f).replace(/\.mdx$/, "")),
);

// Split frontmatter from body without a YAML lib: related: is a simple list.
function splitFrontmatter(src) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(src);
  return m ? { fm: m[1], body: m[2] } : { fm: "", body: src };
}

// Pull `related:` list entries (`  - "a/b/c"` or `  - a/b/c`) from frontmatter.
function relatedEntries(fm) {
  const out = [];
  const lines = fm.split("\n");
  let inRelated = false;
  for (const line of lines) {
    if (/^related:\s*$/.test(line)) {
      inRelated = true;
      continue;
    }
    if (inRelated) {
      const item = /^\s*-\s*["']?([^"'#\s]+)["']?\s*$/.exec(line);
      if (item) {
        out.push(item[1]);
        continue;
      }
      // A non-list, non-blank line at col 0 ends the related: block.
      if (/^\S/.test(line)) inRelated = false;
    }
  }
  return out;
}

const fails = [];

for (const file of files) {
  const rel = path.relative(notesRoot, file);
  const src = fs.readFileSync(file, "utf8");
  const { fm, body } = splitFrontmatter(src);

  for (const target of relatedEntries(fm)) {
    if (!validLeaves.has(target)) {
      fails.push(`${rel}: related: -> ${target} (no such note)`);
    }
  }

  // Only the triple-slug form is a note wikilink. This deliberately ignores
  // bash `[[ $x -eq 1 ]]` tests and code literals like `queue = [[start]]`,
  // which are not `a/b/c` shaped.
  for (const m of body.matchAll(/\[\[([a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+)\]\]/g)) {
    if (!validLeaves.has(m[1])) {
      fails.push(`${rel}: [[${m[1]}]] (no such note)`);
    }
  }
}

for (const f of fails) console.log("  FAIL", f);
console.log(
  fails.length
    ? `\n${fails.length} broken note link(s) across ${files.length} notes`
    : `ok — every related: and [[wikilink]] across ${files.length} notes resolves`,
);
process.exit(fails.length ? 1 : 0);
