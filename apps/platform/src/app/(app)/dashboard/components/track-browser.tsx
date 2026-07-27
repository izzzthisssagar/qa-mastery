import Link from "next/link";
import { Reveal } from "@/components/motion";
import { TrackProgressBar } from "@/components/track-progress-bar";
import type { NoteTrackProgress } from "../../notes/actions";

/**
 * The full track/module browser — everything the dashboard used to render
 * unconditionally (dashboard/page.tsx lines ~148-217, moved here verbatim)
 * now lives behind a collapsed-by-default disclosure once a learner has a
 * continue/recommended card to look at instead.
 *
 * `<details>`, not a conditional render: the content stays in the DOM either
 * way (just visually hidden when closed), so the existing e2e assertions on
 * track-${slug}/track-progress-${slug}/module-card-${slug}/
 * certificate-link-${slug} (learn.spec.ts, hub-nav.spec.ts) keep resolving
 * without needing an extra "expand" step added to test setup.
 */
export function TrackBrowser({
  tracks,
  defaultOpen,
}: {
  tracks: NoteTrackProgress[];
  defaultOpen: boolean;
}) {
  return (
    <details open={defaultOpen} className="group mt-12">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <span aria-hidden className="transition-transform group-open:rotate-90">
          ▶
        </span>
        <span>Browse all tracks &amp; modules</span>
      </summary>

      <div className="mt-8 space-y-12">
        {tracks.map((track, trackIndex) => (
          <Reveal key={track.slug} delay={0.05 + trackIndex * 0.04}>
            <section data-testid={`track-${track.slug}`}>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-xl font-semibold tracking-tight">{track.title}</h2>
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
                          className={`shrink-0 text-xs ${complete ? "text-accent-text" : "text-muted-foreground"}`}
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
    </details>
  );
}
