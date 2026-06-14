import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

interface TrackRef {
  slug: string;
  title: string;
  order_index: number;
}

interface LessonRow {
  id: string;
  slug: string;
  title: string;
  free: boolean;
  order_index: number;
  modules: { slug: string; title: string; order_index: number; tracks: TrackRef | null } | null;
}

interface ModuleGroup {
  slug: string;
  title: string;
  order: number;
  lessons: LessonRow[];
}

interface TrackGroup {
  slug: string;
  title: string;
  order: number;
  modules: ModuleGroup[];
}

/** Group published lessons by track, then module, each ordered. */
function groupByTrack(rows: LessonRow[]): TrackGroup[] {
  const tracks = new Map<string, TrackGroup>();
  const moduleByKey = new Map<string, ModuleGroup>();

  for (const row of rows) {
    const m = row.modules;
    const t = m?.tracks;
    if (!m || !t) continue;

    let track = tracks.get(t.slug);
    if (!track) {
      track = { slug: t.slug, title: t.title, order: t.order_index, modules: [] };
      tracks.set(t.slug, track);
    }

    const moduleKey = `${t.slug}/${m.slug}`;
    let mod = moduleByKey.get(moduleKey);
    if (!mod) {
      mod = { slug: m.slug, title: m.title, order: m.order_index, lessons: [] };
      moduleByKey.set(moduleKey, mod);
      track.modules.push(mod);
    }
    mod.lessons.push(row);
  }

  const trackList = [...tracks.values()].sort((a, b) => a.order - b.order);
  for (const track of trackList) {
    track.modules.sort((a, b) => a.order - b.order);
    for (const mod of track.modules) mod.lessons.sort((a, b) => a.order_index - b.order_index);
  }
  return trackList;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("lessons")
    .select(
      "id, slug, title, free, order_index, modules!inner(slug, title, order_index, tracks!inner(slug, title, order_index))",
    )
    .eq("status", "published");

  const rows = (data ?? []) as unknown as LessonRow[];
  const tracks = groupByTrack(rows);
  const lessonCount = rows.length;

  // The learner's own progress + XP (read-own RLS scopes these to them).
  const { data: progressRows } = await supabase
    .from("progress")
    .select("lesson_id, status")
    .eq("status", "completed");
  const completed = new Set((progressRows ?? []).map((p) => p.lesson_id as string));

  const { data: xpRows } = await supabase.from("xp_events").select("amount");
  const totalXp = (xpRows ?? []).reduce((sum, x) => sum + (x.amount as number), 0);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Your learning</h1>
      <p className="mt-1 text-sm text-zinc-400">
        {lessonCount} lessons live across {tracks.length} track{tracks.length === 1 ? "" : "s"}, free
        while in beta.
      </p>

      <div className="mt-5 flex gap-3">
        <div
          data-testid="stat-xp"
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
        >
          <div className="text-2xl font-semibold text-accent">{totalXp}</div>
          <div className="text-xs text-zinc-500">XP earned</div>
        </div>
        <div
          data-testid="stat-completed"
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
        >
          <div className="text-2xl font-semibold text-zinc-100">
            {completed.size}
            <span className="text-base font-normal text-zinc-500"> / {lessonCount}</span>
          </div>
          <div className="text-xs text-zinc-500">lessons complete</div>
        </div>
      </div>

      <div className="mt-8 space-y-10">
        {tracks.map((track) => (
          <section key={track.slug} data-testid={`track-${track.slug}`}>
            <h2 className="text-lg font-semibold">{track.title}</h2>
            <div className="mt-3 space-y-5">
              {track.modules.map((module) => (
                <div key={module.slug} data-testid={`module-${module.slug}`}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-accent">
                    {module.slug.toUpperCase()} — {module.title}
                  </h3>
                  <ul className="mt-2 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.slug}>
                        <Link
                          href={`/learn/${lesson.slug}`}
                          data-testid={`lesson-link-${lesson.slug}`}
                          className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-900"
                        >
                          <span>
                            <span className="text-zinc-500">
                              {module.slug.toUpperCase()}.{lesson.order_index}
                            </span>{" "}
                            <span className="text-zinc-100">{lesson.title}</span>
                          </span>
                          {completed.has(lesson.id) ? (
                            <span
                              data-testid={`lesson-done-${lesson.slug}`}
                              className="text-emerald-400"
                            >
                              ✓ done
                            </span>
                          ) : (
                            <span className="text-accent">→</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}

        {tracks.length === 0 && (
          <p className="text-sm text-zinc-500">Lessons are being published — check back shortly.</p>
        )}
      </div>
    </div>
  );
}
