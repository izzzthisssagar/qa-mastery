import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/motion";
import { StatCard } from "@/components/stat-card";
import { talentEnabled } from "@/lib/talent/flag";
import { getLearningHome, getNotesCurriculumProgress } from "@/app/(app)/notes/actions";
import { BuggyApiCard } from "./buggyapi-card";
import { ContinueLearningCard } from "./components/continue-learning-card";
import { HubGrid } from "./components/hub-grid";
import { RecommendedNextCard } from "./components/recommended-next-card";
import { RolePanels } from "./components/role-panels";
import { TrackBrowser } from "./components/track-browser";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  // The notes wiki is the learning spine: progress is per-topic, grouped into
  // tracks (see packages/curriculum/src/notes/tracks.ts).
  const [tracks, learningHome] = await Promise.all([
    getNotesCurriculumProgress(),
    getLearningHome(),
  ]);
  const topicsDone = tracks.reduce((n, t) => n + t.topicsDone, 0);
  const topicCount = tracks.reduce((n, t) => n + t.topicCount, 0);
  const overallPct = topicCount ? Math.round((topicsDone / topicCount) * 100) : 0;

  // XP spans lessons, tasks, and notes (all write xp_events). Aggregated
  // server-side (my_xp_total(), security invoker — RLS still scopes it to
  // the caller's own rows) instead of transferring every xp_events row to
  // sum client-side.
  const { data: xpTotal, error: xpError } = await supabase.rpc("my_xp_total");
  if (xpError) console.error("my_xp_total RPC failed:", xpError.message);
  const totalXp = xpTotal !== null && xpTotal !== undefined ? Number(xpTotal) : 0;

  // read-own RLS; no row yet just means a learner with zero streak history.
  const { data: streakRow } = await supabase
    .from("streaks")
    .select("current_streak")
    .maybeSingle<{ current_streak: number }>();
  const currentStreak = streakRow?.current_streak ?? 0;

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
        <Reveal fade={false}>
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs font-medium uppercase tracking-widest text-accent">Dashboard</p>
          </div>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your <span className="font-serif-accent font-normal text-accent">learning</span>
          </h1>
          <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
            {topicCount} notes across {tracks.length} tracks — the whole QA arc, zero to job-ready.
            Every note is free.
          </p>
        </Reveal>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <StatCard testId="stat-xp" value={totalXp} label="XP earned" accent delay={0.05} />
          <StatCard
            testId="stat-completed"
            value={topicsDone}
            label="notes complete"
            suffix={
              <span className="font-sans text-lg font-normal text-muted-foreground">
                {" "}
                / {topicCount}
              </span>
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
          <StatCard
            testId="stat-streak"
            value={currentStreak}
            label="day streak"
            suffix={currentStreak > 0 ? <span aria-hidden> 🔥</span> : undefined}
            delay={0.26}
          />
        </div>

        <Reveal delay={0.3}>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ContinueLearningCard item={learningHome.continueItem} />
            <RecommendedNextCard item={learningHome.recommendedItem} />
          </div>
        </Reveal>

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

        <TrackBrowser tracks={tracks} defaultOpen={learningHome.continueItem === null} />
      </div>
    </div>
  );
}
