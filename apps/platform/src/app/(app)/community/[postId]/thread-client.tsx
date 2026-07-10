"use client";

import { useState, useTransition } from "react";
import { Button } from "@qa-mastery/ui";
import {
  addComment,
  toggleLike,
  acceptAnswer,
  reportSubject,
  type PostThread,
  type ThreadComment,
} from "../actions";

function CommentRow({
  comment,
  postId,
  isQuestion,
  canAccept,
  onAccepted,
}: {
  comment: ThreadComment;
  postId: string;
  isQuestion: boolean;
  canAccept: boolean;
  onAccepted: (id: string) => void;
}) {
  const [liked, setLiked] = useState(comment.likedByMe);
  const [count, setCount] = useState(comment.likeCount);
  const [pending, startTransition] = useTransition();

  function like() {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      try {
        const r = await toggleLike("comment", comment.id);
        setLiked(r.liked);
      } catch {
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  function report() {
    const reason = window.prompt("Why are you reporting this comment?");
    if (reason) startTransition(() => reportSubject("comment", comment.id, reason).catch(() => {}));
  }

  return (
    <div
      data-testid="thread-comment"
      className={`rounded-xl border p-4 ${
        comment.isAccepted ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-foreground">{comment.authorName ?? "Member"}</span>
        {comment.isAccepted && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
            ✓ Accepted
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/90">{comment.body}</p>
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={like}
          disabled={pending}
          className={`flex items-center gap-1 ${liked ? "text-accent" : "hover:text-foreground"}`}
        >
          {liked ? "♥" : "♡"} {count}
        </button>
        {isQuestion && canAccept && !comment.isAccepted && (
          <button
            type="button"
            data-testid="accept-answer"
            onClick={() => startTransition(async () => {
              await acceptAnswer(postId, comment.id);
              onAccepted(comment.id);
            })}
            className="text-emerald-400 hover:underline"
          >
            Accept answer
          </button>
        )}
        <button type="button" onClick={report} className="hover:text-foreground">
          Report
        </button>
      </div>
    </div>
  );
}

export function ThreadClient({ thread }: { thread: PostThread }) {
  const [comments, setComments] = useState(thread.comments);
  const [acceptedId, setAcceptedId] = useState(thread.post.acceptedAnswerId);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isQuestion = thread.post.kind === "question";

  function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      try {
        const id = await addComment(thread.post.id, trimmed);
        setComments((c) => [
          ...c,
          {
            id,
            authorId: "me",
            authorName: "You",
            parentId: null,
            body: trimmed,
            isAccepted: false,
            likeCount: 0,
            likedByMe: false,
            createdAt: new Date().toISOString(),
          },
        ]);
        setBody("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not comment");
      }
    });
  }

  function markAccepted(id: string) {
    setAcceptedId(id);
    setComments((cs) => cs.map((c) => ({ ...c, isAccepted: c.id === id })));
  }

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-foreground">
        {comments.length} {isQuestion ? "answer" : "comment"}
        {comments.length === 1 ? "" : "s"}
      </h2>

      <div className="mt-3 space-y-3">
        {comments.map((c) => (
          <CommentRow
            key={c.id}
            comment={{ ...c, isAccepted: c.id === acceptedId || c.isAccepted }}
            postId={thread.post.id}
            isQuestion={isQuestion}
            canAccept={thread.isAuthor}
            onAccepted={markAccepted}
          />
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isQuestion ? "Write an answer…" : "Add a comment…"}
          data-testid="comment-body"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent min-h-24"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button onClick={submit} loading={pending} disabled={!body.trim()} data-testid="comment-submit">
          {pending ? "Posting…" : isQuestion ? "Post answer" : "Comment"}
        </Button>
      </div>
    </div>
  );
}
