"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@qa-mastery/db";
import { getAuthedUserId } from "@/lib/auth";

/**
 * Community feed server actions. Writes are owner-scoped by RLS, but every
 * mutation re-checks auth here too (the layout gate is optimistic). Notification
 * rows are written through the service role — learners have no insert policy on
 * `notifications`, so a notice can never be forged (mirrors the scores rule).
 * Denormalized like/comment counts are maintained by DB triggers, not here.
 */

const POSTS_PER_PAGE = 20;
const MAX_POSTS_PER_HOUR = 15;

export interface MediaItem {
  type: "image" | "video";
  /** Storage object path for images; absolute URL for Cloudinary videos. */
  path?: string;
  url?: string;
  provider?: "cloudinary";
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string | null;
  kind: "post" | "question";
  title: string | null;
  body: string;
  media: MediaItem[];
  likeCount: number;
  commentCount: number;
  acceptedAnswerId: string | null;
  tags: string[];
  likedByMe: boolean;
  createdAt: string;
}

interface PostRow {
  id: string;
  author_id: string;
  kind: "post" | "question";
  title: string | null;
  body: string;
  media: MediaItem[];
  like_count: number;
  comment_count: number;
  accepted_answer_id: string | null;
  created_at: string;
  profiles: { display_name: string | null } | null;
  community_post_tags: { community_tags: { slug: string } | null }[];
}

async function assertPostQuota(
  service: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<void> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await service
    .from("community_posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId)
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= MAX_POSTS_PER_HOUR) {
    throw new Error("You're posting too fast. Take a breather and try again shortly.");
  }
}

/** Write a notification unless the actor is the recipient (don't notify self). */
async function notify(
  service: ReturnType<typeof createServiceClient>,
  args: { userId: string; actorId: string; type: string; subjectType: string; subjectId: string },
): Promise<void> {
  if (args.userId === args.actorId) return;
  await service.from("notifications").insert({
    user_id: args.userId,
    actor_id: args.actorId,
    type: args.type,
    subject_type: args.subjectType,
    subject_id: args.subjectId,
  });
}

export type FeedTab = "latest" | "following" | "top";

/** Cursor-paginated feed. `latest` = newest first; `following` = only authors
 *  the viewer follows; `top` = most liked in the last week. Cursor is the last
 *  post's created_at + id (keyset pagination — stable under inserts). */
export async function getFeed(
  tab: FeedTab = "latest",
  cursor?: { createdAt: string; id: string },
): Promise<FeedPost[]> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  const select =
    "id, author_id, kind, title, body, media, like_count, comment_count, accepted_answer_id, created_at, profiles:author_id(display_name), community_post_tags(community_tags(slug))";

  let query = service
    .from("community_posts")
    .select(select)
    .is("hidden_at", null)
    .limit(POSTS_PER_PAGE);

  if (tab === "top") {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", weekAgo).order("like_count", { ascending: false }).order("id", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false }).order("id", { ascending: false });
    if (cursor) {
      // keyset: (created_at, id) strictly before the cursor
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
      );
    }
  }

  if (tab === "following") {
    const { data: follows } = await service
      .from("community_follows")
      .select("following_id")
      .eq("follower_id", userId);
    const ids = (follows ?? []).map((f) => f.following_id as string);
    if (ids.length === 0) return [];
    query = query.in("author_id", ids);
  }

  const { data, error } = await query.returns<PostRow[]>();
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  // Which of these did the viewer like? One query, not N.
  const postIds = rows.map((r) => r.id);
  const likedSet = new Set<string>();
  if (postIds.length) {
    const { data: likes } = await service
      .from("community_likes")
      .select("subject_id")
      .eq("user_id", userId)
      .eq("subject_type", "post")
      .in("subject_id", postIds);
    for (const l of likes ?? []) likedSet.add(l.subject_id as string);
  }

  return rows.map((r) => ({
    id: r.id,
    authorId: r.author_id,
    authorName: r.profiles?.display_name ?? null,
    kind: r.kind,
    title: r.title,
    body: r.body,
    media: Array.isArray(r.media) ? r.media : [],
    likeCount: r.like_count,
    commentCount: r.comment_count,
    acceptedAnswerId: r.accepted_answer_id,
    tags: (r.community_post_tags ?? []).map((t) => t.community_tags?.slug).filter(Boolean) as string[],
    likedByMe: likedSet.has(r.id),
    createdAt: r.created_at,
  }));
}

export interface CreatePostInput {
  kind: "post" | "question";
  title?: string;
  body: string;
  media?: MediaItem[];
  tags?: string[];
}

/** Create a post/question, attaching (upserting) tags. Returns the new id. */
export async function createPost(input: CreatePostInput): Promise<string> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  await assertPostQuota(service, userId);

  const body = input.body.trim();
  if (!body) throw new Error("Write something before posting.");

  const { data: post, error } = await service
    .from("community_posts")
    .insert({
      author_id: userId,
      kind: input.kind,
      title: input.title?.trim() || null,
      body,
      media: input.media ?? [],
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !post) throw new Error(error?.message ?? "Could not create post");

  const tagSlugs = [...new Set((input.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 5);
  for (const slug of tagSlugs) {
    const { data: tag } = await service
      .from("community_tags")
      .upsert({ slug, label: slug }, { onConflict: "slug" })
      .select("id")
      .single<{ id: string }>();
    if (tag) await service.from("community_post_tags").insert({ post_id: post.id, tag_id: tag.id });
  }

  revalidatePath("/community");
  return post.id;
}

/** Add a comment (optionally a reply via parentId). Notifies the post author. */
export async function addComment(
  postId: string,
  body: string,
  parentId?: string,
): Promise<string> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Write a comment first.");

  const { data: comment, error } = await service
    .from("community_comments")
    .insert({ post_id: postId, author_id: userId, parent_id: parentId ?? null, body: trimmed })
    .select("id")
    .single<{ id: string }>();
  if (error || !comment) throw new Error(error?.message ?? "Could not comment");

  const { data: post } = await service
    .from("community_posts")
    .select("author_id")
    .eq("id", postId)
    .single<{ author_id: string }>();
  if (post) {
    await notify(service, {
      userId: post.author_id,
      actorId: userId,
      type: "comment",
      subjectType: "post",
      subjectId: postId,
    });
  }

  revalidatePath(`/community/${postId}`);
  return comment.id;
}

/** Toggle a like on a post or comment. Notifies the subject's author on like. */
export async function toggleLike(
  subjectType: "post" | "comment",
  subjectId: string,
): Promise<{ liked: boolean }> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  const { data: existing } = await service
    .from("community_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .maybeSingle<{ id: string }>();

  if (existing) {
    await service.from("community_likes").delete().eq("id", existing.id);
    return { liked: false };
  }

  await service.from("community_likes").insert({ user_id: userId, subject_type: subjectType, subject_id: subjectId });

  const table = subjectType === "post" ? "community_posts" : "community_comments";
  const { data: subject } = await service
    .from(table)
    .select("author_id")
    .eq("id", subjectId)
    .single<{ author_id: string }>();
  if (subject) {
    await notify(service, {
      userId: subject.author_id,
      actorId: userId,
      type: "like",
      subjectType,
      subjectId,
    });
  }
  return { liked: true };
}

/** Follow or unfollow another member. Notifies them on a new follow. */
export async function toggleFollow(followingId: string): Promise<{ following: boolean }> {
  const userId = await getAuthedUserId();
  if (userId === followingId) throw new Error("You can't follow yourself.");
  const service = createServiceClient();

  const { data: existing } = await service
    .from("community_follows")
    .select("follower_id")
    .eq("follower_id", userId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (existing) {
    await service.from("community_follows").delete().eq("follower_id", userId).eq("following_id", followingId);
    return { following: false };
  }

  await service.from("community_follows").insert({ follower_id: userId, following_id: followingId });
  await notify(service, {
    userId: followingId,
    actorId: userId,
    type: "follow",
    subjectType: "profile",
    subjectId: userId,
  });
  return { following: true };
}

/** Mark a comment as the accepted answer to a question. Author-only (RLS also
 *  enforces it). Notifies the answer's author. */
export async function acceptAnswer(postId: string, commentId: string): Promise<void> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  const { data: post } = await service
    .from("community_posts")
    .select("author_id, kind, accepted_answer_id")
    .eq("id", postId)
    .single<{ author_id: string; kind: string; accepted_answer_id: string | null }>();
  if (!post) throw new Error("Question not found.");
  if (post.author_id !== userId) throw new Error("Only the author can accept an answer.");
  if (post.kind !== "question") throw new Error("Only questions accept answers.");

  // Clear a previous acceptance, set the new one.
  if (post.accepted_answer_id) {
    await service.from("community_comments").update({ is_accepted: false }).eq("id", post.accepted_answer_id);
  }
  await service.from("community_comments").update({ is_accepted: true }).eq("id", commentId).eq("post_id", postId);
  await service.from("community_posts").update({ accepted_answer_id: commentId }).eq("id", postId);

  const { data: answer } = await service
    .from("community_comments")
    .select("author_id")
    .eq("id", commentId)
    .single<{ author_id: string }>();
  if (answer) {
    await notify(service, {
      userId: answer.author_id,
      actorId: userId,
      type: "accepted",
      subjectType: "comment",
      subjectId: commentId,
    });
  }
  revalidatePath(`/community/${postId}`);
}

/** File a moderation report against a post or comment. */
export async function reportSubject(
  subjectType: "post" | "comment",
  subjectId: string,
  reason: string,
): Promise<void> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Tell us what's wrong.");
  const { error } = await service
    .from("community_reports")
    .insert({ reporter_id: userId, subject_type: subjectType, subject_id: subjectId, reason: trimmed });
  // A duplicate report (unique violation) is a no-op success — already flagged.
  if (error && error.code !== "23505") throw new Error(error.message);
}

/** Admin: hide a post or comment (soft-delete for everyone but author/admins). */
export async function hideSubject(
  subjectType: "post" | "comment",
  subjectId: string,
): Promise<void> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  const { data: me } = await service.from("profiles").select("is_admin").eq("id", userId).single<{ is_admin: boolean }>();
  if (!me?.is_admin) throw new Error("Admins only.");

  const table = subjectType === "post" ? "community_posts" : "community_comments";
  await service.from(table).update({ hidden_at: new Date().toISOString(), hidden_by: userId }).eq("id", subjectId);
  revalidatePath("/community");
}

/** Full-text search over posts (title + body) via websearch_to_tsquery. */
export async function searchPosts(q: string): Promise<FeedPost[]> {
  await getAuthedUserId(); // auth gate; likedByMe isn't computed for search hits
  const service = createServiceClient();
  const term = q.trim();
  if (!term) return [];

  const { data, error } = await service
    .from("community_posts")
    .select(
      "id, author_id, kind, title, body, media, like_count, comment_count, accepted_answer_id, created_at, profiles:author_id(display_name), community_post_tags(community_tags(slug))",
    )
    .is("hidden_at", null)
    .textSearch("fts", term, { type: "websearch", config: "english" })
    .order("created_at", { ascending: false })
    .limit(POSTS_PER_PAGE)
    .returns<PostRow[]>();
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    authorId: r.author_id,
    authorName: r.profiles?.display_name ?? null,
    kind: r.kind,
    title: r.title,
    body: r.body,
    media: Array.isArray(r.media) ? r.media : [],
    likeCount: r.like_count,
    commentCount: r.comment_count,
    acceptedAnswerId: r.accepted_answer_id,
    tags: (r.community_post_tags ?? []).map((t) => t.community_tags?.slug).filter(Boolean) as string[],
    likedByMe: false,
    createdAt: r.created_at,
  }));
}

export interface ThreadComment {
  id: string;
  authorId: string;
  authorName: string | null;
  parentId: string | null;
  body: string;
  isAccepted: boolean;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface PostThread {
  post: FeedPost;
  isAuthor: boolean;
  comments: ThreadComment[];
}

interface CommentRow {
  id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  is_accepted: boolean;
  like_count: number;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

/** Fetch a single post with its (visible) comments. Returns null if the post is
 *  missing or hidden from this viewer. */
export async function getPostThread(postId: string): Promise<PostThread | null> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  const { data: p } = await service
    .from("community_posts")
    .select(
      "id, author_id, kind, title, body, media, like_count, comment_count, accepted_answer_id, created_at, hidden_at, profiles:author_id(display_name), community_post_tags(community_tags(slug))",
    )
    .eq("id", postId)
    .maybeSingle<PostRow & { hidden_at: string | null }>();
  if (!p || (p.hidden_at && p.author_id !== userId)) return null;

  const { data: myPostLike } = await service
    .from("community_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("subject_type", "post")
    .eq("subject_id", postId)
    .maybeSingle();

  const { data: commentRows } = await service
    .from("community_comments")
    .select("id, author_id, parent_id, body, is_accepted, like_count, created_at, profiles:author_id(display_name)")
    .eq("post_id", postId)
    .is("hidden_at", null)
    .order("is_accepted", { ascending: false })
    .order("created_at", { ascending: true })
    .returns<CommentRow[]>();
  const comments = commentRows ?? [];

  const commentIds = comments.map((c) => c.id);
  const likedComments = new Set<string>();
  if (commentIds.length) {
    const { data: cl } = await service
      .from("community_likes")
      .select("subject_id")
      .eq("user_id", userId)
      .eq("subject_type", "comment")
      .in("subject_id", commentIds);
    for (const l of cl ?? []) likedComments.add(l.subject_id as string);
  }

  return {
    post: {
      id: p.id,
      authorId: p.author_id,
      authorName: p.profiles?.display_name ?? null,
      kind: p.kind,
      title: p.title,
      body: p.body,
      media: Array.isArray(p.media) ? p.media : [],
      likeCount: p.like_count,
      commentCount: p.comment_count,
      acceptedAnswerId: p.accepted_answer_id,
      tags: (p.community_post_tags ?? []).map((t) => t.community_tags?.slug).filter(Boolean) as string[],
      likedByMe: !!myPostLike,
      createdAt: p.created_at,
    },
    isAuthor: p.author_id === userId,
    comments: comments.map((c) => ({
      id: c.id,
      authorId: c.author_id,
      authorName: c.profiles?.display_name ?? null,
      parentId: c.parent_id,
      body: c.body,
      isAccepted: c.is_accepted,
      likeCount: c.like_count,
      likedByMe: likedComments.has(c.id),
      createdAt: c.created_at,
    })),
  };
}

/** Posts carrying a given tag slug, newest first. */
export async function getPostsByTag(slug: string): Promise<FeedPost[]> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  const { data: tag } = await service
    .from("community_tags")
    .select("id")
    .eq("slug", slug.toLowerCase())
    .maybeSingle<{ id: string }>();
  if (!tag) return [];

  const { data: joins } = await service
    .from("community_post_tags")
    .select("post_id")
    .eq("tag_id", tag.id);
  const ids = (joins ?? []).map((j) => j.post_id as string);
  if (ids.length === 0) return [];

  const { data, error } = await service
    .from("community_posts")
    .select(
      "id, author_id, kind, title, body, media, like_count, comment_count, accepted_answer_id, created_at, profiles:author_id(display_name), community_post_tags(community_tags(slug))",
    )
    .in("id", ids)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .returns<PostRow[]>();
  if (error) throw new Error(error.message);

  const likedSet = new Set<string>();
  const { data: likes } = await service
    .from("community_likes")
    .select("subject_id")
    .eq("user_id", userId)
    .eq("subject_type", "post")
    .in("subject_id", ids);
  for (const l of likes ?? []) likedSet.add(l.subject_id as string);

  return (data ?? []).map((r) => ({
    id: r.id,
    authorId: r.author_id,
    authorName: r.profiles?.display_name ?? null,
    kind: r.kind,
    title: r.title,
    body: r.body,
    media: Array.isArray(r.media) ? r.media : [],
    likeCount: r.like_count,
    commentCount: r.comment_count,
    acceptedAnswerId: r.accepted_answer_id,
    tags: (r.community_post_tags ?? []).map((t) => t.community_tags?.slug).filter(Boolean) as string[],
    likedByMe: likedSet.has(r.id),
    createdAt: r.created_at,
  }));
}

/** Unread-notification count for the header bell's initial render. */
export async function getUnreadCount(): Promise<number> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const { count } = await service
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

/** Mark all of the viewer's notifications read. */
export async function markNotificationsRead(): Promise<void> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  await service
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
