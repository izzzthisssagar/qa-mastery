import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { signUpFreshLearner as sharedSignUp } from "./signup-helper";

/**
 * Community feed smoke: a signed-in learner creates a post, sees it in the feed,
 * opens the thread, comments and likes. Requires the local Supabase stack with
 * the communities migration applied. Uploads aren't exercised (no network to
 * Storage/Cloudinary in CI) — the post is text-only.
 */

async function signUpFreshLearner(page: Page): Promise<void> {
  await sharedSignUp(page, "community");
}

test.describe("community feed", () => {
  test("anonymous visitor is redirected to login", async ({ page }) => {
    await page.goto("http://localhost:3000/community");
    await expect(page).toHaveURL(/\/login/);
  });

  test("create a post → see it → comment → like", async ({ page }) => {
    await signUpFreshLearner(page);

    const body = `e2e post ${randomUUID().slice(0, 8)}`;
    await page.goto("http://localhost:3000/community/new");
    await page.getByTestId("composer-body").fill(body);
    await page.getByTestId("composer-submit").click();

    // Lands on the new post's thread page.
    await expect(page.getByText(body)).toBeVisible({ timeout: 10_000 });

    // Comment on it.
    const comment = `nice one ${randomUUID().slice(0, 6)}`;
    await page.getByTestId("comment-body").fill(comment);
    await page.getByTestId("comment-submit").click();
    await expect(page.getByText(comment)).toBeVisible({ timeout: 10_000 });

    // Back in the feed, the post appears and can be liked.
    await page.goto("http://localhost:3000/community");
    await expect(page.getByText(body).first()).toBeVisible();
    const likeButton = page.getByTestId("post-like").first();
    const before = (await likeButton.textContent())?.trim() ?? "";
    await likeButton.click();
    await expect(likeButton).not.toHaveText(before, { timeout: 5000 });
  });
});
