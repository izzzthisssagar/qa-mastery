"use server";

import { allNoteLeaves, getNote, findNoteLeaf } from "@qa-mastery/curriculum";
import { createServiceClient } from "@qa-mastery/db";
import { getAuthedUserId } from "@/lib/auth";

const XP_NOTE_COMPLETED = 10;

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

/** A note slug is "module/chapter/topic" and only valid if the taxonomy leaf
 *  exists, is not a planned stub, and has MDX on disk. Guards the completion
 *  path against arbitrary/forged slugs. */
function resolveNoteSlug(noteSlug: string): { m: string; c: string; t: string } | null {
  const [m, c, t] = noteSlug.split("/");
  if (!m || !c || !t) return null;
  const leaf = findNoteLeaf(m, c, t);
  if (!leaf || leaf.planned || !getNote(m, c, t)) return null;
  return { m, c, t };
}

/** Whether the current learner has completed a note (for initial UI state). */
export async function getNoteCompletion(noteSlug: string): Promise<{ done: boolean }> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const { count } = await service
    .from("note_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("note_slug", noteSlug);
  return { done: (count ?? 0) > 0 };
}

/** Mark a note complete and, on first completion, award XP. Writes go through
 *  the service role (note_progress + xp_events are authoritative); RLS gives
 *  learners read-own only, so this action is the sole completion path. */
export async function completeNote(
  noteSlug: string,
): Promise<{ ok: true; xp: number; alreadyDone: boolean }> {
  const userId = await getAuthedUserId();
  if (!resolveNoteSlug(noteSlug)) throw new Error("Note not available");

  const service = createServiceClient();

  const { count } = await service
    .from("note_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("note_slug", noteSlug);
  const alreadyDone = (count ?? 0) > 0;

  if (alreadyDone) return { ok: true, xp: XP_NOTE_COMPLETED, alreadyDone: true };

  const { error: progressError } = await service
    .from("note_progress")
    .upsert(
      { user_id: userId, note_slug: noteSlug, status: "completed", completed_at: new Date().toISOString() },
      { onConflict: "user_id,note_slug" },
    );
  if (progressError) throw new Error(progressError.message);

  await service.from("xp_events").insert({
    user_id: userId,
    amount: XP_NOTE_COMPLETED,
    reason: "note_completed",
    ref_id: noteSlug,
  });

  // Best-effort audit; a failure here must never fail the completion.
  await service
    .from("audit_events")
    .insert({ actor_id: userId, action: "note.completed", target: noteSlug, metadata: {} })
    .then(({ error }) => {
      if (error) console.error("audit_events insert failed:", error.message);
    });

  return { ok: true, xp: XP_NOTE_COMPLETED, alreadyDone: false };
}
