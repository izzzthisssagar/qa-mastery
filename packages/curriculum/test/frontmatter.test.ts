import { describe, expect, it } from "vitest";
import { lessonFrontmatterSchema } from "../src/frontmatter";

const VALID = {
  slug: "boundary-value-analysis",
  title: "Boundary Value Analysis",
  track: "track-a",
  module: "A3",
  order: 3,
  duration_min: 45,
};

describe("lessonFrontmatterSchema", () => {
  it("accepts a minimal valid lesson and applies defaults", () => {
    const parsed = lessonFrontmatterSchema.parse(VALID);
    expect(parsed.free).toBe(false);
    expect(parsed.status).toBe("draft");
    expect(parsed.widgets).toEqual([]);
    expect(parsed.flashcards).toEqual([]);
  });

  it("rejects non-kebab-case slugs", () => {
    expect(() =>
      lessonFrontmatterSchema.parse({ ...VALID, slug: "Boundary Value!" }),
    ).toThrow();
  });

  it("rejects malformed module codes", () => {
    expect(() =>
      lessonFrontmatterSchema.parse({ ...VALID, module: "Z9X" }),
    ).toThrow();
  });
});
