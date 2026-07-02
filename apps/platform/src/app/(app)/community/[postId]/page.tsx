import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostThread } from "../actions";
import { ThreadClient } from "./thread-client";
import { communityImageUrl } from "@/lib/community/media";

export default async function PostThreadPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const thread = await getPostThread(postId);
  if (!thread) notFound();

  const { post } = thread;
  const image = post.media.find((m) => m.type === "image" && m.path);
  const video = post.media.find((m) => m.type === "video" && m.url);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to feed
      </Link>

      <article className="mt-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{post.authorName ?? "Member"}</span>
          {post.kind === "question" && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">Question</span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>

        {post.title && <h1 className="mt-2 text-2xl font-semibold text-foreground">{post.title}</h1>}
        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{post.body}</p>

        {image?.path && (
          <img src={communityImageUrl(image.path)} alt="" className="mt-4 w-full rounded-xl border border-border" />
        )}
        {video?.url && (
          <video src={video.url} controls className="mt-4 w-full rounded-xl border border-border" />
        )}

        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
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
      </article>

      <ThreadClient thread={thread} />
    </main>
  );
}
