import { z } from "zod";

/**
 * Lesson frontmatter — the contract between MDX content and the DB registry.
 * The sync script validates every lesson against this on each PR; the
 * registry upsert keys on `slug`, so slugs are IMMUTABLE once published.
 */
export const lessonFrontmatterSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
  title: z.string().min(3),
  track: z.enum(["track-a", "track-b"]),
  module: z.string().regex(/^[AB][0-9]$/, 'module must look like "A3" or "B0"'),
  /** Position within the module, 1-based. */
  order: z.number().int().min(1),
  free: z.boolean().default(false),
  duration_min: z.number().int().positive(),
  /** Names of interactive widgets the lesson embeds; validated against the widget registry. */
  widgets: z.array(z.string()).default([]),
  lab_type: z
    .enum(["none", "test_design", "bug_report", "code_run", "artifact"])
    .default("none"),
  status: z.enum(["draft", "published"]).default("draft"),
  /** Minimum BuggyShop release the lesson's lab needs, e.g. "1.0". */
  requires_release: z.string().optional(),
  flashcards: z
    .array(z.object({ front: z.string().min(1), back: z.string().min(1) }))
    .default([]),
});

export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;
