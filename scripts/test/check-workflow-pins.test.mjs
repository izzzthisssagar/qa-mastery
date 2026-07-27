import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  extractActionRefs,
  extractDockerImageRefs,
  extractNpxVersionedCommands,
  findActionPinViolations,
  findDockerPinViolations,
  findNpxVersionViolations,
} from "../check-workflow-pins.mjs";

test("extractActionRefs skips a local reusable-workflow call (uses: ./...)", () => {
  const refs = extractActionRefs("  uses: ./.github/workflows/e2e-shard.yml\n");
  assert.deepEqual(refs, []);
});

test("extractActionRefs splits a pinned third-party action into ref and pin", () => {
  const refs = extractActionRefs(
    "  uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1\n",
  );
  assert.deepEqual(refs, [
    { ref: "actions/checkout", pin: "3d3c42e5aac5ba805825da76410c181273ba90b1" },
  ]);
});

test("extractActionRefs records a null pin when there is no @ at all", () => {
  const refs = extractActionRefs("  uses: actions/checkout\n");
  assert.deepEqual(refs, [{ ref: "actions/checkout", pin: null }]);
});

test("findActionPinViolations rejects a branch, a tag, and an abbreviated SHA", () => {
  const violations = findActionPinViolations([
    { ref: "superfly/flyctl-actions/setup-flyctl", pin: "master" },
    { ref: "actions/checkout", pin: "v7" },
    { ref: "actions/setup-node", pin: "8207627" },
    { ref: "actions/no-pin", pin: null },
  ]);
  assert.equal(violations.length, 4);
});

test("findActionPinViolations accepts a full 40-character commit SHA", () => {
  const violations = findActionPinViolations([
    { ref: "actions/checkout", pin: "3d3c42e5aac5ba805825da76410c181273ba90b1" },
  ]);
  assert.deepEqual(violations, []);
});

test("extractDockerImageRefs finds a version-only image reference", () => {
  const refs = extractDockerImageRefs("docker run zricethezav/gitleaks:latest detect");
  assert.deepEqual(refs, [{ image: "zricethezav/gitleaks", tag: "latest", digest: null }]);
});

test("extractDockerImageRefs finds a registry-qualified image with a digest pin", () => {
  const text =
    "mcr.microsoft.com/playwright:v1.60.0-noble@sha256:83192064c7510f7ee73dd63dc5f22a5e01a92c81a2e6a9c715d9e3fe55471fd9";
  const refs = extractDockerImageRefs(text);
  assert.equal(refs.length, 1);
  assert.equal(refs[0].image, "mcr.microsoft.com/playwright");
  assert.equal(refs[0].tag, "v1.60.0-noble");
  assert.equal(
    refs[0].digest,
    "sha256:83192064c7510f7ee73dd63dc5f22a5e01a92c81a2e6a9c715d9e3fe55471fd9",
  );
});

test("findDockerPinViolations rejects latest and a missing digest, accepts a full pin", () => {
  const violations = findDockerPinViolations([
    { image: "zricethezav/gitleaks", tag: "latest", digest: null },
    { image: "mcr.microsoft.com/playwright", tag: "v1.60.0-noble", digest: null },
    {
      image: "zricethezav/gitleaks",
      tag: "v8.30.1",
      digest: "sha256:b109bc5f8f76a38196a3e413704fc5b9e3c32360bce4e4b603bd6f45b3721dbb",
    },
  ]);
  assert.equal(violations.length, 3); // latest tag + missing digest (x2 for the first entry) + missing digest for the second
});

test("extractNpxVersionedCommands finds npx --yes <pkg>@latest", () => {
  const refs = extractNpxVersionedCommands("run: npx vercel@latest deploy --prod");
  assert.deepEqual(refs, [{ package: "vercel", version: "latest" }]);
});

test("findNpxVersionViolations rejects latest, accepts an exact version", () => {
  assert.equal(findNpxVersionViolations([{ package: "vercel", version: "latest" }]).length, 1);
  assert.deepEqual(findNpxVersionViolations([{ package: "vercel", version: "57.0.0" }]), []);
});

test("every real workflow file in .github/workflows has zero mutable-input violations today", () => {
  const dir = ".github/workflows";
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => join(dir, f));
  assert.ok(files.length > 0);

  const violations = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    violations.push(
      ...findActionPinViolations(extractActionRefs(text)).map((v) => `${file}: ${v}`),
      ...findDockerPinViolations(extractDockerImageRefs(text)).map((v) => `${file}: ${v}`),
      ...findNpxVersionViolations(extractNpxVersionedCommands(text)).map((v) => `${file}: ${v}`),
    );
  }
  assert.deepEqual(violations, []);
});
