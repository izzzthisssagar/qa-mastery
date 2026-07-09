import { describe, expect, it } from "vitest";
import { allNoteLeaves, findNoteLeaf } from "../src/notes/taxonomy";
import { listNoteFiles, getNote, noteFrontmatterSchema } from "../src/notes/load";
import { listLessonFiles } from "../src/load";

/**
 * Notes taxonomy consistency — the contract that lets content fill in
 * incrementally without ever breaking CI:
 *   1. every MDX file on disk maps to a taxonomy leaf (no orphans),
 *   2. every non-planned leaf is backed by a valid MDX file,
 *   3. every planned leaf has NO file yet (flip `planned` off when you add it),
 *   4. every note's frontmatter validates.
 */

describe("notes taxonomy", () => {
  const files = listNoteFiles();
  const leaves = allNoteLeaves();

  it("has a non-trivial taxonomy", () => {
    expect(leaves.length).toBeGreaterThan(10);
  });

  it("every MDX file maps to a taxonomy leaf", () => {
    for (const f of files) {
      const leaf = findNoteLeaf(f.moduleSlug, f.chapterSlug, f.topicSlug);
      expect(leaf, `orphan note ${f.moduleSlug}/${f.chapterSlug}/${f.topicSlug}`).toBeDefined();
    }
  });

  it("every non-planned leaf is backed by a valid MDX file", () => {
    for (const leaf of leaves.filter((l) => !l.planned)) {
      const note = getNote(leaf.moduleSlug, leaf.chapterSlug, leaf.topicSlug);
      expect(
        note,
        `missing note for non-planned leaf ${leaf.moduleSlug}/${leaf.chapterSlug}/${leaf.topicSlug}`,
      ).not.toBeNull();
    }
  });

  it("every planned leaf has no file yet", () => {
    for (const leaf of leaves.filter((l) => l.planned)) {
      const note = getNote(leaf.moduleSlug, leaf.chapterSlug, leaf.topicSlug);
      expect(
        note,
        `planned leaf ${leaf.topicSlug} now has content — flip planned:false`,
      ).toBeNull();
    }
  });

  it("every note's frontmatter validates", () => {
    for (const f of files) {
      const note = getNote(f.moduleSlug, f.chapterSlug, f.topicSlug);
      expect(note).not.toBeNull();
      expect(() => noteFrontmatterSchema.parse(note!.frontmatter)).not.toThrow();
    }
  });

  it("notes are invisible to the lesson registry sync", () => {
    // notes frontmatter would fail the lesson schema — the sync must not see it
    for (const file of listLessonFiles()) {
      expect(file, `lesson walker picked up a note: ${file}`).not.toContain(
        "/notes/",
      );
    }
  });
});
