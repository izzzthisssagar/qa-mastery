import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { findContentRoot } from "../load";

/**
 * Notes loader. Notes are pure MDX under content/notes/<module>/<chapter>/
 * <topic>.mdx — no DB registry, no progress, no sync. The taxonomy
 * (notes/taxonomy.ts) is the tree; this reads whichever leaves are backed by a
 * file. Runtime reads are covered by the platform's existing
 * outputFileTracingIncludes (it already traces all of content/).
 */

export const noteFrontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1).max(300),
  tags: z.array(z.string()).default([]),
  // YAML parses an unquoted `2026-07-02` as a Date — accept either and
  // normalize to a YYYY-MM-DD string.
  updated: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))
    .optional(),
});

export type NoteFrontmatter = z.infer<typeof noteFrontmatterSchema>;

export interface NoteSource {
  moduleSlug: string;
  chapterSlug: string;
  topicSlug: string;
  frontmatter: NoteFrontmatter;
  body: string;
}

function notesRoot(contentRoot: string = findContentRoot()): string {
  return path.join(contentRoot, "notes");
}

/** Absolute path for a note leaf's MDX (may not exist — caller checks). */
export function noteFilePath(
  moduleSlug: string,
  chapterSlug: string,
  topicSlug: string,
  contentRoot: string = findContentRoot(),
): string {
  return path.join(notesRoot(contentRoot), moduleSlug, chapterSlug, `${topicSlug}.mdx`);
}

/** Every note MDX on disk, as {module, chapter, topic} triples. */
export function listNoteFiles(contentRoot: string = findContentRoot()): {
  moduleSlug: string;
  chapterSlug: string;
  topicSlug: string;
  filePath: string;
}[] {
  const root = notesRoot(contentRoot);
  if (!fs.existsSync(root)) return [];
  const out: { moduleSlug: string; chapterSlug: string; topicSlug: string; filePath: string }[] = [];
  for (const m of fs.readdirSync(root, { withFileTypes: true })) {
    if (!m.isDirectory()) continue;
    const mDir = path.join(root, m.name);
    for (const c of fs.readdirSync(mDir, { withFileTypes: true })) {
      if (!c.isDirectory()) continue;
      const cDir = path.join(mDir, c.name);
      for (const f of fs.readdirSync(cDir, { withFileTypes: true })) {
        if (f.isFile() && f.name.endsWith(".mdx")) {
          out.push({
            moduleSlug: m.name,
            chapterSlug: c.name,
            topicSlug: f.name.replace(/\.mdx$/, ""),
            filePath: path.join(cDir, f.name),
          });
        }
      }
    }
  }
  return out.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

/** Load + validate one note. Returns null if the MDX doesn't exist. */
export function getNote(
  moduleSlug: string,
  chapterSlug: string,
  topicSlug: string,
  contentRoot: string = findContentRoot(),
): NoteSource | null {
  const file = noteFilePath(moduleSlug, chapterSlug, topicSlug, contentRoot);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const frontmatter = noteFrontmatterSchema.parse(data);
  return { moduleSlug, chapterSlug, topicSlug, frontmatter, body: content.trim() };
}
