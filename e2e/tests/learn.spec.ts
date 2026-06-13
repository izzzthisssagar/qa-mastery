import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

/**
 * Learner-facing "learn" flow for the boundary-value-analysis lesson.
 *
 * Requires the local Supabase stack (`pnpm db:start`) AND the lesson synced
 * into the DB registry (`pnpm --filter @qa-mastery/curriculum sync`) so the
 * page renders `published`. Like auth.spec, local config has email
 * confirmations disabled, so signup returns a live session immediately.
 */

const SLUG = "boundary-value-analysis";

/**
 * Mirrors auth.spec.ts's inline signup (no shared helper exists there yet).
 * Signs up a fresh, unique learner and lands them on the dashboard.
 */
async function signUpFreshLearner(page: Page): Promise<void> {
  const email = `learner-${randomUUID()}@e2e.local`;
  const password = "a-strong-password-1";

  await page.goto("http://localhost:3000/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  // The click is wrapped in toPass(): on a cold dev compile the first click can
  // land before hydration and get swallowed; a retry is a no-op in prod builds.
  await expect(async () => {
    await page.getByRole("button", { name: /start learning free/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 4000 });
  }).toPass({ timeout: 20_000 });
}

// bva-q1..bva-q6 correct single-choice option indices (server-only key).
const CORRECT_ANSWERS: Record<string, number> = {
  "bva-q1": 1,
  "bva-q2": 1,
  "bva-q3": 2,
  "bva-q4": 1,
  "bva-q5": 1,
  "bva-q6": 1,
};

test.describe("learn — boundary-value-analysis", () => {
  test("anonymous visitor is redirected from the lesson to login", async ({
    page,
  }) => {
    await page.goto(`http://localhost:3000/learn/${SLUG}`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("signup → dashboard → lesson → widget bug → quiz pass", async ({
    page,
  }) => {
    await signUpFreshLearner(page);

    // dashboard renders and the Start lesson link is the entry point
    await expect(
      page.getByRole("heading", { name: /your learning/i }),
    ).toBeVisible();
    await page.getByTestId("start-bva").click();

    // lands on the lesson page and renders its title + the "See it" widget
    await expect(page).toHaveURL(new RegExp(`/learn/${SLUG}`));
    await expect(
      page.getByRole("heading", { name: /boundary value analysis/i }),
    ).toBeVisible();
    const widget = page.getByTestId("widget-boundary-slider");
    await expect(widget).toBeVisible();

    // jumping to 0 walks the edge and reveals the seeded off-by-one bug banner
    await expect(page.getByTestId("boundary-bug-found")).toBeHidden();
    await page.getByTestId("boundary-jump-0").click();
    await expect(page.getByTestId("boundary-bug-found")).toBeVisible();

    // quiz: submit is disabled until every question is answered
    const quiz = page.getByTestId("quiz-panel");
    await expect(quiz).toBeVisible();
    const submit = page.getByTestId("quiz-submit");
    await expect(submit).toBeDisabled();

    // answer all six questions correctly
    for (const [qid, optionIndex] of Object.entries(CORRECT_ANSWERS)) {
      const option = page.getByTestId(`quiz-opt-${qid}-${optionIndex}`);
      await option.click();
      await expect(option).toHaveAttribute("aria-pressed", "true");
    }

    // now submittable
    await expect(submit).toBeEnabled();
    await submit.click();

    // result banner shows a pass and explanations are now revealed
    const banner = page.getByTestId("quiz-result-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/passed/i);
    for (const qid of Object.keys(CORRECT_ANSWERS)) {
      await expect(page.getByTestId(`quiz-explanation-${qid}`)).toBeVisible();
    }

    // grading swaps Submit for the retry control
    await expect(page.getByTestId("quiz-retry")).toBeVisible();
  });

  test("Do it lab — a correct bug report matches the seeded BS-008", async ({
    page,
  }) => {
    await signUpFreshLearner(page);
    await page.goto(`http://localhost:3000/learn/${SLUG}`);

    const lab = page.getByTestId("bug-report-lab");
    await expect(lab).toBeVisible();

    // report the price-filter boundary bug the learner finds on BuggyShop
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
    await expect(page.getByTestId("bug-file-another")).toBeVisible();
  });
});
