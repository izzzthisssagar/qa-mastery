import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/motion";
import { StatCard } from "@/components/stat-card";
import { TrackProgressBar } from "@/components/track-progress-bar";
import { LessonRow } from "@/components/lesson-row";
import { UpgradeButton } from "@/components/upgrade-button";

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

  const { count: proCount } = await supabase
    .from("entitlements")
    .select("*", { count: "exact", head: true })
    .eq("kind", "pro");
  const isPro = (proCount ?? 0) > 0;

  const overallPct = lessonCount ? Math.round((completed.size / lessonCount) * 100) : 0;

  return (
    <div className="relative isolate">
      {/* Atmosphere — sits behind everything, never intercepts clicks. */}
      <div aria-hidden className="grain pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute inset-x-0 top-0 h-80 bg-glow" />
      </div>

      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs font-medium uppercase tracking-widest text-accent">Dashboard</p>
            {isPro ? (
              <span
                data-testid="pro-badge"
                className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
              >
                ★ Pro
              </span>
            ) : (
              <UpgradeButton />
            )}
          </div>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your learning
          </h1>
          <p className="mt-2 max-w-prose text-sm leading-6 text-zinc-400">
            {lessonCount} lessons live across {tracks.length} track
            {tracks.length === 1 ? "" : "s"}.{" "}
            {isPro ? "Pro unlocked." : "Pro lessons unlock the capstone."}
          </p>
        </Reveal>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <StatCard
            testId="stat-xp"
            value={totalXp}
            label="XP earned"
            accent
            delay={0.05}
          />
          <StatCard
            testId="stat-completed"
            value={completed.size}
            label="lessons complete"
            suffix={
              <span className="font-sans text-lg font-normal text-zinc-500"> / {lessonCount}</span>
            }
            delay={0.12}
          />
          <StatCard
            testId="stat-overall"
            value={overallPct}
            label="overall progress"
            suffix={<span className="font-sans text-lg font-normal text-zinc-500">%</span>}
            delay={0.19}
          />
        </div>

        <div className="mt-12 space-y-12">
          {tracks.map((track, trackIndex) => {
            const trackLessons = track.modules.flatMap((m) => m.lessons);
            const trackDone = trackLessons.filter((l) => completed.has(l.id)).length;
            const trackPct = trackLessons.length
              ? Math.round((trackDone / trackLessons.length) * 100)
              : 0;
            return (
              <Reveal key={track.slug} delay={0.05 + trackIndex * 0.04}>
                <section data-testid={`track-${track.slug}`}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-display text-xl font-semibold tracking-tight">
                      {track.title}
                    </h2>
                    <span
                      data-testid={`track-progress-${track.slug}`}
                      className="shrink-0 font-mono text-xs text-zinc-500"
                    >
                      {trackDone} / {trackLessons.length}
                    </span>
                  </div>
                  <TrackProgressBar pct={trackPct} />

                  <div className="mt-5 space-y-5">
                    {track.modules.map((module) => (
                      <div key={module.slug} data-testid={`module-${module.slug}`}>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-accent">
                          {module.slug.toUpperCase()} — {module.title}
                        </h3>
                        <ul className="mt-2 divide-y divide-zinc-800/80 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <LessonRow
                              key={lesson.slug}
                              slug={lesson.slug}
                              label={`${module.slug.toUpperCase()}.${lesson.order_index}`}
                              title={lesson.title}
                              done={completed.has(lesson.id)}
                              index={lessonIndex}
                            />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              </Reveal>
            );
          })}

          {tracks.length === 0 && (
            <p className="text-sm text-zinc-500">
              Lessons are being published — check back shortly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
