import { getFeed } from "./actions";
import { FeedClient } from "./feed-client";

export const metadata = {
  title: "Community · QA Mastery",
};

/**
 * Community feed. RSC fetches the first page (Latest); the client component owns
 * tabs, search, infinite scroll and optimistic likes. Auth is gated by
 * (app)/layout.tsx.
 */
export default async function CommunityPage() {
  const initial = await getFeed("latest");

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-widest text-accent">Community</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">The QA floor</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Share wins, ask questions, and learn in the open with testers, clients and fellow learners.
      </p>

      <div className="mt-6">
        <FeedClient initial={initial} />
      </div>
    </main>
  );
}
