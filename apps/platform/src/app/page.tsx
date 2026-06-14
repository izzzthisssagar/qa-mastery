import Link from "next/link";
import { Reveal, RevealOnView } from "@/components/motion";
import { BugHuntCard } from "@/components/marketing/bug-hunt-card";
import { CtaLink } from "@/components/marketing/cta-link";
import { TrackSwitch } from "@/components/marketing/track-switch";

const PILLARS = [
  {
    no: "01",
    title: "Learn by seeing it move",
    body: "Every concept comes with an interactive widget — boundary sliders, state machines, locator playgrounds. Five of them, built to make the abstract click.",
    meta: "5 interactive widgets",
  },
  {
    no: "02",
    title: "Hunt real seeded bugs",
    body: "BuggyShop is a real running app with defects planted on purpose. You explore, reproduce, and file findings against a hidden manifest — just like the field.",
    meta: "Live Bug Hunt",
  },
  {
    no: "03",
    title: "Get graded like a job",
    body: "Submit your test cases, reports, and automation. They’re scored the way a lead would review them — with feedback, not just a green check.",
    meta: "Manual → automation",
  },
];

const STATS = [
  { value: "2", label: "tracks — manual & automation" },
  { value: "5", label: "interactive concept widgets" },
  { value: "∞", label: "reps on a real practice app" },
];

export default function HomePage() {
  return (
    <div className="grain relative flex flex-1 flex-col overflow-hidden">
      {/* Atmosphere */}
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="bg-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]" />

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="font-display text-lg font-bold tracking-tight">
          QA<span className="text-accent">Mastery</span>
        </span>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/login" className="text-zinc-300 transition-colors hover:text-zinc-50">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-4 py-2 font-semibold text-zinc-950 transition hover:opacity-90"
          >
            Start learning
          </Link>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 flex-col">
        <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 pb-20 pt-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
          <div>
            <Reveal delay={0}>
              <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
                <span className="size-1.5 rounded-full bg-accent" />
                The hands-on QA learning platform
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="font-display mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Don&apos;t watch
                <br />
                testing.{" "}
                <span className="relative whitespace-nowrap text-accent">
                  Do it.
                  <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-accent/40" />
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
                Learn every QA concept on interactive visuals, hunt real seeded
                bugs in a live practice app, and get your work graded like
                you&apos;re already on the job — from manual testing all the way
                to automation.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <CtaLink href="/signup">Start learning free</CtaLink>
                <CtaLink href="/login" variant="ghost">
                  Log in
                </CtaLink>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-zinc-800 pt-6">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <dt className="font-display text-2xl font-bold text-zinc-100">
                      {s.value}
                    </dt>
                    <dd className="mt-1 text-xs leading-snug text-zinc-500">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={0.2} y={28}>
            <BugHuntCard />
          </Reveal>
        </section>

        {/* ── Pillars ────────────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10">
          <RevealOnView>
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              How it works
            </p>
            <h2 className="font-display mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Three ways this is different from watching a course.
            </h2>
          </RevealOnView>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PILLARS.map((p, i) => (
              <RevealOnView key={p.no} delay={i * 0.08}>
                <article className="group h-full rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 transition-colors duration-300 hover:border-accent/40">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-2xl font-bold text-zinc-700 transition-colors group-hover:text-accent/70">
                      {p.no}
                    </span>
                    <span className="rounded-full border border-zinc-800 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                      {p.meta}
                    </span>
                  </div>
                  <h3 className="font-display mt-5 text-xl font-bold text-zinc-100">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{p.body}</p>
                </article>
              </RevealOnView>
            ))}
          </div>
        </section>

        {/* ── Two tracks ─────────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <RevealOnView>
              <p className="text-xs font-medium uppercase tracking-widest text-accent">
                Two tracks, one path
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Start manual.
                <br />
                Graduate to automation.
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-zinc-400">
                You don&apos;t jump straight to code. You learn to test by hand,
                then watch those same skills become a Selenium + Java suite that
                runs itself. Switch the panel to see each path.
              </p>
            </RevealOnView>

            <RevealOnView delay={0.1}>
              <TrackSwitch />
            </RevealOnView>
          </div>
        </section>

        {/* ── Closing CTA ────────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-10 sm:px-10">
          <RevealOnView>
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40 px-8 py-16 text-center sm:px-16">
              <div className="bg-glow pointer-events-none absolute inset-x-0 bottom-0 h-2/3 rotate-180" />
              <div className="relative">
                <h2 className="font-display mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
                  The fastest way to learn QA is to break something.
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-zinc-400">
                  Make an account, open the practice app, and file your first bug
                  in minutes. No card, no fluff.
                </p>
                <div className="mt-9 flex items-center justify-center gap-4">
                  <CtaLink href="/signup">Start learning free</CtaLink>
                </div>
              </div>
            </div>
          </RevealOnView>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-zinc-800/60 px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-zinc-600 sm:flex-row">
          <span className="font-display text-sm font-bold tracking-tight text-zinc-400">
            QA<span className="text-accent">Mastery</span>
          </span>
          <span>
            Built in public · BuggyShop and the first lessons are on their way.
          </span>
        </div>
      </footer>
    </div>
  );
}
