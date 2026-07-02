"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PostCard } from "./post-card";
import { getFeed, searchPosts, type FeedPost, type FeedTab } from "./actions";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "following", label: "Following" },
  { id: "top", label: "Top" },
];

export function FeedClient({ initial }: { initial: FeedPost[] }) {
  const [tab, setTab] = useState<FeedTab>("latest");
  const [posts, setPosts] = useState<FeedPost[]>(initial);
  const [done, setDone] = useState(initial.length < 20);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  function switchTab(next: FeedTab) {
    setTab(next);
    setQuery("");
    startTransition(async () => {
      const rows = await getFeed(next);
      setPosts(rows);
      setDone(rows.length < 20 || next === "top");
    });
  }

  function loadMore() {
    const last = posts[posts.length - 1];
    if (!last) return;
    startTransition(async () => {
      const rows = await getFeed(tab, { createdAt: last.createdAt, id: last.id });
      setPosts((p) => [...p, ...rows]);
      if (rows.length < 20) setDone(true);
    });
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    startTransition(async () => {
      const rows = q ? await searchPosts(q) : await getFeed("latest");
      setPosts(rows);
      setDone(true);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              data-testid={`feed-tab-${t.id}`}
              onClick={() => switchTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id ? "bg-accent text-zinc-950" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSearch} className="ml-auto flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            data-testid="community-search"
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
          />
        </form>

        <Link
          href="/community/new"
          data-testid="community-new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:opacity-90"
        >
          New post
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
            {tab === "following"
              ? "Follow some members to see their posts here."
              : "No posts yet. Be the first to start a conversation."}
          </p>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>

      {!done && posts.length > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={pending}
            className="rounded-lg border border-border px-5 py-2 text-sm text-foreground hover:bg-surface disabled:opacity-60"
          >
            {pending ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
