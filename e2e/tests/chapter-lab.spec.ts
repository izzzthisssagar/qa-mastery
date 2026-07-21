import { expect, test, type Page } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

/**
 * Chapter labs — the graded exercise that closes out a notes chapter.
 *
 * There is no /notes/[module]/[chapter] route, so a lab renders after the LAST
 * file-backed topic of its chapter. That placement and the read-the-chapter-first
 * gate are the two things only a browser can confirm, so they are what this
 * covers.
 *
 * Deliberately NO submit click: submitting runs the learner's code on Wandbox,
 * and this suite never talks to it (same rule as the CodePlayground test in
 * notes-v2.spec.ts). Grading correctness is covered by the pure unit tests in
 * packages/grading/test/lab-checks.test.ts.
 */

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const CHAPTER = `${BASE}/notes/logic-and-control-flow/loops`;
const LAST_TOPIC = `${CHAPTER}/iterating-collections`;
const FIRST_TOPIC = `${CHAPTER}/for-loops`;

/** The chapter's topics in taxonomy order; the lab hangs off the last. */
const TOPICS = ["for-loops", "while-loops", "break-and-continue", "iterating-collections"];

/**
 * Mark one note complete, tolerating the pre-hydration click race.
 *
 * The done-guard matters: a click that lands before React hydrates does nothing
 * *yet*, but can still settle after the inner assertion times out. Without the
 * guard the retry re-clicks a "Mark complete" button that has already become
 * "Completed", and toPass then burns its budget on a locator that will never
 * match again. Same shape as the URL guard in signup-helper.ts.
 */
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

test.describe("chapter lab", () => {
  test("renders on the chapter's last topic, locked until the notes are read", async ({
    page,
  }) => {
    await signUpFreshLearner(page, "lab");
    await page.goto(LAST_TOPIC);

    const lab = page.getByRole("heading", { name: /chapter lab/i });
    await lab.scrollIntoViewIfNeeded();
    await expect(lab).toBeVisible();

    // Fresh learner has read none of the 4 notes, so the lab is locked and
    // says how many are left rather than showing an editor.
    await expect(page.getByText(/finish the last 4 notes in this chapter/i)).toBeVisible();
    await expect(page.getByLabel("Your solution")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /submit for grading/i })).toHaveCount(0);
  });

  test("does not render on a topic that is not the chapter's last", async ({ page }) => {
    await signUpFreshLearner(page, "lab");
    await page.goto(FIRST_TOPIC);

    // The note itself renders, but no lab — a lab closes a chapter, not a note.
    await expect(page.getByRole("heading", { name: /for loops/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /chapter lab/i })).toHaveCount(0);
  });

  test("unlocks with a starter and a submit control once the chapter is read", async ({
    page,
  }) => {
    test.slow(); // completes four notes before the assertion
    await signUpFreshLearner(page, "lab");

    for (const topic of TOPICS) {
      await completeNote(page, `${CHAPTER}/${topic}`);
    }

    await page.goto(LAST_TOPIC);
    const lab = page.getByRole("heading", { name: /chapter lab/i });
    await lab.scrollIntoViewIfNeeded();

    await expect(page.getByText(/finish the last .* notes? in this chapter/i)).toHaveCount(0);

    // The editor is pre-filled with the registry's starter, not left blank.
    // .first(): the transient post-hydration double-render race documented in
    // docs/known-issues/hydration-double-render.md — first testid interaction
    // right after a fresh page.goto(), both copies are content-identical.
    const editor = page.getByLabel("Your solution").first();
    await expect(editor).toBeVisible();
    await expect(editor).toBeEditable();
    await expect(editor).toHaveValue(/results = \[/);

    await expect(page.getByRole("button", { name: /submit for grading/i }).first()).toBeVisible();
  });
});
