import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ACTIONS_PATH = join(import.meta.dirname, "actions.ts");
const SOURCE = readFileSync(ACTIONS_PATH, "utf8");

const EXPECTED_EXPORTS = [
  "saveProgress",
  "submitQuiz",
  "submitBugReport",
  "getHuntStatus",
  "launchSandbox",
  "submitCapstone",
  "submitCodeLab",
  "pollCodeRun",
];

function extractExportedFunctionBodies(src: string): Map<string, string> {
  const bodies = new Map<string, string>();
  const re = /^export async function ([A-Za-z0-9_]+)\(/gm;
  const starts: { name: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) starts.push({ name: m[1], index: m.index });

  for (let i = 0; i < starts.length; i++) {
    const nextIndex = i + 1 < starts.length ? starts[i + 1].index : src.length;
    bodies.set(starts[i].name, src.slice(starts[i].index, nextIndex));
  }
  return bodies;
}

describe("learn/actions.ts architecture", () => {
  it('is a "use server" module', () => {
    expect(SOURCE).toContain('"use server"');
  });

  it("stays below 220 lines", () => {
    const lines = SOURCE.split("\n").length;
    expect(lines).toBeLessThan(220);
  });

  it("exports exactly the eight thin action boundaries, no more and no fewer", () => {
    const bodies = extractExportedFunctionBodies(SOURCE);
    expect([...bodies.keys()].sort()).toEqual([...EXPECTED_EXPORTS].sort());
  });

  it("re-checks authentication in every exported action", () => {
    const bodies = extractExportedFunctionBodies(SOURCE);
    for (const name of EXPECTED_EXPORTS) {
      const body = bodies.get(name);
      expect(body, `${name} should be exported`).toBeDefined();
      expect(body, `${name} should call getAuthedUserId()`).toMatch(/getAuthedUserId\(\)/);
    }
  });

  it("contains no `as any` escape hatch", () => {
    expect(SOURCE).not.toContain("as any");
  });

  it("contains no direct Supabase query — all data access lives under server/", () => {
    expect(SOURCE).not.toMatch(/\.from\(/);
    expect(SOURCE).not.toMatch(/\.schema\(/);
  });
});
