import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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
    "packages:\n  - apps/*\n  - packages/*\noverrides:\n  js-yaml@>=3 <3.15.2: 3.15.2\n  sharp@>=0.35 <0.35.5: 0.35.5\n  fast-xml-parser@>=5 <5.10.1: 5.10.1\n  postcss@>=8 <8.5.18: 8.5.21\n",
  );

  await writeJson(path.join(root, "apps/platform/package.json"), {
    name: "@qa-mastery/platform",
    dependencies: { next: "16.3.8" },
    devDependencies: { "eslint-config-next": "16.3.7", "@types/node": "^24" },
  });

  await writeJson(path.join(root, "apps/buggyapi/package.json"), {
    name: "@qa-mastery/buggyapi",
    dependencies: { next: "16.3.8", "fast-xml-parser": "^5.9.3" },
    devDependencies: { "eslint-config-next": "16.3.8", "@types/node": "^24" },
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
    "apps/platform/package.json: next and eslint-config-next must both be 16.3.8",
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
    "packages:\n  - apps/*\n  - packages/*\noverrides:\n  js-yaml@>=3 <3.15.2: 3.15.2\n  sharp@>=0.35 <0.35.5: 0.35.5\n  fast-xml-parser@>=5 <5.10.1: 5.10.1\n  postcss@>=8 <8.5.18: 8.5.21\n",
  );
  await writeJson(path.join(root, "apps/platform/package.json"), {
    name: "@qa-mastery/platform",
    dependencies: { next: "16.3.8" },
    devDependencies: { "eslint-config-next": "16.3.8", "@types/node": "^24" },
  });
  await writeJson(path.join(root, "apps/buggyapi/package.json"), {
    name: "@qa-mastery/buggyapi",
    dependencies: { next: "16.3.8", "fast-xml-parser": "^5.10.1" },
    devDependencies: { "eslint-config-next": "16.3.8", "@types/node": "^24" },
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
    "packages:\n  - apps/*\noverrides:\n  js-yaml@>=3 <3.15.2: 3.15.2\n  sharp@>=0.35 <0.35.5: 0.35.5\n  fast-xml-parser@>=5 <5.10.1: 5.10.1\n",
  );

  const violations = checkRuntimeAlignment(root);
  assert.ok(violations.some((v) => v.includes("postcss") && v.includes("override")));
  await rm(root, { recursive: true, force: true });
});

test("relative node CLI invocation actually runs the runtime policy", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const result = spawnSync(process.execPath, ["scripts/check-runtime-alignment.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Runtime alignment OK\./);
});

test("Next.js below the security floor is rejected even when eslint-config-next matches", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "runtime-align-old-next-"));
  try {
    await writeJson(path.join(root, "package.json"), {
      engines: { node: ">=24 <25" },
    });
    await writeYaml(
      path.join(root, "pnpm-workspace.yaml"),
      "packages:\n  - apps/*\noverrides:\n  js-yaml@>=3 <3.15.2: 3.15.2\n  sharp@>=0.35 <0.35.5: 0.35.5\n  fast-xml-parser@>=5 <5.10.1: 5.10.1\n  postcss@>=8 <8.5.18: 8.5.21\n",
    );
    await writeJson(path.join(root, "apps/platform/package.json"), {
      dependencies: { next: "16.2.12" },
      devDependencies: { "eslint-config-next": "16.2.12", "@types/node": "^24" },
    });
    const violations = checkRuntimeAlignment(root);
    assert.ok(violations.some((v) => v.includes("next") && v.includes("16.3.8")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
