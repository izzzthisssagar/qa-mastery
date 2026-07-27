import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  ACTION_AUTH_EXEMPTIONS,
  EXEMPT_FILES,
  extractExportedFunctions,
  findAuthViolations,
} from "../check-actions-auth.mjs";

const REPO_ROOT = join(import.meta.dirname, "..", "..");

function findActionFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...findActionFiles(full));
    else if (entry === "actions.ts")
      out.push(
        full
          .slice(REPO_ROOT.length + 1)
          .split("\\")
          .join("/"),
      );
  }
  return out;
}

test("findAuthViolations flags an exported action with no auth re-check and no exemption", () => {
  const src = `export async function deleteThing(id) {
  await db.from("things").delete().eq("id", id);
}`;
  assert.deepEqual(findAuthViolations("fixture.ts", src), ["fixture.ts#deleteThing"]);
});

test("findAuthViolations passes a function that re-checks auth via getAuthedUserId", () => {
  const src = `export async function deleteThing(id) {
  const userId = await getAuthedUserId();
  await db.from("things").delete().eq("id", id).eq("user_id", userId);
}`;
  assert.deepEqual(findAuthViolations("fixture.ts", src), []);
});

test("findAuthViolations passes a function that re-checks auth via auth.getUser()", () => {
  const src = `export async function deleteThing(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
}`;
  assert.deepEqual(findAuthViolations("fixture.ts", src), []);
});

test("findAuthViolations does not choke on a return type containing braces", () => {
  const src = `export async function toggle(id): Promise<{ on: boolean }> {
  const userId = await getAuthedUserId();
  return { on: true };
}`;
  assert.deepEqual(findAuthViolations("fixture.ts", src), []);
});

test("findAuthViolations respects a per-function exemption set", () => {
  const src = `export async function publicRead() {
  return;
}`;
  assert.deepEqual(findAuthViolations("fixture.ts", src, new Set(["publicRead"])), []);
});

test("findAuthViolations respects an inline auth-check: exempt comment", () => {
  const src = `// auth-check: exempt — public curriculum search, no learner data
export async function publicRead() {
  return;
}`;
  assert.deepEqual(findAuthViolations("fixture.ts", src), []);
});

test("extractExportedFunctions captures the preceding text for a comment-exemption lookup", () => {
  const src = `// auth-check: exempt — reason
export async function foo() {}`;
  const [fn] = extractExportedFunctions(src);
  assert.equal(fn.name, "foo");
  assert.ok(fn.preceding.includes("auth-check: exempt"));
});

test("the real repo's actions.ts files have zero un-exempted violations today", () => {
  const appDir = join(REPO_ROOT, "apps/platform/src/app");
  const files = findActionFiles(appDir).filter((f) => !EXEMPT_FILES.has(f));
  assert.ok(files.length > 0);

  const violations = files.flatMap((file) =>
    findAuthViolations(
      file,
      readFileSync(join(REPO_ROOT, file), "utf8"),
      new Set(ACTION_AUTH_EXEMPTIONS[file] ?? []),
    ),
  );
  assert.deepEqual(violations, []);
});
