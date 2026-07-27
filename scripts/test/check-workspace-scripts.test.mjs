import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { checkWorkspaceScripts } from "../check-workspace-scripts.mjs";

async function writeJson(p, value) {
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(value, null, 2) + "\n");
}

async function writeYaml(p, text) {
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, text);
}

const CLEAN_VERIFY =
  "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @qa-mastery/curriculum sync";

test("checkWorkspaceScripts reports every workspace missing lint/typecheck/test", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "workspace-scripts-"));
  await writeYaml(
    path.join(root, "pnpm-workspace.yaml"),
    "packages:\n  - apps/*\n  - packages/*\n",
  );
  await writeJson(path.join(root, "package.json"), { scripts: { verify: CLEAN_VERIFY } });

  await writeJson(path.join(root, "apps/platform/package.json"), {
    name: "@qa-mastery/platform",
    scripts: { lint: "eslint", typecheck: "tsc --noEmit", test: "vitest run" },
  });
  await writeJson(path.join(root, "apps/buggyshop/package.json"), {
    name: "@qa-mastery/buggyshop",
    scripts: { lint: "eslint", typecheck: "tsc --noEmit" },
  });
  await writeJson(path.join(root, "packages/db/package.json"), {
    name: "@qa-mastery/db",
    scripts: { typecheck: "tsc --noEmit", "test:rls": "vitest run" },
  });

  const violations = checkWorkspaceScripts(root);
  assert.deepEqual(violations, [
    'apps/buggyshop/package.json: missing non-empty "test" script',
    'packages/db/package.json: missing non-empty "lint" script',
    'packages/db/package.json: missing non-empty "test" script',
  ]);

  await rm(root, { recursive: true, force: true });
});

test("checkWorkspaceScripts rejects an empty-string script as not participating", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "workspace-scripts-empty-"));
  await writeYaml(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
  await writeJson(path.join(root, "package.json"), { scripts: { verify: CLEAN_VERIFY } });
  await writeJson(path.join(root, "packages/shared/package.json"), {
    name: "@qa-mastery/shared",
    scripts: { lint: "", typecheck: "tsc --noEmit", test: "vitest run" },
  });

  const violations = checkWorkspaceScripts(root);
  assert.deepEqual(violations, ['packages/shared/package.json: missing non-empty "lint" script']);

  await rm(root, { recursive: true, force: true });
});

test("checkWorkspaceScripts returns no violations when every workspace fully participates", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "workspace-scripts-clean-"));
  await writeYaml(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
  await writeJson(path.join(root, "package.json"), { scripts: { verify: CLEAN_VERIFY } });
  await writeJson(path.join(root, "packages/shared/package.json"), {
    name: "@qa-mastery/shared",
    scripts: { lint: "eslint", typecheck: "tsc --noEmit", test: "vitest run" },
  });

  assert.deepEqual(checkWorkspaceScripts(root), []);
  await rm(root, { recursive: true, force: true });
});

test("checkWorkspaceScripts flags a root verify command that omits a required static gate", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "workspace-scripts-verify-"));
  await writeYaml(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
  await writeJson(path.join(root, "packages/shared/package.json"), {
    name: "@qa-mastery/shared",
    scripts: { lint: "eslint", typecheck: "tsc --noEmit", test: "vitest run" },
  });
  await writeJson(path.join(root, "package.json"), {
    scripts: { verify: "pnpm lint && pnpm typecheck" },
  });

  const violations = checkWorkspaceScripts(root);
  assert.ok(violations.some((v) => v.includes("verify") && v.includes("pnpm test")));

  await rm(root, { recursive: true, force: true });
});

test("checkWorkspaceScripts rejects a root verify command that names a gate more than once", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "workspace-scripts-verify-dup-"));
  await writeYaml(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
  await writeJson(path.join(root, "packages/shared/package.json"), {
    name: "@qa-mastery/shared",
    scripts: { lint: "eslint", typecheck: "tsc --noEmit", test: "vitest run" },
  });
  await writeJson(path.join(root, "package.json"), {
    scripts: {
      verify:
        "pnpm format:check && pnpm lint && pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @qa-mastery/curriculum sync",
    },
  });

  const violations = checkWorkspaceScripts(root);
  assert.ok(
    violations.some(
      (v) => v.includes("verify") && v.includes("pnpm lint") && v.includes("more than once"),
    ),
  );

  await rm(root, { recursive: true, force: true });
});
