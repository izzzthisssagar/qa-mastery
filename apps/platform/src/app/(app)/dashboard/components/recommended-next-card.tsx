import Link from "next/link";
import type { LearningHomeItemWithTrack } from "../../notes/actions";

/**
 * "Recommended next" — the first unstarted topic in NOTE_TRACKS order (the
 * curated zero-to-job-ready spine), not raw taxonomy order. null only once
 * every backed topic across every track is complete.
 */
export function RecommendedNextCard({ item }: { item: LearningHomeItemWithTrack | null }) {
  if (!item) {
    return (
      <div
        data-testid="recommended-next-card"
        className="flex flex-col justify-center gap-1 rounded-2xl border border-accent/40 bg-accent/5 p-5 text-center"
      >
        <p className="font-display text-lg font-semibold text-foreground">
          🏆 Every track complete
        </p>
        <p className="text-sm text-muted-foreground">
          You&apos;ve finished the whole curriculum. Browse it again below, or head to Tasks.
        </p>
      </div>
    );
  }

  return (
    <Link
      href={`/notes/${item.moduleSlug}/${item.chapterSlug}/${item.topicSlug}`}
      data-testid="recommended-next-card"
      className="group flex flex-col gap-1 rounded-2xl border border-accent/30 bg-accent/5 p-5 transition-colors hover:border-accent/60"
    >
      <p className="text-xs font-medium uppercase tracking-widest text-accent-text">
        Recommended next · {item.trackTitle}
      </p>
      <p className="mt-1 font-medium text-foreground">{item.title}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{item.moduleTitle}</p>
    </Link>
  );
}
