import { describe, expect, it, vi } from "vitest";

const { unstableCacheCalls } = vi.hoisted(() => ({
  unstableCacheCalls: [] as { keyParts: string[]; tags?: string[] }[],
}));

// server-only throws when imported outside Next's server build pipeline —
// vitest doesn't set that condition, so stub it to a no-op for the test.
vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  unstable_cache: (
    fn: (...args: unknown[]) => unknown,
    keyParts: string[],
    options: { tags?: string[] },
  ) => {
    unstableCacheCalls.push({ keyParts, tags: options.tags });
    return fn;
  },
}));

vi.mock("@qa-mastery/curriculum", () => ({
  allNoteLeaves: () => [
    { moduleSlug: "m1", chapterSlug: "c1", topicSlug: "t1", planned: false, title: "T1" },
    { moduleSlug: "m1", chapterSlug: "c1", topicSlug: "planned", planned: true, title: "Planned" },
    {
      moduleSlug: "m1",
      chapterSlug: "c1",
      topicSlug: "missing-file",
      planned: false,
      title: "Gone",
    },
  ],
  getNote: (moduleSlug: string, chapterSlug: string, topicSlug: string) => {
    if (moduleSlug === "m1" && chapterSlug === "c1" && topicSlug === "t1") {
      return {
        moduleSlug,
        chapterSlug,
        topicSlug,
        frontmatter: { title: "T1", summary: "s", tags: [], related: [] },
        body: "hello",
      };
    }
    return null;
  },
}));

const { CURRICULUM_CACHE_TAG, getCachedCurriculumIndex, getCachedTopic } = await import(
  "./curriculum-cache"
);

describe("curriculum-cache", () => {
  it("registers getCachedTopic under a stable key, tagged 'curriculum'", () => {
    const call = unstableCacheCalls.find((c) => c.keyParts.includes("topic"));
    expect(call).toBeDefined();
    expect(call?.tags).toEqual([CURRICULUM_CACHE_TAG]);
  });

  it("getCachedCurriculumIndex does not register its own unstable_cache entry (would exceed the 2MB per-item ceiling at real content scale — see the code comment)", () => {
    expect(unstableCacheCalls.some((c) => c.keyParts.includes("index"))).toBe(false);
    expect(unstableCacheCalls).toHaveLength(1);
  });

  it("getCachedCurriculumIndex returns every published, file-backed note", async () => {
    const notes = await getCachedCurriculumIndex();
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ moduleSlug: "m1", chapterSlug: "c1", topicSlug: "t1" });
  });

  it("getCachedCurriculumIndex skips a planned stub", async () => {
    const notes = await getCachedCurriculumIndex();
    expect(notes.find((n) => n.topicSlug === "planned")).toBeUndefined();
  });

  it("getCachedCurriculumIndex skips a taxonomy leaf with no MDX on disk", async () => {
    const notes = await getCachedCurriculumIndex();
    expect(notes.find((n) => n.topicSlug === "missing-file")).toBeUndefined();
  });

  it("getCachedTopic resolves a well-formed slug", async () => {
    const note = await getCachedTopic("m1/c1/t1");
    expect(note?.frontmatter.title).toBe("T1");
  });

  it("getCachedTopic returns null for an unknown slug", async () => {
    expect(await getCachedTopic("m1/c1/unknown")).toBeNull();
  });

  it("getCachedTopic returns null for a malformed slug", async () => {
    expect(await getCachedTopic("not-enough-parts")).toBeNull();
    expect(await getCachedTopic("")).toBeNull();
  });
});
