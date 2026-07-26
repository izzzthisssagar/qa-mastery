# Community and Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the misleading notification bell and popularity-only community layer with a paginated notification center, category controls, bookmarks, followed/muted threads, edit history, helpful-answer reputation, duplicate suggestions, recommendations, groups, safe code embeds, and accessible owned-media references.

**Architecture:** Migration `0038` extends the existing community schema without weakening its RLS posture: recipients own notification state, authors own content and bookmarks, while notification creation, revision snapshots, and reputation totals remain service-role writes. Community actions are split into focused `server-only` data modules and thin Server Actions. Community media carries required alt/decorative metadata and is validated through a compatibility interface that migration `0045` can replace with centralized quarantine and scanning.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/PostgreSQL RLS and Realtime, Zod 4, Vitest, Testing Library, Playwright.

## Global Constraints

- Base this lane on the verified Wave 2 checkpoint and migration `20260726000037_code_workspaces.sql`; code embeds reference `public.code_workspaces`.
- The integration governor owns the lockfile, package manifests, authenticated shell, shared settings navigation, environment schema, and migration sequencing.
- This plan owns `supabase/migrations/20260726000038_community_quality_notifications.sql`, `packages/db/test/community-quality-rls.test.ts`, `apps/platform/src/lib/community/**`, `apps/platform/src/app/(app)/community/**`, `apps/platform/src/app/(app)/notifications/**`, `apps/platform/src/components/nav/notification-bell.tsx`, and community E2E files.
- Acquire exclusive locks before editing `community/actions.ts`, `community/new/composer.tsx`, `community/post-card.tsx`, `community/[postId]/thread-client.tsx`, `notification-bell.tsx`, or `lib/community/media.ts`.
- Migration number `20260726000038` is reserved for this subsystem. Do not add or rename a migration.
- Follow the installed Next.js 16 mutation, Route Handler, data-security, authentication, dynamic-route, and revalidation guides. Authenticate and authorize inside every action and Route Handler.
- Notification category preferences live in `community_notification_preferences`; global delivery, study-reminder, and quiet-hour preferences live in migration `0039`'s `learner_preferences.notifications`. Do not duplicate global delivery state in migration `0038`.
- Notification writes are service-role-only. Learners may read their own notifications and set only their own `read_at`; they may not forge actor, type, message, href, or payload.
- Notification page size is 25 with keyset cursor `(created_at,id)`. Opening the bell never marks anything read. Mark-one and mark-all are explicit actions.
- Allowed notification categories are exactly `reply`, `like`, `follow`, `accepted`, `mention`, and `announcement`. Self-notifications are suppressed.
- Community reputation formula is `accepted_answer_count * 25 + helpful_vote_count * 5`; posting volume and raw likes contribute zero.
- A learner may bookmark a post once, follow a thread once, cast one helpful vote per comment, and join a group once. Database unique constraints enforce each invariant.
- Helpful votes cannot target the voter's own comment. Accepted/helpful counts are recomputed by one database function after each qualifying action.
- Post edits preserve the previous title, body, media, and tag slugs in immutable service-written revisions. Deletion remains author/admin controlled.
- Duplicate suggestions use existing PostgreSQL full-text search and return at most five visible questions; they never block posting.
- Recommendations are deterministic and explainable: tags are ranked by the learner's follows/bookmarks and global 30-day activity; members by accepted/helpful reputation in those tags; groups by tag overlap and member count.
- Community image references accept PNG, JPEG, or WebP only, maximum 5 MiB, and require either descriptive alt text of 3–300 characters or `decorative=true`. GIF is removed from new uploads.
- This plan consumes `CommunityMediaReference = { assetId:string|null; path:string; alt:string|null; decorative:boolean; mimeType:string; sizeBytes:number }`. Until migration `0045` lands, `assetId` is null and the existing owner-folder storage policy remains the ownership boundary.
- Centralized quarantine, malware scanning, scan evidence, migration `0045`, and `/api/media/**` belong exclusively to the privacy/media plan. This plan must not create scanner tables, scanner environment variables, a quarantine bucket, or an upload Route Handler.
- Groups in this increment are public topic/study/tool groups with owner/member roles. Regional location data and scheduled events are excluded.
- Direct messages, public leaderboards, opaque ML ranking, email/push delivery, and engagement-based content suppression are excluded.
- Do not push, merge, deploy, or edit another lane's migration.

---

## File Structure

```text
supabase/migrations/20260726000038_community_quality_notifications.sql
packages/db/test/community-quality-rls.test.ts
apps/platform/src/lib/community/
  schema.ts                    # Zod inputs and enums
  notifications.ts             # server-only notification reads/writes/DTOs
  quality.ts                   # server-only bookmarks, reputation, recommendations
  mentions.ts                  # pure @username parser
  media.ts                     # accessible media-reference compatibility contract
apps/platform/src/app/(app)/notifications/
  page.tsx
  notification-center.tsx
  preferences-form.tsx
apps/platform/src/app/(app)/community/
  actions.ts
  groups/page.tsx
  groups/[slug]/page.tsx
  groups/[slug]/group-client.tsx
  saved/page.tsx
  [postId]/history/page.tsx
  code-embed.tsx
apps/platform/src/components/nav/notification-bell.tsx
e2e/tests/community-quality.spec.ts
e2e/tests/notifications.spec.ts
```

### Task 1: Extend the Community Schema and Prove Security Invariants

**Files:**
- Create: `supabase/migrations/20260726000038_community_quality_notifications.sql`
- Create: `packages/db/test/community-quality-rls.test.ts`

**Interfaces:**
- Consumes: migration `0027` community tables and migration `0037` code workspaces.
- Produces: category preferences, bookmarks, thread follows/mutes, helpful votes, reputation, revisions, groups/memberships, code embeds, and richer notification fields.

- [ ] **Step 1: Write the failing RLS tests**

Use the existing two-user community harness and add:

```ts
it("keeps notification content service-written while recipient controls read state", async () => {
  const forged = await asBob.from("notifications").insert({
    user_id: bobId, actor_id: aliceId, type: "accepted", message: "forged", href: "/community/x",
  });
  expect(forged.error).not.toBeNull();
  const made = await service.from("notifications").insert({
    user_id: bobId, actor_id: aliceId, type: "reply", message: "Alice replied", href: `/community/${alicePostId}`,
  }).select("id").single();
  notificationId = made.data!.id as string;
  expect((await asAlice.from("notifications").select("id").eq("id", notificationId)).data ?? []).toHaveLength(0);
  expect((await asBob.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId).select("id")).data).toHaveLength(1);
});

it("prevents bookmarking, following, or helpful-voting as another user", async () => {
  expect((await asBob.from("community_bookmarks").insert({ user_id: aliceId, post_id: alicePostId })).error).not.toBeNull();
  expect((await asBob.from("community_thread_follows").insert({ user_id: aliceId, post_id: alicePostId })).error).not.toBeNull();
  expect((await asBob.from("community_helpful_votes").insert({ user_id: aliceId, comment_id: aliceCommentId })).error).not.toBeNull();
});

it("does not let clients mint reputation", async () => {
  expect((await asAlice.from("community_reputation").insert({ user_id: aliceId, accepted_answer_count: 99, helpful_vote_count: 99, score: 9999 })).error).not.toBeNull();
});
```

- [ ] **Step 2: Run the focused RLS test and verify missing-table failure**

Run: `pnpm --filter @qa-mastery/db test:rls -- community-quality-rls.test.ts`

Expected: FAIL on the first missing `community_bookmarks` relation.

- [ ] **Step 3: Add notification, preference, bookmark, follow, quality, and revision tables**

```sql
-- supabase/migrations/20260726000038_community_quality_notifications.sql
alter table public.notifications
  add column message text check (message is null or char_length(message) between 1 and 240),
  add column href text check (href is null or (href like '/%' and href not like '//%')),
  add column payload jsonb not null default '{}'::jsonb,
  add column dedupe_key text,
  add column updated_at timestamptz not null default now();
create unique index notifications_recipient_dedupe on public.notifications(user_id, dedupe_key)
  where dedupe_key is not null;

create table public.community_notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  reply boolean not null default true,
  like_notice boolean not null default true,
  follow_notice boolean not null default true,
  accepted boolean not null default true,
  mention boolean not null default true,
  announcement boolean not null default true,
  updated_at timestamptz not null default now()
);
create table public.community_bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id, post_id)
);
create table public.community_thread_follows (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  muted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key(user_id, post_id)
);
create table public.community_helpful_votes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment_id uuid not null references public.community_comments(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id, comment_id)
);
alter table public.community_comments add column helpful_count integer not null default 0 check (helpful_count >= 0);
create table public.community_reputation (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  accepted_answer_count integer not null default 0 check (accepted_answer_count >= 0),
  helpful_vote_count integer not null default 0 check (helpful_vote_count >= 0),
  score integer not null default 0 check (score >= 0),
  updated_at timestamptz not null default now()
);
create table public.community_post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text, body text not null, media jsonb not null default '[]', tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.community_reports
  add column resolved_at timestamptz,
  add column resolved_by uuid references public.profiles(id) on delete set null,
  add column resolution_note text check (resolution_note is null or char_length(resolution_note) <= 1000);
```

- [ ] **Step 4: Add groups and code embeds**

```sql
create table public.community_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  name text not null check (char_length(name) between 3 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  kind text not null check (kind in ('topic','study','tool')),
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  member_count integer not null default 1 check (member_count >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.community_group_members (
  group_id uuid not null references public.community_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(), primary key(group_id, user_id)
);
alter table public.community_posts add column group_id uuid references public.community_groups(id) on delete set null;
create table public.community_post_code_embeds (
  post_id uuid primary key references public.community_posts(id) on delete cascade,
  workspace_id uuid not null references public.code_workspaces(id) on delete cascade,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 5: Add indexes, RLS, triggers, and reputation RPC**

Enable RLS on every new table. Use owner-all policies for preferences, bookmarks, and thread follows. Helpful votes allow authenticated insert/delete only when `user_id=auth.uid()` and the comment author differs from `auth.uid()`. Groups are authenticated-readable; owners update/delete groups; users manage their own membership row; owner membership cannot be deleted. Revisions are visible to the post author and admins with no client insert/update policy. Reputation is publicly readable with no client write policy. Code embeds are readable when their post is visible and writable only by the post author.

Create `public.recompute_community_reputation(target uuid)` as `security definer`, pinned `search_path=public`, computing accepted and helpful counts from source tables and upserting `score = accepted*25 + helpful*5`. Revoke from public/authenticated and grant only to service role. Add count triggers for helpful votes and group membership. Preserve the existing `community-media` owner-folder storage policy until migration `0045` replaces it.

- [ ] **Step 6: Reset and run database gates**

Run: `pnpm db:reset`

Expected: migration `0038` applies after `0037`.

Run: `pnpm --filter @qa-mastery/db test:rls -- community-rls.test.ts community-quality-rls.test.ts rls-coverage.test.ts`

Expected: PASS; legacy community rules remain green and all new tables are covered.

- [ ] **Step 7: Commit the database boundary**

```bash
git add supabase/migrations/20260726000038_community_quality_notifications.sql packages/db/test/community-quality-rls.test.ts
git commit -m "feat(community): add quality and notification schema"
```

### Task 2: Define Community Types, Mentions, and Notification DTOs

**Files:**
- Create: `apps/platform/src/lib/community/schema.ts`
- Create: `apps/platform/src/lib/community/mentions.ts`
- Create: `apps/platform/src/lib/community/mentions.test.ts`
- Create: `apps/platform/src/lib/community/notifications.ts`
- Create: `apps/platform/src/lib/community/notifications.test.ts`

**Interfaces:**
- Produces: `NotificationCategory`, `NotificationDTO`, `NotificationCursor`, `parseMentions()`, `notificationHref()`, `CommunityPreferenceSchema`, `PostEditSchema`, `GroupSchema`.

- [ ] **Step 1: Write failing mention and href tests**

```ts
import { describe, expect, it } from "vitest";
import { parseMentions } from "./mentions";
import { notificationHref } from "./notifications";
it("deduplicates valid mentions and ignores email fragments", () => {
  expect(parseMentions("Thanks @alice and @alice; mail a@b.com; hi @qa-tester"))
    .toEqual(["alice", "qa-tester"]);
});
it("maps supported subjects to same-origin deep links", () => {
  expect(notificationHref({ type: "reply", subjectType: "post", subjectId: "p1", payload: {} })).toBe("/community/p1");
  expect(notificationHref({ type: "follow", subjectType: "profile", subjectId: "u1", payload: { handle: "alice" } })).toBe("/talent/u/alice");
  expect(notificationHref({ type: "accepted", subjectType: "comment", subjectId: "c1", payload: { postId: "p1" } })).toBe("/community/p1#comment-c1");
});
```

- [ ] **Step 2: Run and confirm missing modules**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/community/mentions.test.ts src/lib/community/notifications.test.ts`

Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Implement strict parsing and DTOs**

Use mention regex `/(^|[^\w@])@([a-z0-9][a-z0-9-]{2,31})\b/gi`, return lowercase unique handles, maximum 10. `notificationHref` accepts only the six categories and returns `/notifications` when required payload is absent. Validate stored href again with `/^\/(?!\/)[\w\-/?#=&%.]*$/` before returning it to a Link.

`NotificationDTO` is exactly `{ id, type, message, href, actorName, actorAvatarUrl, read, createdAt }`. It omits `user_id`, `actor_id`, `payload`, and `dedupe_key`.

- [ ] **Step 4: Implement server-only notification reads/writes**

`notifications.ts` imports `server-only` and exports:

```ts
export async function listNotifications(cursor?: NotificationCursor): Promise<{ items: NotificationDTO[]; nextCursor: NotificationCursor | null }>;
export async function countUnreadNotifications(): Promise<number>;
export async function createNotification(args: { recipientId: string; actorId: string | null; type: NotificationCategory; message: string; href: string; subjectType: string; subjectId: string; payload?: Record<string, string>; dedupeKey?: string }): Promise<void>;
```

The write checks recipient category preferences, suppresses self-notices, validates length/href, and uses service-role upsert on `(user_id,dedupe_key)` only when a key exists. List reads use the request-scoped RLS client, join actor display fields, apply keyset ordering, and map narrow DTOs.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/community/mentions.test.ts src/lib/community/notifications.test.ts`

Expected: PASS.

```bash
git add apps/platform/src/lib/community/schema.ts apps/platform/src/lib/community/mentions.ts apps/platform/src/lib/community/mentions.test.ts apps/platform/src/lib/community/notifications.ts apps/platform/src/lib/community/notifications.test.ts
git commit -m "feat(community): define notification and mention contracts"
```

### Task 3: Replace the Bell with a Real Notification Center

**Files:**
- Create: `apps/platform/src/app/(app)/notifications/page.tsx`
- Create: `apps/platform/src/app/(app)/notifications/notification-center.tsx`
- Create: `apps/platform/src/app/(app)/notifications/preferences-form.tsx`
- Create: `apps/platform/src/app/(app)/notifications/actions.ts`
- Modify: `apps/platform/src/components/nav/notification-bell.tsx`
- Modify: `apps/platform/src/app/(app)/layout.tsx:1-49`
- Create: `e2e/tests/notifications.spec.ts`

**Interfaces:**
- Consumes: Task 2 list/count functions and migration `0038` preferences.
- Produces: `/notifications`, explicit mark-one/all semantics, category settings, paginated history, and a bell that never clears unread state on open.

- [ ] **Step 1: Write the failing notification E2E journey**

Use two authenticated browser contexts. User A creates a post; user B comments; user A opens the bell and the unread badge remains; user A follows “View all notifications”, sees “B replied to your post”, opens the deep link, returns, marks that item read, and sees the badge decrement. Assert a separate “Mark all read” control.

- [ ] **Step 2: Run and verify the current false-empty panel**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/notifications.spec.ts --project=chromium`

Expected: FAIL because the current bell immediately clears unread and renders only “all caught up”.

- [ ] **Step 3: Add narrow notification actions**

```ts
"use server";
export async function markNotificationReadAction(id: string): Promise<{ ok: true } | { ok: false; error: string }>;
export async function markAllNotificationsReadAction(): Promise<{ ok: true } | { ok: false; error: string }>;
export async function updateCommunityNotificationPreferencesAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }>;
```

Each authenticates, validates UUID/booleans, uses the request-scoped client, filters `user_id` defensively, and calls `revalidatePath("/notifications")`; mark-one returns failure when no owner row changed.

- [ ] **Step 4: Build the page and accessible bell preview**

The Server Component loads first page, unread count, and preferences in parallel. `NotificationCenter` renders links, timestamps, unread labels, Load more cursor, mark-one, and mark-all. The bell panel renders the five newest DTOs, a “View all notifications” link, Escape/focus-return behavior from the Wave 2 popover, and Realtime INSERT updates. Opening only sets local `open=true`; it never invokes a read mutation.

- [ ] **Step 5: Run E2E and static checks**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/notifications.spec.ts --project=chromium`

Expected: PASS.

Run: `pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck`

Expected: both exit 0.

- [ ] **Step 6: Commit the notification center**

```bash
git add 'apps/platform/src/app/(app)/notifications' apps/platform/src/components/nav/notification-bell.tsx 'apps/platform/src/app/(app)/layout.tsx' e2e/tests/notifications.spec.ts
git commit -m "feat(notifications): add real event center"
```

### Task 4: Add Bookmarks, Thread Controls, Edits, Helpful Votes, and Duplicate Suggestions

**Files:**
- Create: `apps/platform/src/lib/community/quality.ts`
- Create: `apps/platform/src/lib/community/quality.test.ts`
- Modify: `apps/platform/src/app/(app)/community/actions.ts`
- Modify: `apps/platform/src/app/(app)/community/post-card.tsx`
- Modify: `apps/platform/src/app/(app)/community/[postId]/thread-client.tsx`
- Create: `apps/platform/src/app/(app)/community/[postId]/history/page.tsx`
- Create: `apps/platform/src/app/(app)/community/saved/page.tsx`
- Modify: `apps/platform/src/app/(app)/community/new/composer.tsx`
- Create: `e2e/tests/community-quality.spec.ts`

**Interfaces:**
- Produces: `toggleBookmark`, `toggleThreadFollow`, `setThreadMuted`, `editPost`, `toggleHelpfulVote`, `suggestDuplicateQuestions`, `getSavedPosts`, `getPostRevisions`.
- Consumes: Task 2 notification writer and migration `0038` tables/RPC.

- [ ] **Step 1: Write failing pure quality tests**

```ts
it("ranks reputation from accepted and helpful evidence only", () => {
  expect(calculateCommunityReputation({ accepted: 2, helpful: 3, posts: 1000, likes: 9999 })).toBe(65);
});
it("normalizes duplicate-query input without accepting an empty query", () => {
  expect(buildDuplicateQuery("How do I test an API?", "status code assertions")).toBe("How do I test an API status code assertions");
  expect(buildDuplicateQuery(" ", " ")).toBeNull();
});
```

- [ ] **Step 2: Run and confirm missing functions**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/community/quality.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement server-only quality reads and formulas**

`quality.ts` imports `server-only` except for a separate exported pure `calculateCommunityReputation` file if the test runner rejects server-only. Saved-post and revision DTOs project existing `FeedPost` fields and revision date only; report resolution notes are visible only to the original reporter/admin through existing RLS.

- [ ] **Step 4: Add authenticated actions and correct notification routing**

Refactor the existing monolithic `notify()` calls to Task 2 `createNotification()`. Replies notify the post author, parent-comment author, explicit mentions, and non-muted thread followers with dedupe keys `<type>:<actor>:<subject>`. `toggleHelpfulVote` rejects self-votes, updates the row through RLS, calls service-role `recompute_community_reputation(commentAuthorId)`, and sends a `reply`-category helpful notice only on insertion.

`editPost` validates title/body/media/tags, verifies author through service query, inserts the previous projection into `community_post_revisions`, updates the post and tag joins, and revalidates both feed and thread. Revision rows never expose deleted private media URLs to non-authors.

- [ ] **Step 5: Add duplicate suggestions before publishing**

After title/body reach 10 combined characters, debounce 400 ms and call `suggestDuplicateQuestions`; render at most five existing question links under “Similar questions”. Posting stays enabled and suggestions have a dismiss control.

- [ ] **Step 6: Add E2E coverage and commit**

Test save/unsave, follow/mute, edit/history, helpful vote/reputation, and duplicate suggestion. Run:

`pnpm --filter @qa-mastery/e2e exec playwright test tests/community-quality.spec.ts tests/community.spec.ts --project=chromium`

Expected: PASS.

```bash
git add apps/platform/src/lib/community/quality.ts apps/platform/src/lib/community/quality.test.ts 'apps/platform/src/app/(app)/community' e2e/tests/community-quality.spec.ts
git commit -m "feat(community): add durable quality controls"
```

### Task 5: Add Explainable Recommendations and Public Groups

**Files:**
- Create: `apps/platform/src/app/(app)/community/groups/page.tsx`
- Create: `apps/platform/src/app/(app)/community/groups/[slug]/page.tsx`
- Create: `apps/platform/src/app/(app)/community/groups/[slug]/group-client.tsx`
- Modify: `apps/platform/src/lib/community/quality.ts`
- Modify: `apps/platform/src/app/(app)/community/page.tsx`
- Modify: `apps/platform/src/app/(app)/community/new/page.tsx`
- Modify: `apps/platform/src/app/(app)/community/new/composer.tsx`
- Test: `e2e/tests/community-quality.spec.ts`

**Interfaces:**
- Produces: `createGroup`, `joinGroup`, `leaveGroup`, `getRecommendedCommunity`, grouped feed creation/filtering.

- [ ] **Step 1: Add a failing group journey**

Create a topic group “API Testers”, join from a second user, create a post scoped to it, verify the member count becomes 2 and the group feed contains the post, then leave and verify it returns to 1.

- [ ] **Step 2: Run and confirm the missing route**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/community-quality.spec.ts --grep "group" --project=chromium`

Expected: FAIL with `/community/groups` not found.

- [ ] **Step 3: Implement group actions with owner/member authorization**

Validate slug/name/kind/tags with `GroupSchema`; insert group and owner membership in one service-side operation after authenticating. Join/leave use request RLS, reject deleting the owner membership, and rely on the member-count trigger. Composer allows a `groupId` only when the user is a member; the action re-checks membership.

- [ ] **Step 4: Implement deterministic recommendations**

Return `{ tags, members, groups }`, each item carrying a `reason` string such as “Because you saved posts tagged api”. Use 30-day posts, the learner's saved/followed posts, tag overlap, and `community_reputation.score`; stable-sort ties by slug/handle. Return at most five per category and no percentile or unexplained score.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/community-quality.spec.ts --project=chromium`

Expected: PASS.

```bash
git add 'apps/platform/src/app/(app)/community/groups' 'apps/platform/src/app/(app)/community/page.tsx' 'apps/platform/src/app/(app)/community/new' apps/platform/src/lib/community/quality.ts e2e/tests/community-quality.spec.ts
git commit -m "feat(community): add groups and recommendations"
```

### Task 6: Add Accessible Media References and Code Embeds

**Files:**
- Modify: `apps/platform/src/lib/community/media.ts`
- Create: `apps/platform/src/lib/community/media.test.ts`
- Modify: `apps/platform/src/app/(app)/community/actions.ts`
- Modify: `apps/platform/src/app/(app)/community/new/composer.tsx`
- Modify: `apps/platform/src/app/(app)/community/post-card.tsx`
- Modify: `apps/platform/src/app/(app)/community/[postId]/page.tsx`
- Create: `apps/platform/src/app/(app)/community/code-embed.tsx`

**Interfaces:**
- Produces: `CommunityMediaReference`, accessible `MediaItem`, ownership validation, and shared-workspace embeds.
- Consumes: migration `0037` share state and the current `community-media/<userId>/...` owner-folder convention; migration `0045` can supply non-null `assetId` values without changing post components.

- [ ] **Step 1: Write failing media-reference tests**

```ts
it("requires description unless the image is explicitly decorative", () => {
  expect(parseCommunityMediaReference({ path: `${userId}/a.webp`, alt: "API response screenshot", decorative: false, mimeType: "image/webp", sizeBytes: 1024 }, userId).success).toBe(true);
  expect(parseCommunityMediaReference({ path: `${userId}/a.webp`, alt: "", decorative: false, mimeType: "image/webp", sizeBytes: 1024 }, userId).success).toBe(false);
  expect(parseCommunityMediaReference({ path: `${userId}/a.webp`, alt: null, decorative: true, mimeType: "image/webp", sizeBytes: 1024 }, userId).success).toBe(true);
});
it("rejects another user's object path", () => {
  expect(parseCommunityMediaReference({ path: `other-user/a.webp`, alt: "Evidence", decorative: false, mimeType: "image/webp", sizeBytes: 1024 }, userId).success).toBe(false);
});
```

- [ ] **Step 2: Run and verify the missing-contract failure**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/community/media.test.ts`

Expected: FAIL because `parseCommunityMediaReference` does not exist.

- [ ] **Step 3: Implement the compatibility contract and owner validation**

Define `CommunityMediaReference` exactly as `{ assetId:string|null; path:string; alt:string|null; decorative:boolean; mimeType:"image/png"|"image/jpeg"|"image/webp"; sizeBytes:number }`. `parseCommunityMediaReference(raw,userId)` validates the current path starts with `${userId}/`, size is 1–5 MiB, MIME is allowed, and description/decorative invariant holds. `createPost` authenticates and parses each image reference against its user ID before inserting media JSON. When migration `0045` supplies an `assetId`, the same function delegates ownership/status verification to the centralized `/api/media/**` contract instead of accepting only a path.

- [ ] **Step 4: Update the existing browser upload without claiming scan coverage**

Keep the current browser upload to the owner's storage folder, restrict new selections to PNG/JPEG/WebP under 5 MiB, collect alt text or Decorative before upload, and return `{ assetId:null, path, alt, decorative, mimeType, sizeBytes }`. Add an inline notice in development documentation that centralized quarantine/scanning is delivered by migration `0045`; this task does not claim malware protection.

- [ ] **Step 5: Render honest alt text through the compatibility DTO**

`MediaItem` image shape becomes `{ type:"image"; assetId:string|null; path:string; alt:string|null; decorative:boolean; mimeType:string; sizeBytes:number }`. Render `alt=""` only when `decorative=true`; otherwise render the required description. Include intrinsic width/height metadata collected after browser decode, or a fixed `aspect-video` wrapper to prevent layout shift.

- [ ] **Step 6: Validate and render code embeds**

Composer accepts one shared workspace URL, extracts UUID token, resolves it server-side, verifies it is enabled and owned by the composer, then inserts `community_post_code_embeds`. `CodeEmbed` renders the safe public DTO with language/title/source and a link; expected outputs, custom tests, and private stdin remain hidden.

- [ ] **Step 7: Run tests and commit**

Run:

```bash
pnpm --filter @qa-mastery/platform test -- src/lib/community/media.test.ts
pnpm --filter @qa-mastery/platform lint
pnpm --filter @qa-mastery/platform typecheck
```

Expected: all exit 0; owner-path and description checks pass.

```bash
git add apps/platform/src/lib/community 'apps/platform/src/app/(app)/community'
git commit -m "feat(community): add accessible media and code embeds"
```

### Task 7: Verify the Integrated Community System

**Files:**
- Modify: `e2e/tests/community-quality.spec.ts`
- Modify: `e2e/tests/notifications.spec.ts`
- Governor modify: authenticated Community and Notifications navigation entries

**Interfaces:**
- Produces: required browser, database, accessibility, and build evidence for integration.

- [ ] **Step 1: Add keyboard and accessibility assertions**

Test the bell and notification list by keyboard, confirm unread items expose text rather than color alone, confirm media without description is rejected, confirm decorative images use empty alt, and run axe on `/notifications`, `/community/saved`, and `/community/groups` in both themes.

- [ ] **Step 2: Run the complete gate**

```bash
pnpm db:reset
pnpm --filter @qa-mastery/db test:rls
pnpm --filter @qa-mastery/platform test
pnpm --filter @qa-mastery/platform lint
pnpm --filter @qa-mastery/platform typecheck
pnpm --filter @qa-mastery/platform build
pnpm --filter @qa-mastery/e2e exec playwright test tests/community.spec.ts tests/community-quality.spec.ts tests/notifications.spec.ts tests/a11y.spec.ts --project=chromium
git diff --check
```

Expected: all commands exit 0; no learner can forge notifications or reputation; opening the bell leaves unread state unchanged; explicit reads update only the recipient; media ownership/description validation rejects forged references; reputation ignores post/like volume; deep links resolve.

- [ ] **Step 3: Commit governor navigation after lock transfer**

Add Community, Saved, Groups, and Notifications destinations to the Wave 2 shell with active route state. Commit only after the shell owner releases its lock:

```bash
git add apps/platform/src/components/nav 'apps/platform/src/app/(app)/layout.tsx' e2e/tests/community-quality.spec.ts e2e/tests/notifications.spec.ts
git commit -m "feat(community): integrate discovery and notifications"
```

- [ ] **Step 4: Record the handoff**

Record migration `0038`, code-workspace dependency revision, commits, RLS output, unit/lint/type/build/E2E output, compatibility-interface evidence, explicit migration `0045` scanner dependency, changed paths, and exclusions in the lane ledger. Leave status `review` until governor integration.
