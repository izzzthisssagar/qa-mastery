import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * P1-2: lesson-content reads are wrapped in `unstable_cache` tagged
 * `lesson:${slug}` (apps/platform/src/lib/curriculum-cache.ts), and the
 * revalidate route (app/api/internal/revalidate-lesson/route.ts) busts that
 * tag on-demand when `curriculum sync --apply` publishes a content change.
 * `next/cache` and `@qa-mastery/curriculum` are mocked so this test stays a
 * pure unit test of the wiring, not of Next's cache engine or the filesystem.
 */

vi.mock("server-only", () => ({}));

const unstableCacheMock = vi.fn(
  (fn: (...args: unknown[]) => unknown, _keyParts: string[], _options: { tags: string[] }) => fn,
);
const revalidateTagMock = vi.fn();

vi.mock("next/cache", () => ({
  unstable_cache: (...args: Parameters<typeof unstableCacheMock>) => unstableCacheMock(...args),
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
}));

const findLessonBySlugMock = vi.fn();
const loadLessonBodyMock = vi.fn();
const loadQuizMock = vi.fn();

vi.mock("@qa-mastery/curriculum", () => ({
  findLessonBySlug: (...args: unknown[]) => findLessonBySlugMock(...args),
  loadLessonBody: (...args: unknown[]) => loadLessonBodyMock(...args),
  loadQuiz: (...args: unknown[]) => loadQuizMock(...args),
}));

beforeEach(() => {
  unstableCacheMock.mockClear();
  revalidateTagMock.mockClear();
  findLessonBySlugMock.mockReset();
  loadLessonBodyMock.mockReset();
  loadQuizMock.mockReset();
});

afterEach(() => {
  vi.resetModules();
});

describe("curriculum-cache", () => {
  it("tags every wrapped read for a slug with the same lesson:${slug} tag", async () => {
    findLessonBySlugMock.mockResolvedValue({ frontmatter: { slug: "bva" } });
    loadLessonBodyMock.mockResolvedValue("body");
    loadQuizMock.mockResolvedValue({ questions: [] });

    const { findLessonBySlug, loadLessonBody, loadQuiz } = await import(
      "../src/lib/curriculum-cache"
    );

    await findLessonBySlug("boundary-value-analysis");
    await loadLessonBody("boundary-value-analysis");
    await loadQuiz("boundary-value-analysis");

    expect(unstableCacheMock).toHaveBeenCalledTimes(3);
    for (const call of unstableCacheMock.mock.calls) {
      const options = call[2] as { tags: string[] };
      expect(options.tags).toEqual(["lesson:boundary-value-analysis"]);
    }
    expect(findLessonBySlugMock).toHaveBeenCalledWith("boundary-value-analysis");
    expect(loadLessonBodyMock).toHaveBeenCalledWith("boundary-value-analysis");
    expect(loadQuizMock).toHaveBeenCalledWith("boundary-value-analysis");
  });

  it("gives each wrapped function distinct cache-key parts so they don't collide", async () => {
    findLessonBySlugMock.mockResolvedValue(null);
    loadLessonBodyMock.mockResolvedValue("body");
    loadQuizMock.mockResolvedValue({ questions: [] });

    const { findLessonBySlug, loadLessonBody, loadQuiz } = await import(
      "../src/lib/curriculum-cache"
    );

    await findLessonBySlug("slug-a");
    await loadLessonBody("slug-a");
    await loadQuiz("slug-a");

    const keyParts = unstableCacheMock.mock.calls.map((call) => (call[1] as string[]).join("/"));
    expect(new Set(keyParts).size).toBe(3);
  });
});

describe("POST /api/internal/revalidate-lesson", () => {
  const ORIGINAL_SECRET = process.env.CURRICULUM_REVALIDATE_SECRET;

  afterEach(() => {
    process.env.CURRICULUM_REVALIDATE_SECRET = ORIGINAL_SECRET;
  });

  it("rejects requests without the correct bearer secret", async () => {
    process.env.CURRICULUM_REVALIDATE_SECRET = "s3cr3t";
    const { POST } = await import("../src/app/api/internal/revalidate-lesson/route");

    const response = await POST(
      new Request("http://localhost/api/internal/revalidate-lesson", {
        method: "POST",
        headers: { authorization: "Bearer wrong" },
        body: JSON.stringify({ slugs: ["boundary-value-analysis"] }),
      }),
    );

    expect(response.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("rejects when no secret is configured (fail closed)", async () => {
    delete process.env.CURRICULUM_REVALIDATE_SECRET;
    const { POST } = await import("../src/app/api/internal/revalidate-lesson/route");

    const response = await POST(
      new Request("http://localhost/api/internal/revalidate-lesson", {
        method: "POST",
        headers: { authorization: "Bearer anything" },
        body: JSON.stringify({ slugs: ["boundary-value-analysis"] }),
      }),
    );

    expect(response.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("rejects an empty slugs list", async () => {
    process.env.CURRICULUM_REVALIDATE_SECRET = "s3cr3t";
    const { POST } = await import("../src/app/api/internal/revalidate-lesson/route");

    const response = await POST(
      new Request("http://localhost/api/internal/revalidate-lesson", {
        method: "POST",
        headers: { authorization: "Bearer s3cr3t" },
        body: JSON.stringify({ slugs: [] }),
      }),
    );

    expect(response.status).toBe(400);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("revalidates the lesson:${slug} tag for each slug with an immediate expiry", async () => {
    process.env.CURRICULUM_REVALIDATE_SECRET = "s3cr3t";
    const { POST } = await import("../src/app/api/internal/revalidate-lesson/route");

    const response = await POST(
      new Request("http://localhost/api/internal/revalidate-lesson", {
        method: "POST",
        headers: { authorization: "Bearer s3cr3t" },
        body: JSON.stringify({ slugs: ["boundary-value-analysis", "equivalence-partitioning"] }),
      }),
    );

    expect(response.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledTimes(2);
    expect(revalidateTagMock).toHaveBeenCalledWith("lesson:boundary-value-analysis", { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledWith("lesson:equivalence-partitioning", { expire: 0 });
  });
});
