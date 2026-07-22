import {
  chapterForLab,
  labForChapter,
  trackCapstoneForChapter,
  findNoteLeaf,
  getNote,
  type NoteLab,
  type NoteTrackCapstone,
} from "@qa-mastery/curriculum";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve + gate helpers shared by every note-lab kind (code_run, bug_report,
 * …). Split out of lab-actions.ts so bug-hunt-actions.ts doesn't duplicate the
 * "is this chapter/lab real" and "has the chapter been read" checks — the
 * trust boundary is the same regardless of what the lab grades.
 */

/**
 * Resolve a lab and its chapter, or throw. This is the trust boundary: a
 * `chapterSlug` arriving from the client is only honoured when the taxonomy
 * has that chapter AND the registry declares a lab on it, so a forged slug
 * can never reach a runner or write a `note_slug` row.
 */
export function requireNoteLab(chapterSlug: string): {
  lab: NoteLab;
  moduleSlug: string;
  topicSlugs: string[];
} {
  const chapter = chapterForLab(chapterSlug);
  const lab = labForChapter(chapterSlug);
  if (!chapter || !lab) throw new Error("Lab not available");
  return { lab, moduleSlug: chapter.moduleSlug, topicSlugs: chapter.topicSlugs };
}

/** How many of the chapter's notes the learner still has to read. Every lab
 *  kind is a chapter's closing exercise, so every kind unlocks only once the
 *  chapter is read. */
export async function topicsRemaining(
  service: SupabaseClient,
  userId: string,
  moduleSlug: string,
  chapterSlug: string,
  topicSlugs: string[],
): Promise<number> {
  // A planned stub or a topic with no MDX on disk can't be read, so it must
  // not hold the lab hostage.
  const readable = topicSlugs.filter((t) => {
    const leaf = findNoteLeaf(moduleSlug, chapterSlug, t);
    return leaf && !leaf.planned && getNote(moduleSlug, chapterSlug, t);
  });
  if (readable.length === 0) return 0;

  const slugs = readable.map((t) => `${moduleSlug}/${chapterSlug}/${t}`);
  const { data } = await service
    .from("note_progress")
    .select("note_slug")
    .eq("user_id", userId)
    .in("note_slug", slugs);

  return readable.length - (data?.length ?? 0);
}

/**
 * Resolve a track capstone anchored at this chapter, or throw. Same trust
 * boundary as requireNoteLab: a forged chapterSlug can never reach the grader
 * or write a `note_slug` row unless the registry actually anchors a capstone
 * there.
 */
export function requireTrackCapstone(chapterSlug: string): {
  capstone: NoteTrackCapstone;
  moduleSlug: string;
  topicSlugs: string[];
} {
  const chapter = chapterForLab(chapterSlug);
  const capstone = trackCapstoneForChapter(chapterSlug);
  if (!chapter || !capstone) throw new Error("Capstone not available");
  return { capstone, moduleSlug: chapter.moduleSlug, topicSlugs: chapter.topicSlugs };
}

/** Convenience wrapper: resolve the lab, then check how many of its chapter's
 *  notes remain unread. Throws the same "Lab not available" as requireNoteLab
 *  when the slug doesn't resolve. */
export async function requireChapterRead(
  service: SupabaseClient,
  userId: string,
  chapterSlug: string,
): Promise<{ lab: NoteLab; moduleSlug: string }> {
  const { lab, moduleSlug, topicSlugs } = requireNoteLab(chapterSlug);
  const remaining = await topicsRemaining(
    service,
    userId,
    moduleSlug,
    lab.chapterSlug.split("/")[1]!,
    topicSlugs,
  );
  if (remaining > 0) {
    throw new Error(`Finish the ${remaining} remaining note(s) in this chapter first.`);
  }
  return { lab, moduleSlug };
}
