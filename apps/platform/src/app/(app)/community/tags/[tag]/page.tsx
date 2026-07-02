import Link from "next/link";
import { getPostsByTag } from "../../actions";
import { PostCard } from "../../post-card";

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const posts = await getPostsByTag(tag);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to feed
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-foreground">#{tag}</h1>
      <div className="mt-6 space-y-4">
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
            No posts tagged #{tag} yet.
          </p>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>
    </main>
  );
}
