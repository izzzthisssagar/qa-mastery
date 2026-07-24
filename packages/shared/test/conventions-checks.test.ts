import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ActionResult } from "../src/index";
// Untyped scripts, same pattern check-rls-coverage.mjs uses in packages/db
// (whose tsconfig excludes `test`, so it never needs this suppression;
// `shared`'s tsconfig includes `test`, so it does). @ts-expect-error only
// covers the line right after it, so each import is kept on one line.
// @ts-expect-error - untyped script
import { ACTION_AUTH_EXEMPTIONS, EXEMPT_FILES, extractExportedFunctions, findAuthViolations } from "../../../scripts/check-actions-auth.mjs";
// @ts-expect-error - untyped script
import { findStaleExemptions, findTokenViolations, LEGACY_TOKEN_VIOLATIONS } from "../../../scripts/check-semantic-tokens.mjs";
// @ts-expect-error - untyped script
import { buildGraph, findConfigViolations, findCycles, findLayeringViolations } from "../../../scripts/check-dep-cycles.mjs";

const REPO_ROOT = join(process.cwd(), "..", "..");

function readdirRecursive(dir: string, predicate: (name: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...readdirRecursive(full, predicate));
    else if (predicate(entry)) out.push(full);
  }
  return out;
}

describe("check-actions-auth", () => {
  it("flags an exported action with no auth re-check and no exemption", () => {
    const src = `export async function deleteThing(id: string): Promise<void> {
  await db.from("things").delete().eq("id", id);
}`;
    expect(findAuthViolations("fixture.ts", src)).toEqual(["fixture.ts#deleteThing"]);
  });

  it("passes a function that re-checks auth", () => {
    const src = `export async function deleteThing(id: string): Promise<void> {
  const userId = await getAuthedUserId();
  await db.from("things").delete().eq("id", id).eq("user_id", userId);
}`;
    expect(findAuthViolations("fixture.ts", src)).toEqual([]);
  });

  it("does not choke on a return type containing braces (the parser bug this gate must avoid)", () => {
    const src = `export async function toggle(id: string): Promise<{ on: boolean }> {
  const userId = await getAuthedUserId();
  return { on: true };
}`;
    expect(findAuthViolations("fixture.ts", src)).toEqual([]);
  });

  it("respects a per-function ACTION_AUTH_EXEMPTIONS entry", () => {
    const src = `export async function publicRead(): Promise<void> {
  return;
}`;
    expect(findAuthViolations("fixture.ts", src, new Set(["publicRead"]))).toEqual([]);
  });

  it("respects an inline `auth-check: exempt` comment", () => {
    const src = `// auth-check: exempt — public curriculum search, no learner data
export async function publicRead(): Promise<void> {
  return;
}`;
    expect(findAuthViolations("fixture.ts", src)).toEqual([]);
  });

  it("has zero un-exempted violations across the real repo's actions.ts files today", () => {
    const appDir = join(REPO_ROOT, "apps/platform/src/app");
    const files = readdirRecursive(appDir, (name) => name === "actions.ts").map((f) =>
      f.slice(REPO_ROOT.length + 1).split("\\").join("/"),
    );
    const checked = files.filter((f: string) => !EXEMPT_FILES.has(f));
    expect(checked.length).toBeGreaterThan(0);

    const violations = checked.flatMap((file: string) =>
      findAuthViolations(
        file,
        readFileSync(join(REPO_ROOT, file), "utf8"),
        new Set(ACTION_AUTH_EXEMPTIONS[file] ?? []),
      ),
    );
    expect(violations).toEqual([]);
  });
});

describe("extractExportedFunctions", () => {
  it("captures the preceding text for a comment-exemption lookup", () => {
    const src = `// auth-check: exempt — reason
export async function foo(): Promise<void> {}`;
    const [fn] = extractExportedFunctions(src);
    expect(fn.name).toBe("foo");
    expect(fn.preceding).toContain("auth-check: exempt");
  });
});

describe("check-semantic-tokens", () => {
  it("flags a raw text-zinc-* class", () => {
    expect(findTokenViolations('<p className="text-zinc-400">hi</p>')).toContain("text-zinc-400");
  });

  it("flags a raw unprefixed pastel text color", () => {
    expect(findTokenViolations('<p className="text-emerald-300">hi</p>')).toContain("text-emerald-300");
  });

  it("allows a dark:-prefixed pastel text color", () => {
    expect(findTokenViolations('<p className="dark:text-emerald-300">hi</p>')).toEqual([]);
  });

  it("allows an unprefixed high-shade pastel (500+, the sanctioned dark: pair base)", () => {
    expect(findTokenViolations('<p className="text-cyan-600 dark:text-cyan-300">hi</p>')).toEqual([]);
  });

  it("ignores a class-looking token mentioned only in a comment, not a string", () => {
    expect(findTokenViolations("// not the muted token: zinc-400 falls below AA")).toEqual([]);
  });

  it("flags a LEGACY_TOKEN_VIOLATIONS entry that no longer occurs in its file", () => {
    const legacy = new Set(["fixture.tsx#text-zinc-400"]);
    const files = [{ file: "fixture.tsx", content: '<p className="text-foreground">hi</p>' }];
    expect(findStaleExemptions(files, legacy)).toEqual(["fixture.tsx#text-zinc-400"]);
  });

  it("does not flag a still-live LEGACY_TOKEN_VIOLATIONS entry", () => {
    const legacy = new Set(["fixture.tsx#text-zinc-400"]);
    const files = [{ file: "fixture.tsx", content: '<p className="text-zinc-400">hi</p>' }];
    expect(findStaleExemptions(files, legacy)).toEqual([]);
  });

  it("has zero un-exempted violations across apps/platform/src today, and no stale exemptions", () => {
    const srcDir = join(REPO_ROOT, "apps/platform/src");
    const relFiles = readdirRecursive(srcDir, (name) => name.endsWith(".ts") || name.endsWith(".tsx")).map(
      (f) => f.slice(REPO_ROOT.length + 1).split("\\").join("/"),
    );
    expect(relFiles.length).toBeGreaterThan(0);
    const files = relFiles.map((file: string) => ({
      file,
      content: readFileSync(join(REPO_ROOT, file), "utf8"),
    }));
    expect(findStaleExemptions(files, LEGACY_TOKEN_VIOLATIONS)).toEqual([]);

    const violations = files.flatMap(({ file, content }: { file: string; content: string }) => {
      const tokens: string[] = findTokenViolations(content);
      return tokens.map((t) => `${file}#${t}`).filter((key) => !LEGACY_TOKEN_VIOLATIONS.has(key));
    });
    expect(violations).toEqual([]);
  });
});

describe("check-dep-cycles", () => {
  it("flags a two-package cycle", () => {
    const graph = buildGraph([
      { name: "a", kind: "package", deps: ["b"] },
      { name: "b", kind: "package", deps: ["a"] },
    ]);
    expect(findCycles(graph)).toEqual([["a", "b", "a"]]);
  });

  it("passes a clean DAG", () => {
    const graph = buildGraph([
      { name: "a", kind: "package", deps: ["b"] },
      { name: "b", kind: "package", deps: [] },
    ]);
    expect(findCycles(graph)).toEqual([]);
  });

  it("flags a package depending on an app", () => {
    const graph = buildGraph([
      { name: "@qa-mastery/lib", kind: "package", deps: ["@qa-mastery/web"] },
      { name: "@qa-mastery/web", kind: "app", deps: [] },
    ]);
    expect(findLayeringViolations(graph)).toEqual(["@qa-mastery/lib -> @qa-mastery/web"]);
  });

  it("flags @qa-mastery/config depending on anything", () => {
    const graph = buildGraph([{ name: "@qa-mastery/config", kind: "package", deps: ["@qa-mastery/lib"] }]);
    expect(findConfigViolations(graph)).toEqual(["@qa-mastery/lib"]);
  });

  it("has no cycle, layering violation, or config violation in the real workspace graph today", () => {
    const dirs = [
      { dir: join(REPO_ROOT, "packages"), kind: "package" },
      { dir: join(REPO_ROOT, "services"), kind: "service" },
      { dir: join(REPO_ROOT, "apps"), kind: "app" },
    ];
    const pkgList = dirs.flatMap(({ dir, kind }) =>
      readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => {
          try {
            return JSON.parse(readFileSync(join(dir, e.name, "package.json"), "utf8"));
          } catch {
            return null;
          }
        })
        .filter((pkg): pkg is { name: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> } => pkg !== null)
        .map((pkg) => ({
          name: pkg.name,
          kind,
          deps: Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) =>
            d.startsWith("@qa-mastery/"),
          ),
        })),
    );
    const graph = buildGraph(pkgList);
    expect(findCycles(graph)).toEqual([]);
    expect(findLayeringViolations(graph)).toEqual([]);
    expect(findConfigViolations(graph)).toEqual([]);
  });
});

describe("ActionResult<T> narrowing", () => {
  it("narrows to `data` when ok is true", () => {
    const result: ActionResult<{ id: string }> = { ok: true, data: { id: "1" } };
    if (result.ok) {
      expect(result.data.id).toBe("1");
    } else {
      throw new Error("expected ok result");
    }
  });

  it("narrows to `error` when ok is false", () => {
    const result: ActionResult<{ id: string }> = { ok: false, error: "not found" };
    if (!result.ok) {
      expect(result.error).toBe("not found");
    } else {
      throw new Error("expected error result");
    }
  });
});
