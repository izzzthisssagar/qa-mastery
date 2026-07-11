#!/usr/bin/env node
// Definitive lazy-MDX gate: compile every note through the SAME @mdx-js/mdx
// compiler next-mdx-remote uses at request time. Catches the render-time 500s
// that build/lint/sync do NOT (bare `<` before a digit in prose, unclosed
// tags, backtick/${ inside a code={`…`} literal, escaped quotes in a plain
// JSX attribute). Run from the package root:  node scripts/check-note-mdx-compile.mjs
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const pkgRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const repoRoot = path.resolve(pkgRoot, "..", "..");

// @mdx-js/mdx is hoisted to the workspace root (a transitive dep via
// next-mdx-remote), not a direct dep of this package — resolve it from the
// repo root and the platform app before giving up.
function resolveMdx() {
  const candidates = [
    () => require.resolve("@mdx-js/mdx"),
    () => require.resolve("@mdx-js/mdx", { paths: [repoRoot] }),
    () =>
      require.resolve("@mdx-js/mdx", {
        paths: [path.join(repoRoot, "apps", "platform")],
      }),
    // pnpm keeps transitive deps only in the .pnpm store — glob for it,
    // version-agnostic, and resolve the package's own entry point.
    () => {
      const store = path.join(repoRoot, "node_modules", ".pnpm");
      const dir = fs
        .readdirSync(store)
        .filter((d) => d.startsWith("@mdx-js+mdx@"))
        .sort()
        .pop();
      if (!dir) throw new Error("not in store");
      const pkgDir = path.join(store, dir, "node_modules", "@mdx-js", "mdx");
      return require.resolve(pkgDir);
    },
  ];
  for (const c of candidates) {
    try {
      return c();
    } catch {
      /* try next */
    }
  }
  throw new Error("could not resolve @mdx-js/mdx from the workspace");
}

const { compile } = await import(resolveMdx());
const notesRoot = path.join(pkgRoot, "content", "notes");

/** recursively collect every .mdx under content/notes */
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".mdx")) out.push(full);
  }
  return out;
}

// Mirror packages/curriculum/src/notes/load.ts noteFrontmatterSchema so the
// frontmatter failures that only surface in the CI unit test (notably a
// summary over 300 chars) are caught here, pre-commit, instead. Parse with the
// SAME library the loader uses (gray-matter) so every valid YAML form — quoted,
// unquoted, block scalar — is read exactly as production reads it.
const matter = (await import(require.resolve("gray-matter", { paths: [pkgRoot] }))).default;

function checkFrontmatter(raw) {
  let data;
  try {
    ({ data } = matter(raw));
  } catch (e) {
    return `unparseable frontmatter: ${String(e.message).split("\n")[0]}`;
  }
  if (typeof data.title !== "string" || !data.title.trim()) return "missing/empty title";
  if (typeof data.summary !== "string" || data.summary.length < 1) return "missing/empty summary";
  if (data.summary.length > 300) return `summary is ${data.summary.length} chars (max 300)`;
  return null;
}

const files = walk(notesRoot).sort();
let fail = 0;
for (const f of files) {
  const raw = fs.readFileSync(f, "utf8");
  const rel = path.relative(notesRoot, f);
  const fmError = checkFrontmatter(raw);
  if (fmError) {
    fail++;
    console.error(`FAIL  ${rel}\n      frontmatter: ${fmError}`);
    continue;
  }
  // strip YAML frontmatter exactly as next-mdx-remote (vfile-matter) does
  const src = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
  try {
    await compile(src, { format: "mdx" });
  } catch (e) {
    fail++;
    console.error(`FAIL  ${rel}\n      ${String(e.message).split("\n")[0]}`);
  }
}

if (fail) {
  console.error(`\n${fail}/${files.length} note(s) FAILED (compile or frontmatter).`);
  process.exit(1);
}
console.log(`ok — all ${files.length} notes compile through @mdx-js/mdx and pass frontmatter checks`);
