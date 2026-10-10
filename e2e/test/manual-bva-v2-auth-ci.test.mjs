import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const e2eDir = fileURLToPath(new URL("..", import.meta.url));
const root = path.resolve(e2eDir, "..");
const specName = "manual-bva-v2-auth.spec.ts";

function source(rel) {
  return readFileSync(path.resolve(root, rel), "utf8");
}

test("Sprint 03 protected BVA CI runs on existing locally seeded Supabase E2E core runner", () => {
  const ci = source(".github/workflows/ci.yml");
  const shard = source(".github/workflows/e2e-shard.yml");
  const config = source("e2e/playwright.config.ts");
  assert.match(ci, /e2e-core:[\s\S]*?uses: \.\/\.github\/workflows\/e2e-shard\.yml/);
  assert.match(shard, /pnpm exec supabase start/);
  assert.match(shard, /pnpm --filter @qa-mastery\/curriculum sync --apply/);
  assert.match(shard, /docker run --rm --network host/);
  assert.match(shard, /--reporter=blob/);
  assert.ok(!config.includes(specName), "new file should be auto-collected, not bespoke-filtered");
});

test("new protected note contract signs up only a disposable learner, preserves sensitive data and XP", () => {
  const spec = source("e2e/tests/" + specName);
  assert.match(spec, /signUpFreshLearner\(/);
  assert.match(spec, /test\.use\(\{[\s\S]*?trace:\s*"off"/);
  assert.match(spec, /screenshot:\s*"off"/);
  assert.match(spec, /manual-qa-v2\/BVA_EVIDENCE_TEMPLATE\.md/);
  assert.match(spec, /buggyshop-cart-v2-original\.png/);
  assert.match(spec, /getByRole\("article"\)/);
  assert.match(spec, /testInfo\.attach\(/);
  assert.match(spec, /\b390\b/);
  assert.match(spec, /\b768\b/);
  assert.match(spec, /\b1440\b/);
  assert.match(spec, /waitForTheme/);
  assert.match(spec, /getByRole\("menuitem"/);
  assert.doesNotMatch(
    spec,
    /admin\.createUser|service_role|db push|db reset|\bcompleteNote\s*\(|\/api\/notes\/complete/,
  );
});

test("new test routes and content tie to the actual ungraded Sprint 03 BVA pilot", () => {
  const spec = source("e2e/tests/" + specName);
  const mdx = source(
    "packages/curriculum/content/notes/test-design-techniques/boundary-value-analysis/bva-worked-example.mdx",
  );
  const template = source("apps/platform/public/labs/manual-qa-v2/BVA_EVIDENCE_TEMPLATE.md");
  assert.match(spec, /test-design-techniques\/boundary-value-analysis\/bva-worked-example/);
  assert.match(mdx, /Manual-first BuggyShop boundary practice/);
  assert.match(template, /PASS, FAIL, BLOCKED, NOT RUN/);
  assert.match(
    spec,
    /\/notes\/test-design-techniques\/boundary-value-analysis\/buggyshop-cart-v2-original\.png/,
  );
});
