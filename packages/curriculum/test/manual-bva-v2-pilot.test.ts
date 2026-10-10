import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findContentRoot } from "../src/load";
import { getNote } from "../src/notes/load";

const root = path.resolve(findContentRoot(), "../../..");
const slug = "test-design-techniques/boundary-value-analysis/bva-worked-example";
const publicShot = path.join(
  root,
  "apps/platform/public/notes/test-design-techniques/boundary-value-analysis/buggyshop-cart-v2-original.png",
);
const originalShot = path.join(root, "docs/v2-sprints/sprint03/assets/buggyshop-cart-original.png");
const template = path.join(root, "apps/platform/public/labs/manual-qa-v2/BVA_EVIDENCE_TEMPLATE.md");

describe("Sprint 03 — manual-first BVA pilot", () => {
  it("preserves the existing note while adding a manual-first guided BuggyShop workflow", () => {
    const note = getNote("test-design-techniques", "boundary-value-analysis", "bva-worked-example");
    expect(note).not.toBeNull();
    const body = note!.body;
    expect(body).toContain("Manual-first BuggyShop boundary practice");
    expect(body).toContain("without writing Python");
    expect(body).toContain("Create three test cases");
    expect(body).toContain("record observed results");
    expect(body).toContain("cannot reach");
    expect(body).toContain("ung raded".replace(" ", ""));
    expect(body).toContain("CodePlayground");
    expect(body).toContain("<Complete xp={10} />");
  });

  it("provides a genuine captioned cart screenshot without leaking seeded defect IDs", () => {
    const body = getNote(
      "test-design-techniques",
      "boundary-value-analysis",
      "bva-worked-example",
    )!.body;
    expect(body).toContain(
      "/notes/test-design-techniques/boundary-value-analysis/buggyshop-cart-v2-original.png",
    );
    expect(body).toMatch(/<Figure caption="[^"]+"/);
    expect(body).toMatch(/buggyshop-cart-v2-original\.png" alt="[^"]+"/);
    expect(body).not.toMatch(/\bBS-0\d\d\b/);

    const a = fs.readFileSync(originalShot);
    const b = fs.readFileSync(publicShot);
    expect(b).toEqual(a);
    expect(b.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(b.readUInt32BE(16)).toBeGreaterThanOrEqual(1200);
    expect(b.readUInt32BE(20)).toBeGreaterThanOrEqual(800);
  });

  it("offers a reproducible learner test-case template with no answer keys or credentials", () => {
    const note = getNote(
      "test-design-techniques",
      "boundary-value-analysis",
      "bva-worked-example",
    )!;
    expect(note.body).toContain("/labs/manual-qa-v2/BVA_EVIDENCE_TEMPLATE.md");
    const text = fs.readFileSync(template, "utf8");
    for (const field of [
      "Requirement",
      "Preconditions",
      "Input",
      "Expected",
      "Actual",
      "Result",
      "Evidence",
      "Environment",
    ]) {
      expect(text).toContain(field);
    }
    expect(text).toContain("not executed");
    expect(text).toContain("Do not include");
    expect(text).not.toMatch(/\bBS-0\d\d\b|Bearer\s|#t=.{5,}|secret\s*:/i);
  });
});
