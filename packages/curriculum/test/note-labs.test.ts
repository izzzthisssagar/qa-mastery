import { describe, expect, it } from "vitest";
import { NOTES_TAXONOMY } from "../src/notes/taxonomy";
import { NOTE_LABS, chapterForLab, labForChapter, labsForModule } from "../src/notes/labs";

/**
 * Unlike tracks, lab coverage is deliberately PARTIAL — only chapters where
 * doing beats reading get one. So these tests assert integrity, never
 * completeness: a lab must point at a chapter that really exists, must be
 * uniquely keyed, and must carry the fields its kind needs to be gradeable.
 * A lab pointing at a renamed chapter would 404 the learner mid-track.
 */
describe("note labs stay anchored to the taxonomy", () => {
  const realChapters = new Set(
    NOTES_TAXONOMY.flatMap((m) => m.chapters.map((c) => `${m.slug}/${c.slug}`)),
  );

  it("every lab points at a chapter that exists", () => {
    const orphans = NOTE_LABS.map((l) => l.chapterSlug).filter((s) => !realChapters.has(s));
    expect(orphans, `labs on missing chapters:\n${orphans.join("\n")}`).toEqual([]);
  });

  it("no chapter has two labs", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const lab of NOTE_LABS) {
      if (seen.has(lab.chapterSlug)) dupes.push(lab.chapterSlug);
      seen.add(lab.chapterSlug);
    }
    expect(dupes, `chapters with more than one lab:\n${dupes.join("\n")}`).toEqual([]);
  });

  it("chapter slugs are lowercase module/chapter pairs", () => {
    // The slug is written verbatim to code_runs.note_slug / bug_reports.note_slug,
    // whose CHECK constraint rejects anything not lowercase.
    const malformed = NOTE_LABS.map((l) => l.chapterSlug).filter(
      (s) => s !== s.toLowerCase() || s.split("/").length !== 2,
    );
    expect(malformed).toEqual([]);
  });

  it("every lab awards XP", () => {
    expect(NOTE_LABS.filter((l) => !(l.xp > 0)).map((l) => l.chapterSlug)).toEqual([]);
  });
});

describe("labs carry what their kind needs to be graded", () => {
  it("code_run labs ship a language and real assertions", () => {
    // A code_run lab with no checks would fall back to the runner's clean-exit
    // signal, which an empty program satisfies — i.e. not graded at all.
    const broken = NOTE_LABS.filter(
      (l) => l.kind === "code_run" && (!l.language || !l.checks?.length),
    );
    expect(broken.map((l) => l.chapterSlug)).toEqual([]);
  });

  it("bug_report labs name a target app and a threshold", () => {
    const broken = NOTE_LABS.filter(
      (l) => l.kind === "bug_report" && (!l.target || !l.minValidBugs),
    );
    expect(broken.map((l) => l.chapterSlug)).toEqual([]);
  });

  it("test_design labs set a test-case threshold", () => {
    const broken = NOTE_LABS.filter((l) => l.kind === "test_design" && !l.minTestCases);
    expect(broken.map((l) => l.chapterSlug)).toEqual([]);
  });
});

describe("lookup helpers", () => {
  it("labForChapter finds a declared lab and misses an undeclared one", () => {
    const lab = NOTE_LABS[0];
    expect(lab).toBeDefined();
    expect(labForChapter(lab!.chapterSlug)).toBe(lab);
    expect(labForChapter("logic-and-control-flow/does-not-exist")).toBeUndefined();
  });

  it("labsForModule returns only that module's labs", () => {
    const lab = NOTE_LABS[0]!;
    const moduleSlug = lab.chapterSlug.split("/")[0]!;
    expect(labsForModule(moduleSlug)).toContain(lab);
    expect(labsForModule("no-such-module")).toEqual([]);
  });

  // chapterForLab is the server-action guard: an unknown slug must resolve to
  // undefined so a forged note_slug can never reach the code runner.
  it("chapterForLab rejects unknown, malformed and empty slugs", () => {
    expect(chapterForLab("no-such-module/loops")).toBeUndefined();
    expect(chapterForLab("logic-and-control-flow/no-such-chapter")).toBeUndefined();
    expect(chapterForLab("logic-and-control-flow")).toBeUndefined();
    expect(chapterForLab("")).toBeUndefined();
    expect(chapterForLab("a/b/c")).toBeUndefined();
  });

  it("chapterForLab resolves a real chapter to its file-backed topics", () => {
    const resolved = chapterForLab("logic-and-control-flow/loops");
    expect(resolved?.moduleSlug).toBe("logic-and-control-flow");
    expect(resolved?.chapterSlug).toBe("loops");
    expect(resolved?.topicSlugs.length).toBeGreaterThan(0);
  });
});
