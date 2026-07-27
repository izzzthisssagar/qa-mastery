import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

/**
 * Notes v2 interactive surface. All 24 notes share the same component set, so
 * this drives ONE fully-loaded page — the approved reference note (tower &
 * laptop anatomy), which contains every interactive section — and asserts each
 * component's core interaction. CodePlayground is deliberately RENDER-ONLY:
 * no network in e2e (repo pattern); its real execution is covered by the
 * simulator action's unit tests and scripted verification.
 */

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const NOTE = `${BASE}/notes/how-a-computer-works/the-parts-of-a-computer/tower-and-laptop-anatomy`;

// Local copy of the hydration-safe signup (fills INSIDE the retry — a fill
// that lands before hydration never reaches React state; see
// docs/known-issues/webkit-save-stall.md). After the e2e-followups branch
// merges, replace with: import { signUpFreshLearner } from "./signup-helper";
async function signUpFreshLearner(page: Page): Promise<void> {
  const email = `notesv2-${randomUUID()}@e2e.local`;
  await page.goto(`${BASE}/signup`);
  await expect(async () => {
    if (!/\/dashboard/.test(page.url())) {
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill("a-strong-password-1");
      await page.getByRole("button", { name: /start learning free/i }).click();
    }
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 4000 });
  }).toPass({ timeout: 20_000 });
}

test.describe("notes v2 — interactive note surface", () => {
  test.beforeEach(async ({ page }) => {
    await signUpFreshLearner(page);
    await page.goto(NOTE);
    // Hydration gate for the interactions below: wait until a pin click can
    // actually reach React (first hotspot button exists and page is idle).
    await expect(page.getByRole("button", { name: /^explore:/i }).first()).toBeVisible();
  });

  test("hotspot pin click shows the description card and advances the counter", async ({
    page,
  }) => {
    const firstImage = page.locator("img").first();
    await firstImage.scrollIntoViewIfNeeded();

    // Pins pulse amber and are numbered until explored.
    const pin = page.getByRole("button", { name: /^explore:/i }).first();
    const pinName = (await pin.getAttribute("aria-label"))!.replace(/^Explore: /, "");
    await expect(async () => {
      await pin.click();
      await expect(page.getByText(pinName, { exact: true }).first()).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10_000 });

    await expect(page.getByText(/^Explored 1 \/ \d+$/).first()).toBeVisible();
    // The explored pin flips from its number to a checkmark.
    await expect(pin).toHaveText("✓");
  });

  test("parts quest: tapping a number reveals the part and counts it as met", async ({ page }) => {
    // The quest legend is the row of small numbered buttons named "1", "2", …
    const legend = page.getByText(/tap a number to meet that part/i);
    await legend.scrollIntoViewIfNeeded();
    const quest = legend.locator("xpath=ancestor::div[contains(@class,'rounded-2xl')]");
    await expect(async () => {
      await quest.getByRole("button", { name: "1", exact: true }).click();
      await expect(quest.getByText(/^1 \/ \d+ parts met$/)).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10_000 });
    // Active part shows its description card ("1. <name>").
    await expect(quest.getByText(/^1\. /)).toBeVisible();
  });

  test("step checklist check-off updates the progress line", async ({ page }) => {
    const progress = page.getByText(/^\d+ \/ \d+ done$/);
    await progress.scrollIntoViewIfNeeded();
    const before = (await progress.textContent())!;
    const list = progress.locator("xpath=preceding-sibling::ol[1]");
    await expect(async () => {
      await list.getByRole("listitem").first().getByRole("button").click();
      await expect(progress).not.toHaveText(before, { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
    await expect(progress).toHaveText(/^1 \/ \d+ done$/);
  });

  test("when-it-breaks accordion expands a symptom to its fix", async ({ page }) => {
    // Scope to the section — the header's account-menu button also carries
    // aria-expanded, so a page-wide [aria-expanded] locator grabs the wrong thing.
    const section = page.locator("section", { hasText: "When it breaks" });
    const item = section.getByRole("button").first();
    await item.scrollIntoViewIfNeeded();
    await expect(async () => {
      await item.click();
      await expect(item).toHaveAttribute("aria-expanded", "true", { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
    await expect(section.getByText(/^Fix:/).first()).toBeVisible();
  });

  test("flow animation Step advances the active stage", async ({ page }) => {
    const step = page.getByRole("button", { name: /^step/i }).first();
    await step.scrollIntoViewIfNeeded();
    await expect(page.getByText(/^Stage 1 of \d+$/)).toBeVisible();
    await expect(async () => {
      await step.click();
      await expect(page.getByText(/^Stage 2 of \d+$/)).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10_000 });
  });

  test("quiz answer gives instant feedback and locks the options", async ({ page }) => {
    // First option = first button after the "Quick check" heading (the heading
    // text includes an emoji, so exact-match container lookups don't work).
    const option = page.getByText("Quick check").first().locator("xpath=following::button[1]");
    await option.scrollIntoViewIfNeeded();
    await expect(async () => {
      await option.click();
      await expect(page.getByText(/Correct!|Not quite\./).first()).toBeVisible({
        timeout: 1000,
      });
    }).toPass({ timeout: 10_000 });
    // Options lock after an answer.
    await expect(option).toBeDisabled();
  });

  test("code playground renders editable code and a run affordance (render-only)", async ({
    page,
  }) => {
    const editor = page.getByLabel("Editable code");
    await editor.scrollIntoViewIfNeeded();
    await expect(editor).toBeVisible();
    await expect(editor).toBeEditable();
    await expect(page.getByRole("button", { name: /run/i }).first()).toBeVisible();
    // No click: e2e never talks to Wandbox.
  });

  test("marking a note complete persists across a reload (real XP)", async ({ page }) => {
    const complete = page.getByRole("button", { name: /mark complete/i });
    await complete.scrollIntoViewIfNeeded();
    await expect(async () => {
      await complete.click();
      await expect(page.getByRole("button", { name: /completed .* xp earned/i })).toBeVisible({
        timeout: 2000,
      });
    }).toPass({ timeout: 10_000 });

    // Reload: completion is server-persisted (note_progress), so the button
    // renders already-completed rather than resetting to its client demo state.
    await page.reload();
    await expect(page.getByRole("button", { name: /completed .* xp earned/i })).toBeVisible();
  });
});
