"use server";

import { allNoteLeaves, getNote } from "@qa-mastery/curriculum";

/**
 * Notes search. The corpus is small (tens of topics), so we scan it in-process
 * rather than shipping a client index — $0, no build step, always in sync with
 * the MDX on disk. Only backed (non-planned) leaves are searchable. Ranking is
 * a simple weighted match: title > tags > body.
 */

export interface NoteHit {
  moduleSlug: string;
  chapterSlug: string;
  topicSlug: string;
  title: string;
  summary: string;
  score: number;
}

export async function searchNotes(query: string): Promise<NoteHit[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const hits: NoteHit[] = [];
  for (const leaf of allNoteLeaves()) {
    if (leaf.planned) continue;
    const note = getNote(leaf.moduleSlug, leaf.chapterSlug, leaf.topicSlug);
    if (!note) continue;

    const title = note.frontmatter.title.toLowerCase();
    const summary = note.frontmatter.summary.toLowerCase();
    const tags = note.frontmatter.tags.join(" ").toLowerCase();
    const body = note.body.toLowerCase();

    let score = 0;
    for (const t of terms) {
      if (title.includes(t)) score += 10;
      if (tags.includes(t)) score += 5;
      if (summary.includes(t)) score += 3;
      if (body.includes(t)) score += 1;
    }
    if (score > 0) {
      hits.push({
        moduleSlug: leaf.moduleSlug,
        chapterSlug: leaf.chapterSlug,
        topicSlug: leaf.topicSlug,
        title: note.frontmatter.title,
        summary: note.frontmatter.summary,
        score,
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, 20);
}
