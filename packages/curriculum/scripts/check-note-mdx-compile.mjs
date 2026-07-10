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

const files = walk(notesRoot).sort();
let fail = 0;
for (const f of files) {
  // strip YAML frontmatter exactly as next-mdx-remote (vfile-matter) does
  const src = fs.readFileSync(f, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "");
  const rel = path.relative(notesRoot, f);
  try {
    await compile(src, { format: "mdx" });
  } catch (e) {
    fail++;
    console.error(`FAIL  ${rel}\n      ${String(e.message).split("\n")[0]}`);
  }
}

if (fail) {
  console.error(`\n${fail}/${files.length} note(s) FAILED to compile.`);
  process.exit(1);
}
console.log(`ok — all ${files.length} notes compile through @mdx-js/mdx`);
