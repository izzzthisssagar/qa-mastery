import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LEGACY_UNTESTED_TABLES,
  extractCoveredTables,
  extractDeclaredTables,
  findStaleExemptions,
  findUncoveredTables,
} from "../../../scripts/check-rls-coverage.mjs";

describe("RLS coverage diff logic", () => {
  it("flags a declared table with no matching test", () => {
    const declared = extractDeclaredTables([
      { content: "create table public.widgets (id uuid primary key);" },
    ]);
    const covered = extractCoveredTables([{ content: 'await x.from("gadgets")' }]);
    expect(findUncoveredTables(declared, covered)).toEqual(["public.widgets"]);
  });

  it("does not flag a table covered by a bare .from() call", () => {
    const declared = extractDeclaredTables([
      { content: "create table public.widgets (id uuid primary key);" },
    ]);
    const covered = extractCoveredTables([{ content: 'await x.from("widgets")' }]);
    expect(findUncoveredTables(declared, covered)).toEqual([]);
  });

  it("does not flag a non-public table covered by .schema().from()", () => {
    const declared = extractDeclaredTables([
      { content: "create table buggyshop.bs_widgets (id uuid primary key);" },
    ]);
    const covered = extractCoveredTables([
      { content: 'await x.schema("buggyshop").from("bs_widgets")' },
    ]);
    expect(findUncoveredTables(declared, covered)).toEqual([]);
  });

  it("respects the exemption set", () => {
    const declared = extractDeclaredTables([
      { content: "create table public.widgets (id uuid primary key);" },
    ]);
    const covered = extractCoveredTables([{ content: "" }]);
    expect(findUncoveredTables(declared, covered, new Set(["public.widgets"]))).toEqual([]);
  });

  it("flags a stale exemption for a table that no longer exists", () => {
    const declared = extractDeclaredTables([
      { content: "create table public.widgets (id uuid primary key);" },
    ]);
    const exempt = new Set(["public.widgets", "public.dropped_table"]);
    expect(findStaleExemptions(declared, exempt)).toEqual(["public.dropped_table"]);
  });

  it("has every declared table in supabase/migrations covered by a test or a live exemption", () => {
    const migrationsDir = join(process.cwd(), "..", "..", "supabase", "migrations");
    const testDir = join(process.cwd(), "test");

    const sqlFiles = readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql"))
      .map((name) => ({ content: readFileSync(join(migrationsDir, name), "utf8") }));
    const testFiles = readdirSync(testDir)
      .filter((name) => name.endsWith(".test.ts"))
      .map((name) => ({ content: readFileSync(join(testDir, name), "utf8") }));

    const declared = extractDeclaredTables(sqlFiles);
    const covered = extractCoveredTables(testFiles);
    const exempt = new Set(LEGACY_UNTESTED_TABLES);

    expect(findStaleExemptions(declared, exempt)).toEqual([]);
    expect(findUncoveredTables(declared, covered, exempt)).toEqual([]);
  });
});
