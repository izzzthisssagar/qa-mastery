import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

/**
 * P2-4 — the header bell subscribes to Supabase Realtime `postgres_changes`
 * on `notifications`, scoped to the signed-in user (see notification-bell.tsx
 * + migration 20260702000027_communities.sql). We assert via reload rather
 * than depending on the realtime websocket push (which the local CI
 * Supabase stack doesn't deliver reliably — see talent-realtime.spec.ts's
 * identical caveat): this still proves cross-context delivery, the
 * service-role write path (toggleLike → notify()), and per-user RLS
 * scoping. Live push is a UX nicety verified manually/in prod.
 */
test.describe("notification bell — realtime", () => {
  test("a like from another learner updates the author's bell", async ({ browser }) => {
    const authorCtx = await browser.newContext();
    const likerCtx = await browser.newContext();
    const author = await authorCtx.newPage();
    const liker = await likerCtx.newPage();

    await signUpFreshLearner(author, "bell-author");

    const body = `e2e realtime post ${randomUUID().slice(0, 8)}`;
    await author.goto("http://localhost:3000/community/new");
    await author.getByTestId("composer-body").fill(body);
    await author.getByTestId("composer-submit").click();
    await expect(author.getByText(body)).toBeVisible({ timeout: 10_000 });

    // Author stays put on the thread page (bell lives in the shared app
    // layout, so any authenticated route works) with zero unread.
    await expect(author.getByTestId("notification-badge")).not.toBeVisible();

    // The like button only exists on the feed's PostCard
    // (community/post-card.tsx) — the single-post detail page
    // (community/[postId]/page.tsx) has no like affordance at all. Go to
    // the feed and scope to this post by its unique body text.
    await signUpFreshLearner(liker, "bell-liker");
    await liker.goto("http://localhost:3000/community");
    const likeButton = liker
      .getByTestId("community-post")
      .filter({ hasText: body })
      .getByTestId("post-like");

    // Guard against the pre-hydration lost-click race documented in
    // docs/known-issues/webkit-save-stall.md: post-card.tsx has no hydration
    // gate, so a click before React attaches is silently dropped (no
    // toggleLike call, no notify(), badge never appears). Retry the click
    // until the optimistic ♥ state sticks, mirroring signup-helper's guard.
    await expect(async () => {
      if (!(await likeButton.innerText()).includes("♥")) {
        await likeButton.click();
      }
      await expect(likeButton).toContainText("♥", { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });

    // Give the live push a short window (best effort — see the file-level
    // comment on why this isn't a hard requirement), then fall back to
    // reload, mirroring talent-realtime.spec.ts's proven-reliable pattern.
    try {
      await expect(author.getByTestId("notification-badge")).toBeVisible({ timeout: 2_000 });
    } catch {
      await author.reload();
    }
    await expect(author.getByTestId("notification-badge")).toBeVisible({ timeout: 15_000 });
    await expect(author.getByTestId("notification-badge")).toHaveText("1");

    await authorCtx.close();
    await likerCtx.close();
  });
});
