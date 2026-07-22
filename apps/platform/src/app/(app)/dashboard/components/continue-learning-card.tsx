import Link from "next/link";
import { EmptyState } from "@qa-mastery/ui";
import type { LearningHomeItem } from "../../notes/actions";

/**
 * "Continue learning" — reopens the most recently completed note (not the
 * next one; that's RecommendedNextCard's job). null for a learner with zero
 * progress, which is exactly EmptyState's cold-start case, not an error.
 */
export function ContinueLearningCard({ item }: { item: LearningHomeItem | null }) {
  if (!item) {
    return (
      <EmptyState
        className="px-6 py-8"
        title="Nothing started yet"
        description="Pick a topic from the recommended path, or browse the full curriculum below."
      />
    );
  }

  return (
    <Link
      href={`/notes/${item.moduleSlug}/${item.chapterSlug}/${item.topicSlug}`}
      data-testid="continue-learning-card"
      className="group flex flex-col gap-1 rounded-2xl border border-border bg-surface/40 p-5 transition-colors hover:border-accent/50"
    >
      <p className="text-xs font-medium uppercase tracking-widest text-accent-text">
        Continue learning
      </p>
      <p className="mt-1 font-medium text-foreground">{item.title}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{item.moduleTitle}</p>
    </Link>
  );
}
