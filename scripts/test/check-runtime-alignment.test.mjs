import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { checkRuntimeAlignment } from "../check-runtime-alignment.mjs";

async function writeJson(p, value) {
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(value, null, 2) + "\n");
}

async function writeYaml(p, text) {
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, text);
}

async function driftedFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "runtime-align-"));

  await writeJson(path.join(root, "package.json"), {
    name: "qa-mastery",
    engines: { node: ">=22" },
  });

  await writeYaml(
    path.join(root, "pnpm-workspace.yaml"),
    "packages:\n  - apps/*\n  - packages/*\noverrides:\n  js-yaml@<3.15.0: 3.15.0\n  sharp@<0.35.0: 0.35.3\n  fast-xml-parser@<5.10.1: 5.10.1\n  postcss@<8.5.18: 8.5.21\n",
  );

  await writeJson(path.join(root, "apps/platform/package.json"), {
    name: "@qa-mastery/platform",
    dependencies: { next: "16.2.11" },
    devDependencies: { "eslint-config-next": "16.2.9", "@types/node": "^24" },
  });

  await writeJson(path.join(root, "apps/buggyapi/package.json"), {
    name: "@qa-mastery/buggyapi",
    dependencies: { next: "16.2.11", "fast-xml-parser": "^5.9.3" },
    devDependencies: { "eslint-config-next": "16.2.11", "@types/node": "^24" },
  });

  await writeJson(path.join(root, "packages/shared/package.json"), {
    name: "@qa-mastery/shared",
    devDependencies: { "@types/node": "^20" },
  });

  return root;
}

test("checkRuntimeAlignment reports exactly the seeded drift", async () => {
  const root = await driftedFixture();
  const violations = checkRuntimeAlignment(root);

  // findWorkspacePackages sorts deterministically (alphabetical), so
  // apps/buggyapi is checked before apps/platform.
  assert.deepEqual(violations, [
    "package.json: engines.node must be >=24 <25",
    "apps/buggyapi/package.json: fast-xml-parser must be >=5.10.1",
    "apps/platform/package.json: next and eslint-config-next must both be 16.2.11",
    "packages/shared/package.json: @types/node must use ^24",
  ]);

  await rm(root, { recursive: true, force: true });
});

test("checkRuntimeAlignment returns no violations for an aligned fixture", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "runtime-align-clean-"));

  await writeJson(path.join(root, "package.json"), {
    name: "qa-mastery",
    engines: { node: ">=24 <25" },
  });
  await writeYaml(
    path.join(root, "pnpm-workspace.yaml"),
    "packages:\n  - apps/*\n  - packages/*\noverrides:\n  js-yaml@<3.15.0: 3.15.0\n  sharp@<0.35.0: 0.35.3\n  fast-xml-parser@<5.10.1: 5.10.1\n  postcss@<8.5.18: 8.5.21\n",
  );
  await writeJson(path.join(root, "apps/platform/package.json"), {
    name: "@qa-mastery/platform",
    dependencies: { next: "16.2.11" },
    devDependencies: { "eslint-config-next": "16.2.11", "@types/node": "^24" },
  });
  await writeJson(path.join(root, "apps/buggyapi/package.json"), {
    name: "@qa-mastery/buggyapi",
    dependencies: { next: "16.2.11", "fast-xml-parser": "^5.10.1" },
    devDependencies: { "eslint-config-next": "16.2.11", "@types/node": "^24" },
  });
  await writeJson(path.join(root, "packages/shared/package.json"), {
    name: "@qa-mastery/shared",
    devDependencies: { "@types/node": "^24" },
  });

  assert.deepEqual(checkRuntimeAlignment(root), []);
  await rm(root, { recursive: true, force: true });
});

test("checkRuntimeAlignment flags a missing or weakened protected override", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "runtime-align-override-"));
  await writeJson(path.join(root, "package.json"), {
    name: "qa-mastery",
    engines: { node: ">=24 <25" },
  });
  await writeYaml(
    path.join(root, "pnpm-workspace.yaml"),
    "packages:\n  - apps/*\noverrides:\n  js-yaml@<3.15.0: 3.15.0\n  sharp@<0.35.0: 0.35.3\n  fast-xml-parser@<5.10.1: 5.10.1\n",
  );

  const violations = checkRuntimeAlignment(root);
  assert.ok(violations.some((v) => v.includes("postcss") && v.includes("override")));
  await rm(root, { recursive: true, force: true });
});
