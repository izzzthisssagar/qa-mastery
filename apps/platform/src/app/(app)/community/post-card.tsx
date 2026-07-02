"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleLike, type FeedPost } from "./actions";
import { communityImageUrl } from "@/lib/community/media";

/** One post in the feed. Optimistic like toggle; the count reconciles from the
 *  server action's authoritative result. */
export function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [count, setCount] = useState(post.likeCount);
  const [pending, startTransition] = useTransition();

  function like() {
    // optimistic
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      try {
        const res = await toggleLike("post", post.id);
        setLiked(res.liked);
      } catch {
        // roll back on failure
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  const image = post.media.find((m) => m.type === "image" && m.path);
  const video = post.media.find((m) => m.type === "video" && m.url);

  return (
    <article
      data-testid="community-post"
      className="rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-foreground">{post.authorName ?? "Member"}</span>
        {post.kind === "question" && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
            Question
          </span>
        )}
        {post.acceptedAnswerId && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
            Answered
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      <Link href={`/community/${post.id}`} className="mt-2 block">
        {post.title && <h2 className="text-lg font-semibold text-foreground">{post.title}</h2>}
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90 line-clamp-6">{post.body}</p>
      </Link>

      {image?.path && (
        <img
          src={communityImageUrl(image.path)}
          alt=""
          className="mt-3 max-h-96 w-full rounded-xl border border-border object-cover"
        />
      )}
      {video?.url && (
        <video src={video.url} controls className="mt-3 max-h-96 w-full rounded-xl border border-border" />
      )}

      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Link
              key={t}
              href={`/community/tags/${t}`}
              className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <button
          type="button"
          data-testid="post-like"
          onClick={like}
          disabled={pending}
          className={`flex items-center gap-1.5 transition-colors ${liked ? "text-accent" : "hover:text-foreground"}`}
        >
          <span aria-hidden>{liked ? "♥" : "♡"}</span>
          {count}
        </button>
        <Link href={`/community/${post.id}`} className="flex items-center gap-1.5 hover:text-foreground">
          <span aria-hidden>💬</span>
          {post.commentCount}
        </Link>
      </div>
    </article>
  );
}
