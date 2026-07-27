import "server-only";

import { unstable_cache } from "next/cache";
import { allNoteLeaves, getNote, type NoteSource } from "@qa-mastery/curriculum";

/**
 * Public curriculum content (note MDX) is immutable between publishes — the
 * only writer is `curriculum sync --apply`, which calls
 * scripts/notify-curriculum-update.mjs afterward to bust this tag (see
 * app/api/revalidate-curriculum/route.ts). Wrap the disk reads in
 * unstable_cache so a request — searchNotes in particular, which otherwise
 * re-parses every note MDX on disk per call — reuses one cached read per
 * deploy instead of hitting the filesystem every time.
 *
 * Cache ONLY this: public, unauthenticated curriculum content. Never cache
 * user progress, authorization decisions, service-role query results, or
 * per-user help-agent state — those stay per-request.
 */

export const CURRICULUM_CACHE_TAG = "curriculum";

/** One note by its "module/chapter/topic" slug, or null if it doesn't exist
 *  (unknown taxonomy leaf, planned stub, or no MDX on disk). */
export const getCachedTopic = unstable_cache(
  async (slug: string): Promise<NoteSource | null> => {
    const [moduleSlug, chapterSlug, topicSlug] = slug.split("/");
    if (!moduleSlug || !chapterSlug || !topicSlug) return null;
    return getNote(moduleSlug, chapterSlug, topicSlug);
  },
  ["curriculum-cache", "topic"],
  { tags: [CURRICULUM_CACHE_TAG] },
);

/** Every published (non-planned, file-backed) note, parsed once and shared
 *  across every reader — search, related-notes resolution, chapter-topic
 *  gating — instead of each caller re-reading the same files.
 *
 * Deliberately NOT its own single `unstable_cache` entry: the full set of
 * note bodies is ~19MB, well over Next's 2MB per-cache-item ceiling (it
 * fails closed — a request that hit this would log a warning and silently
 * serve an uncached read, defeating the point). Composing it from N calls to
 * the already-`unstable_cache`d, `curriculum`-tagged getCachedTopic keeps
 * every individual cache entry small while still avoiding a disk read once
 * each topic is warm — and one revalidateTag("curriculum") still busts
 * every entry this reads. */
export async function getCachedCurriculumIndex(): Promise<NoteSource[]> {
  const notes: NoteSource[] = [];
  for (const leaf of allNoteLeaves()) {
    if (leaf.planned) continue;
    const note = await getCachedTopic(`${leaf.moduleSlug}/${leaf.chapterSlug}/${leaf.topicSlug}`);
    if (note) notes.push(note);
  }
  return notes;
}
