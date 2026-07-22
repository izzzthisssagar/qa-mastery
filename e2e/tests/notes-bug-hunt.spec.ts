import { expect, test, type Page } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

/**
 * The bug_report chapter lab (`BugHuntPanel`) — the notes-spine counterpart
 * to `chapter-lab.spec.ts`'s code_run coverage. This flow had zero e2e
 * coverage after `learn.spec.ts` was deleted along with the retired lesson
 * UI it drove (2026-07-22) — this restores it against the actual current
 * component.
 *
 * Targets defect-management/writing-bug-reports — the chapter labs.ts has
 * carried since Phase A, `target: "buggyshop"`, `minValidBugs: 1`. The
 * report fields below match seeded bug BS-008 (product-list price filter
 * excludes the item priced exactly at the max — `packages/shared/src/
 * bug-flag.ts`), active at DEFAULT_RELEASE "1.0". Grading matches against
 * the manifest regardless of whether the sandbox was ever visited, so this
 * only drives the launch button far enough to prove it opens something,
 * then submits the report directly — the same boundary the deleted lesson
 * version tested.
 */

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const CHAPTER = `${BASE}/notes/defect-management/writing-bug-reports`;
const LAST_TOPIC = `${CHAPTER}/clarity`;
const TOPICS = ["anatomy-of-a-report", "repro-steps", "evidence", "clarity"];

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

test.describe("notes bug-hunt lab", () => {
  test("locked until the chapter is read", async ({ page }) => {
    await signUpFreshLearner(page, "hunt");
    await page.goto(LAST_TOPIC);

    const lab = page.getByRole("heading", { name: /chapter lab/i });
    await lab.scrollIntoViewIfNeeded();
    await expect(lab).toBeVisible();
    await expect(page.getByText(/finish the last 4 notes in this chapter/i)).toBeVisible();
    await expect(page.getByTestId("note-bug-hunt")).toHaveCount(0);
  });

  test("launch, file a matching report, and pass", async ({ page }) => {
    test.slow();
    await signUpFreshLearner(page, "hunt");

    for (const topic of TOPICS) {
      await completeNote(page, `${CHAPTER}/${topic}`);
    }

    await page.goto(LAST_TOPIC);
    // .first(): the known transient double-render race right after a fresh
    // goto (docs/known-issues/hydration-double-render.md) — React briefly
    // double-mounts the just-hydrated subtree before reconciling back to
    // one copy a moment later. Both copies are content-identical, so
    // .first() is always a valid, correct element either way.
    const panel = page.getByTestId("note-bug-hunt").first();
    await panel.scrollIntoViewIfNeeded();
    await expect(panel).toBeVisible();
    await expect(page.getByTestId("note-hunt-count")).toHaveText(/0 of 1 found/);

    // Launching opens the sandbox in a new tab — prove it actually opens
    // something rather than erroring, without driving the popup itself
    // (grading doesn't depend on having visited it).
    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      page.getByTestId("launch-note-sandbox-btn").click(),
    ]);
    await expect(popup).toHaveURL(/localhost:3001\/enter/);
    await expect(page.getByTestId("note-launch-error")).toHaveCount(0);

    // File the report matching seeded bug BS-008.
    await page.getByTestId("bug-page").selectOption("product-list");
    await page.getByTestId("bug-feature").selectOption("price-filter");
    await page.getByTestId("bug-category").selectOption("boundary");
    await page.getByTestId("bug-severity").selectOption("major");
    await page.getByTestId("bug-title").fill("Max-price item excluded from filter");
    await page
      .getByTestId("bug-steps")
      .fill("Open Products\nSet max price to 100\n$100 item disappears");
    await page.getByTestId("bug-expected").fill("Item priced at exactly 100 still shows");
    await page.getByTestId("bug-actual").fill("Item priced at 100 is excluded");

    const submit = page.getByTestId("bug-submit");
    await expect(submit).toBeEnabled();
    await submit.click();

    const result = page.getByTestId("bug-result");
    await expect(result).toBeVisible();
    await expect(result).toContainText(/BS-008/);

    // The panel's own progress reflects the match without a reload.
    await expect(page.getByTestId("note-hunt-count")).toHaveText(/1 of 1 found/);
    await expect(page.getByTestId("note-hunt-complete")).toBeVisible();
  });
});
