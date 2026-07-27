import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

/**
 * P2-4 — the header bell subscribes to Supabase Realtime `postgres_changes`
 * on `notifications`, scoped to the signed-in user (see notification-bell.tsx
 * + migration 20260702000027_communities.sql). This proves the live push: a
 * second learner's service-role-written notification (via toggleLike →
 * notify()) reaches the author's bell badge with no reload, well under the
 * ticket's 2s budget.
 */
test.describe("notification bell — realtime", () => {
  test("a like from another learner updates the author's bell without reload", async ({
    browser,
  }) => {
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
    const postUrl = author.url();

    // Author stays put on the thread page (bell lives in the shared app
    // layout, so any authenticated route works) with zero unread.
    await expect(author.getByTestId("notification-badge")).not.toBeVisible();

    await signUpFreshLearner(liker, "bell-liker");
    await liker.goto(postUrl);

    // Guard against the pre-hydration lost-click race documented in
    // docs/known-issues/webkit-save-stall.md: post-card.tsx has no hydration
    // gate, so a click before React attaches is silently dropped (no
    // toggleLike call, no notify(), badge never appears). Retry the click
    // until the optimistic ♥ state sticks, mirroring signup-helper's guard.
    const likeButton = liker.getByTestId("post-like").first();
    await expect(async () => {
      if (!(await likeButton.innerText()).includes("♥")) {
        await likeButton.click();
      }
      await expect(likeButton).toContainText("♥", { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });

    // No reload on the author's page — the badge must appear via the Realtime
    // push within the ticket's <2s budget.
    await expect(author.getByTestId("notification-badge")).toBeVisible({ timeout: 2_000 });
    await expect(author.getByTestId("notification-badge")).toHaveText("1");

    await authorCtx.close();
    await likerCtx.close();
  });
});
