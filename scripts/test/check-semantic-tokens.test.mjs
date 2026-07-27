import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  findStaleExemptions,
  findTokenViolations,
  LEGACY_TOKEN_VIOLATIONS,
} from "../check-semantic-tokens.mjs";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const EXTENSIONS = new Set([".ts", ".tsx"]);

function findSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...findSourceFiles(full));
    else if (EXTENSIONS.has(full.slice(full.lastIndexOf(".")))) {
      out.push(
        full
          .slice(REPO_ROOT.length + 1)
          .split("\\")
          .join("/"),
      );
    }
  }
  return out;
}

test("findTokenViolations flags a raw text-zinc-* class", () => {
  assert.ok(findTokenViolations('<p className="text-zinc-400">hi</p>').includes("text-zinc-400"));
});

test("findTokenViolations flags a raw unprefixed pastel text color", () => {
  assert.ok(
    findTokenViolations('<p className="text-emerald-300">hi</p>').includes("text-emerald-300"),
  );
});

test("findTokenViolations allows a dark:-prefixed pastel text color", () => {
  assert.deepEqual(findTokenViolations('<p className="dark:text-emerald-300">hi</p>'), []);
});

test("findTokenViolations allows an unprefixed high-shade pastel (500+)", () => {
  assert.deepEqual(
    findTokenViolations('<p className="text-cyan-600 dark:text-cyan-300">hi</p>'),
    [],
  );
});

test("findTokenViolations ignores a class-looking token mentioned only in a comment", () => {
  assert.deepEqual(findTokenViolations("// not the muted token: zinc-400 falls below AA"), []);
});

test("findStaleExemptions flags a LEGACY_TOKEN_VIOLATIONS entry that no longer occurs", () => {
  const legacy = new Set(["fixture.tsx#text-zinc-400"]);
  const files = [{ file: "fixture.tsx", content: '<p className="text-foreground">hi</p>' }];
  assert.deepEqual(findStaleExemptions(files, legacy), ["fixture.tsx#text-zinc-400"]);
});

test("findStaleExemptions does not flag a still-live entry", () => {
  const legacy = new Set(["fixture.tsx#text-zinc-400"]);
  const files = [{ file: "fixture.tsx", content: '<p className="text-zinc-400">hi</p>' }];
  assert.deepEqual(findStaleExemptions(files, legacy), []);
});

test("apps/platform/src has zero un-exempted violations today, and no stale exemptions", () => {
  const srcDir = join(REPO_ROOT, "apps/platform/src");
  const relFiles = findSourceFiles(srcDir);
  assert.ok(relFiles.length > 0);
  const files = relFiles.map((file) => ({
    file,
    content: readFileSync(join(REPO_ROOT, file), "utf8"),
  }));

  assert.deepEqual(findStaleExemptions(files, LEGACY_TOKEN_VIOLATIONS), []);

  const violations = files.flatMap(({ file, content }) =>
    findTokenViolations(content)
      .map((t) => `${file}#${t}`)
      .filter((key) => !LEGACY_TOKEN_VIOLATIONS.has(key)),
  );
  assert.deepEqual(violations, []);
});
