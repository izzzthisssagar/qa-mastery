import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Regression guard for the P0-10 CVE patch: next@<16.2.11 across all three
// apps carries 3 high-severity advisories (middleware bypass, Server Action
// DoS, Server Action SSRF). A version bump here must not silently regress
// below the fixed release.
const MIN_NEXT_VERSION = [16, 2, 11] as const;

const APP_PACKAGE_JSON_PATHS = [
  "../../../apps/platform/package.json",
  "../../../apps/buggyshop/package.json",
  "../../../apps/buggyapi/package.json",
];

function parseVersion(version: string): [number, number, number] {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Expected an exact semver pin for "next", got "${version}"`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isAtLeast(actual: [number, number, number], min: readonly [number, number, number]) {
  for (let i = 0; i < 3; i++) {
    if (actual[i] !== min[i]) return actual[i] > min[i];
  }
  return true;
}

describe("next.js version (CVE floor)", () => {
  for (const relativePath of APP_PACKAGE_JSON_PATHS) {
    const url = new URL(relativePath, import.meta.url);
    const appName = relativePath.split("/").at(-2);

    it(`${appName} pins next >= ${MIN_NEXT_VERSION.join(".")}`, () => {
      const pkg = JSON.parse(readFileSync(fileURLToPath(url), "utf8"));
      const nextVersion = pkg.dependencies?.next;
      expect(nextVersion, `${appName} package.json has no "next" dependency`).toBeTruthy();
      expect(isAtLeast(parseVersion(nextVersion), MIN_NEXT_VERSION)).toBe(true);
    });
  }
});
