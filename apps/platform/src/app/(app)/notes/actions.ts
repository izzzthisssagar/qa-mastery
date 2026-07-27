"use server";

import { findNoteLeaf, findNoteModule, NOTE_TRACKS } from "@qa-mastery/curriculum";
import { createServiceClient } from "@qa-mastery/db";
import { getAuthedUserId } from "@/lib/auth";
import { getCachedCurriculumIndex, getCachedTopic } from "@/lib/curriculum-cache";
import { withLogging } from "@/lib/logging";
import { touchStreak } from "@/lib/streaks";

const XP_NOTE_COMPLETED = 10;

export interface NoteModuleProgress {
  slug: string;
  title: string;
  done: number;
  total: number;
  pct: number;
}

export interface NoteTrackProgress {
  slug: string;
  title: string;
  blurb: string;
  modules: NoteModuleProgress[];
  modulesDone: number;
  moduleCount: number;
  topicsDone: number;
  topicCount: number;
  pct: number;
  certEarned: boolean;
}

/** Count a module's backed (non-planned) topics + how many the learner has
 *  completed, given the set of their completed "module/chapter/topic" slugs. */
function moduleProgress(moduleSlug: string, completed: Set<string>): NoteModuleProgress {
  const mod = findNoteModule(moduleSlug);
  let total = 0;
  let done = 0;
  for (const chapter of mod?.chapters ?? []) {
    for (const topic of chapter.topics) {
      if (topic.planned) continue;
      total += 1;
      if (completed.has(`${moduleSlug}/${chapter.slug}/${topic.slug}`)) done += 1;
    }
  }
  return {
    slug: moduleSlug,
    title: mod?.title ?? moduleSlug,
    done,
    total,
    pct: total ? Math.round((done / total) * 100) : 0,
  };
}

/** The current learner's progress across the whole notes curriculum, grouped by
 *  track — the data behind the dashboard learning home and track certificates.
 *  A track certificate is earned when every backed topic in it is completed. */
export async function getNotesCurriculumProgress(): Promise<NoteTrackProgress[]> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const { data } = await service.from("note_progress").select("note_slug").eq("user_id", userId);
  const completed = new Set((data ?? []).map((r) => r.note_slug as string));

  return NOTE_TRACKS.map((track) => {
    const modules = track.moduleSlugs.map((s) => moduleProgress(s, completed));
    const topicsDone = modules.reduce((n, m) => n + m.done, 0);
    const topicCount = modules.reduce((n, m) => n + m.total, 0);
    const modulesDone = modules.filter((m) => m.total > 0 && m.done === m.total).length;
    const moduleCount = modules.filter((m) => m.total > 0).length;
    return {
      slug: track.slug,
      title: track.title,
      blurb: track.blurb,
      modules,
      modulesDone,
      moduleCount,
      topicsDone,
      topicCount,
      pct: topicCount ? Math.round((topicsDone / topicCount) * 100) : 0,
      certEarned: topicCount > 0 && topicsDone === topicCount,
    };
  });
}

export interface LearningHomeItem {
  moduleSlug: string;
  chapterSlug: string;
  topicSlug: string;
  title: string;
  moduleTitle: string;
}

export interface LearningHomeItemWithTrack extends LearningHomeItem {
  trackTitle: string;
}

export interface LearningHome {
  /** Most recently completed note — "continue" reopens it, doesn't advance
   *  past it. null for a learner with zero progress. */
  continueItem: LearningHomeItem | null;
  /** First unstarted, non-planned topic in NOTE_TRACKS order — the curated
   *  "zero to job-ready" spine order, not raw taxonomy order. null once
   *  every backed topic across every track is done. */
  recommendedItem: LearningHomeItemWithTrack | null;
}

/** The dashboard's personalized landing data. Reuses the same note_progress
 *  read getNotesCurriculumProgress does — a second single-column indexed
 *  query is cheap enough not to bother threading a shared result between the
 *  two, and keeps each function independently callable. */
export async function getLearningHome(): Promise<LearningHome> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const { data } = await service
    .from("note_progress")
    .select("note_slug, completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });
  const rows = data ?? [];
  const completed = new Set(rows.map((r) => r.note_slug as string));

  let continueItem: LearningHomeItem | null = null;
  const mostRecent = rows[0]?.note_slug as string | undefined;
  if (mostRecent) {
    const [moduleSlug, chapterSlug, topicSlug] = mostRecent.split("/");
    const leaf =
      moduleSlug && chapterSlug && topicSlug
        ? findNoteLeaf(moduleSlug, chapterSlug, topicSlug)
        : undefined;
    if (leaf && moduleSlug) {
      continueItem = {
        moduleSlug,
        chapterSlug: chapterSlug!,
        topicSlug: topicSlug!,
        title: leaf.title,
        moduleTitle: findNoteModule(moduleSlug)?.title ?? moduleSlug,
      };
    }
  }

  let recommendedItem: LearningHomeItemWithTrack | null = null;
  outer: for (const track of NOTE_TRACKS) {
    for (const moduleSlug of track.moduleSlugs) {
      const mod = findNoteModule(moduleSlug);
      if (!mod) continue;
      for (const chapter of mod.chapters) {
        for (const topic of chapter.topics) {
          if (topic.planned) continue;
          const slug = `${moduleSlug}/${chapter.slug}/${topic.slug}`;
          if (completed.has(slug)) continue;
          recommendedItem = {
            moduleSlug,
            chapterSlug: chapter.slug,
            topicSlug: topic.slug,
            title: topic.title,
            moduleTitle: mod.title,
            trackTitle: track.title,
          };
          break outer;
        }
      }
    }
  }

  return { continueItem, recommendedItem };
}

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
  for (const note of await getCachedCurriculumIndex()) {
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
        moduleSlug: note.moduleSlug,
        chapterSlug: note.chapterSlug,
        topicSlug: note.topicSlug,
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
async function resolveNoteSlug(
  noteSlug: string,
): Promise<{ m: string; c: string; t: string } | null> {
  const [m, c, t] = noteSlug.split("/");
  if (!m || !c || !t) return null;
  const leaf = findNoteLeaf(m, c, t);
  if (!leaf || leaf.planned || !(await getCachedTopic(noteSlug))) return null;
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
  return withLogging("completeNote", userId, () => completeNoteSave(userId, noteSlug));
}

async function completeNoteSave(
  userId: string,
  noteSlug: string,
): Promise<{ ok: true; xp: number; alreadyDone: boolean }> {
  if (!(await resolveNoteSlug(noteSlug))) throw new Error("Note not available");

  const service = createServiceClient();

  const { count } = await service
    .from("note_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("note_slug", noteSlug);
  const alreadyDone = (count ?? 0) > 0;

  if (alreadyDone) return { ok: true, xp: XP_NOTE_COMPLETED, alreadyDone: true };

  const { error: progressError } = await service.from("note_progress").upsert(
    {
      user_id: userId,
      note_slug: noteSlug,
      status: "completed",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,note_slug" },
  );
  if (progressError) throw new Error(progressError.message);

  await service.from("xp_events").insert({
    user_id: userId,
    amount: XP_NOTE_COMPLETED,
    reason: "note_completed",
    ref_id: noteSlug,
  });

  await touchStreak(service, userId);

  // Best-effort audit; a failure here must never fail the completion.
  await service
    .from("audit_events")
    .insert({ actor_id: userId, action: "note.completed", target: noteSlug, metadata: {} })
    .then(({ error }) => {
      if (error) console.error("audit_events insert failed:", error.message);
    });

  return { ok: true, xp: XP_NOTE_COMPLETED, alreadyDone: false };
}
