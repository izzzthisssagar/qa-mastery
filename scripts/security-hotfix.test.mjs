import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parse as parseYaml } from "yaml";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (relative) => readFileSync(path.join(root, relative), "utf8");
const loadJson = (relative) => JSON.parse(read(relative));
const workspace = () => parseYaml(read("pnpm-workspace.yaml"));
const lockfile = () => parseYaml(read("pnpm-lock.yaml"));
const patchedOverrides = Object.freeze({
  "js-yaml@>=3 <3.15.2": "3.15.2",
  "sharp@>=0.35 <0.35.5": "0.35.5",
  "nanoid@>=3 <3.3.18": "3.3.18",
  "source-map-js@>=1 <1.2.2": "1.2.2",
  "@fastify/busboy@>=3 <3.2.1": "3.2.1",
  "brace-expansion@>=1 <1.1.20": "1.1.20",
  "brace-expansion@>=5 <5.0.11": "5.0.11",
  "js-yaml@>=4 <4.3.2": "4.3.2",
  "browserslist@>=4 <4.28.7": "4.28.7",
  "fast-xml-parser@>=5 <5.10.1": "5.10.1",
  "postcss@>=8 <8.5.18": "8.5.21",
});

test("all three app importers install patched and aligned Next and ESLint versions", () => {
  const lock = lockfile();
  for (const name of ["platform", "buggyshop", "buggyapi"]) {
    const pkg = loadJson("apps/" + name + "/package.json");
    assert.equal(pkg.dependencies.next, "16.3.8", name + " Next.js manifest");
    assert.equal(pkg.devDependencies["eslint-config-next"], "16.3.8", name + " lint manifest");
    const importer = lock.importers["apps/" + name];
    assert.equal(importer.dependencies.next.specifier, "16.3.8", name + " Next lock request");
    assert.match(importer.dependencies.next.version, /^16[.]3[.]8[(]/);
    assert.equal(importer.devDependencies["eslint-config-next"].specifier, "16.3.8");
    assert.match(importer.devDependencies["eslint-config-next"].version, /^16[.]3[.]8[(]/);
  }
  assert.ok(lock.packages["next@16.3.8"]);
  assert.ok(lock.packages["eslint-config-next@16.3.8"]);
});

test("GraphQL Yoga resolves the patched GraphQL Tools dependency graph", () => {
  const pkg = loadJson("apps/buggyapi/package.json");
  const lock = lockfile();
  assert.equal(pkg.dependencies["graphql-yoga"], "^5.24.4");
  assert.equal(lock.importers["apps/buggyapi"].dependencies["graphql-yoga"].specifier, "^5.24.4");
  assert.match(
    lock.importers["apps/buggyapi"].dependencies["graphql-yoga"].version,
    /^5[.]24[.]4[(]/,
  );
  assert.ok(lock.packages["graphql-yoga@5.24.4"]);
  assert.ok(lock.packages["@graphql-tools/utils@12.0.3"]);
  const yoga = Object.entries(lock.snapshots).find(([name]) =>
    name.startsWith("graphql-yoga@5.24.4("),
  );
  assert.ok(yoga, "GraphQL Yoga snapshot must actually resolve");
  assert.match(yoga[1].dependencies["@graphql-tools/utils"], /^12[.]0[.]3[(]/);
  assert.match(yoga[1].dependencies["@graphql-tools/executor"], /^2[.]0[.]3[(]/);
  assert.ok(
    !Object.keys(lock.packages).some((name) =>
      /^@graphql-tools[/]utils@(10[.]11[.]0|11[.]1[.]1)$/.test(name),
    ),
  );
  assert.ok(
    !Object.keys(workspace().overrides).some((name) => name.startsWith("@graphql-tools/utils@")),
  );
});

test("all selective overrides stay within their intended major lines and do not bypass auditing", () => {
  const config = workspace();
  assert.deepEqual(config.overrides, patchedOverrides);
  assert.ok(!Object.hasOwn(config, "auditConfig"));
  assert.ok(!Object.hasOwn(config, "ignoreCves"));
  assert.ok(!Object.hasOwn(config, "ignoreGhsas"));
});

test("lockfile resolves patched production and toolchain versions without old vulnerable package keys", () => {
  const packages = lockfile().packages;
  for (const name of [
    "next@16.3.8",
    "sharp@0.35.5",
    "js-yaml@3.15.2",
    "nanoid@3.3.18",
    "source-map-js@1.2.2",
    "@fastify/busboy@3.2.1",
    "brace-expansion@1.1.20",
    "brace-expansion@5.0.11",
    "js-yaml@4.3.2",
    "browserslist@4.28.7",
  ])
    assert.ok(packages[name], "Patched resolved package missing: " + name);
  for (const name of [
    "next@16.2.12",
    "sharp@0.35.3",
    "js-yaml@3.15.0",
    "nanoid@3.3.16",
    "source-map-js@1.2.1",
    "@fastify/busboy@3.2.0",
    "brace-expansion@1.1.15",
    "brace-expansion@5.0.6",
    "js-yaml@4.3.0",
    "browserslist@4.28.2",
  ])
    assert.ok(!packages[name], "Vulnerable package still resolved: " + name);
});

test("root verification and GitHub checks enforce the security contract", () => {
  const manifest = loadJson("package.json");
  assert.equal(
    manifest.scripts["test:security"],
    "node --test scripts/security-hotfix.test.mjs scripts/test/check-runtime-alignment.test.mjs && node scripts/check-runtime-alignment.mjs",
  );
  assert.ok(
    manifest.scripts.verify.includes("pnpm test:security"),
    "pnpm verify must run the root security guard",
  );
  const ci = read(".github/workflows/ci.yml");
  assert.match(ci, /- name: Runtime and dependency security contracts\n\s+run: pnpm test:security/);
});
