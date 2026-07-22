import { expect, test, type Page } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

/**
 * The track capstone (`TrackCapstone`) — this session's own new feature
 * (2026-07-22, migration 0033), and like the bug-hunt lab, had zero e2e
 * coverage until now. Targets ui-ux-design-qa/usability-evaluation, the real
 * last chapter of the Manual QA track (notes/track-capstones.ts).
 */

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const CHAPTER = `${BASE}/notes/ui-ux-design-qa/usability-evaluation`;
const LAST_TOPIC = `${CHAPTER}/dark-patterns-to-flag`;
const TOPICS = [
  "running-a-heuristic-evaluation",
  "usability-testing-basics",
  "microcopy-and-ux-writing-checks",
  "dark-patterns-to-flag",
];

async function completeNote(page: Page, url: string): Promise<void> {
  await page.goto(url);
  const done = page.getByRole("button", { name: /completed .* xp earned/i });
  const complete = page.getByRole("button", { name: /mark complete/i });
  await complete.scrollIntoViewIfNeeded();
  await expect(async () => {
    if ((await done.count()) === 0) {
      await complete.click();
    }
    await expect(done).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15_000 });
}

test.describe("track capstone", () => {
  test("locked until the chapter is read", async ({ page }) => {
    await signUpFreshLearner(page, "cap");
    await page.goto(LAST_TOPIC);

    const capstone = page.getByRole("heading", { name: /track capstone/i });
    await capstone.scrollIntoViewIfNeeded();
    await expect(capstone).toBeVisible();
    await expect(page.getByText(/finish the last 4 notes in this chapter/i)).toBeVisible();
    await expect(page.getByLabel(/scope \(what's in \/ out of test\)/i)).toHaveCount(0);
  });

  test("unlocks, grades the rubric, and shows the checklist", async ({ page }) => {
    test.slow();
    await signUpFreshLearner(page, "cap");

    for (const topic of TOPICS) {
      await completeNote(page, `${CHAPTER}/${topic}`);
    }

    await page.goto(LAST_TOPIC);
    const capstone = page.getByRole("heading", { name: /track capstone/i });
    await capstone.scrollIntoViewIfNeeded();
    await expect(capstone).toBeVisible();
    await expect(page.getByText(/finish the last .* notes? in this chapter/i)).toHaveCount(0);

    // A deliberately incomplete submission — 2 risks, no technique word in
    // the approach — proves the rubric actually grades rather than
    // rubber-stamping anything non-empty.
    await page
      .getByLabel(/scope \(what's in \/ out of test\)/i)
      .fill("In scope: the new coupon flow on checkout. Out of scope: payment gateway internals.");
    await page.getByLabel(/risks \(one per line, ranked\)/i).fill("Coupon stacking\nExpired coupon still applies");
    await page.getByLabel(/approach \(name the techniques per requirement\)/i).fill("Manual click-through of the happy path.");
    await page.getByLabel(/ship recommendation/i).selectOption("go-with-conditions");

    await page.getByRole("button", { name: /submit capstone/i }).click();

    const rubric = page.getByText(/rubric — \d+%/i);
    await expect(rubric).toBeVisible();
    // 2 of 4 criteria pass (scope, recommendation) — proves partial credit,
    // not just pass/fail.
    await expect(rubric).toHaveText(/rubric — 50%/i);
    await expect(page.getByText(/at least three risks identified/i)).toBeVisible();
    await expect(page.getByText(/approach names a test-design technique/i)).toBeVisible();
  });
});
