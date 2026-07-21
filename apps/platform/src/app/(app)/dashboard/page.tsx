import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/motion";
import { StatCard } from "@/components/stat-card";
import { TrackProgressBar } from "@/components/track-progress-bar";
import { talentEnabled } from "@/lib/talent/flag";
import { getNotesCurriculumProgress } from "@/app/(app)/notes/actions";
import { BuggyApiCard } from "./buggyapi-card";
import { HubGrid } from "./components/hub-grid";
import { RolePanels } from "./components/role-panels";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  // The notes wiki is the learning spine: progress is per-topic, grouped into
  // tracks (see packages/curriculum/src/notes/tracks.ts).
  const tracks = await getNotesCurriculumProgress();
  const topicsDone = tracks.reduce((n, t) => n + t.topicsDone, 0);
  const topicCount = tracks.reduce((n, t) => n + t.topicCount, 0);
  const overallPct = topicCount ? Math.round((topicsDone / topicCount) * 100) : 0;

  // XP spans lessons, tasks, and notes (all write xp_events); read-own RLS.
  const { data: xpRows } = await supabase.from("xp_events").select("amount");
  const totalXp = (xpRows ?? []).reduce((sum, x) => sum + (x.amount as number), 0);

  // Marketplace role drives the role-adaptive panels (read-own RLS on profiles).
  const { data: profile } = await supabase
    .from("profiles")
    .select("talent_role")
    .maybeSingle<{ talent_role: "none" | "tester" | "client" | "both" }>();
  const talentRole = profile?.talent_role ?? "none";
  const showTalent = talentEnabled();

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
          </div>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your{" "}
            <span className="font-serif-accent font-normal text-accent">
              learning
            </span>
          </h1>
          <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
            {topicCount} notes across {tracks.length} tracks — the whole QA arc,
            zero to job-ready. Every note is free.
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
            value={topicsDone}
            label="notes complete"
            suffix={
              <span className="font-sans text-lg font-normal text-muted-foreground"> / {topicCount}</span>
            }
            delay={0.12}
          />
          <StatCard
            testId="stat-overall"
            value={overallPct}
            label="overall progress"
            suffix={<span className="font-sans text-lg font-normal text-muted-foreground">%</span>}
            delay={0.19}
          />
        </div>

        <Reveal delay={0.22}>
          <div className="mt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Your hub
            </p>
            <HubGrid showTalent={showTalent} />
            <RolePanels role={talentRole} talentEnabled={showTalent} />
          </div>
        </Reveal>

        {talentEnabled() && (
          <Reveal delay={0.24}>
            <Link
              href="/talent"
              className="group mt-8 flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] px-5 py-4 transition-colors hover:border-emerald-500/50"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-accent">
                  QA Mastery Talent
                </p>
                <p className="mt-1 font-medium text-foreground">
                  Turn your progress into work — get hired or hire testers →
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Publish a proof-forward profile, or post a project and find QA.
                </p>
              </div>
              <span className="hidden shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition group-hover:opacity-90 sm:inline">
                Open
              </span>
            </Link>
          </Reveal>
        )}

        <Reveal delay={0.28}>
          <BuggyApiCard />
        </Reveal>

        <Reveal delay={0.32}>
          <Link
            href="/simulator"
            data-testid="simulator-card"
            className="group mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-violet-500/25 bg-violet-500/[0.05] px-5 py-4 text-left transition-colors hover:border-violet-500/50"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-violet-700 dark:text-violet-400">
                Coding simulator
              </p>
              <p className="mt-1 font-medium text-foreground">
                Run Java, Python, JS, TS &amp; C# in the browser →
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                A free scratchpad for practising automation logic — no setup.
              </p>
            </div>
            <span className="hidden shrink-0 rounded-lg bg-violet-400 px-4 py-2 text-sm font-semibold text-accent-foreground transition group-hover:opacity-90 sm:inline">
              Open
            </span>
          </Link>
        </Reveal>

        <div className="mt-12 space-y-12">
          {tracks.map((track, trackIndex) => (
            <Reveal key={track.slug} delay={0.05 + trackIndex * 0.04}>
              <section data-testid={`track-${track.slug}`}>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    {track.title}
                  </h2>
                  <span
                    data-testid={`track-progress-${track.slug}`}
                    className="shrink-0 font-mono text-xs text-muted-foreground"
                  >
                    {track.topicsDone} / {track.topicCount}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{track.blurb}</p>
                <div className="mt-3">
                  <TrackProgressBar pct={track.pct} />
                </div>
                {track.certEarned && (
                  <Link
                    href={`/certificate/${track.slug}`}
                    data-testid={`certificate-link-${track.slug}`}
                    className="mt-2 inline-block text-xs font-medium text-accent hover:opacity-80"
                  >
                    🏆 View your certificate →
                  </Link>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {track.modules.map((module) => {
                    const complete = module.total > 0 && module.done === module.total;
                    return (
                      <Link
                        key={module.slug}
                        href={`/notes/${module.slug}`}
                        data-testid={`module-card-${module.slug}`}
                        className="group flex flex-col gap-2 rounded-2xl border border-border bg-surface/40 p-4 transition-colors hover:border-accent/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {module.title}
                          </span>
                          <span
                            className={`shrink-0 text-xs ${complete ? "text-accent" : "text-muted-foreground"}`}
                          >
                            {complete ? "✓ " : ""}
                            {module.done}/{module.total}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised">
                          <div
                            className="h-full rounded-full bg-accent transition-[width]"
                            style={{ width: `${module.pct}%` }}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
