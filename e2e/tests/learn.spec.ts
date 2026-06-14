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
    await page.getByTestId("lesson-link-boundary-value-analysis").click();

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

test.describe("learn — equivalence-partitioning", () => {
  const EP_SLUG = "equivalence-partitioning";

  test("dashboard links to the lesson and it renders its title", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.getByTestId("lesson-link-equivalence-partitioning").click();
    await expect(page).toHaveURL(new RegExp(`/learn/${EP_SLUG}`));
    await expect(
      page.getByRole("heading", { name: /equivalence partitioning/i }),
    ).toBeVisible();
  });

  test("Do it lab — reporting the signup email bug matches BS-001", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.goto(`http://localhost:3000/learn/${EP_SLUG}`);

    await expect(page.getByTestId("bug-report-lab")).toBeVisible();

    // report the invalid-email-accepted bug found on BuggyShop's signup page
    await page.getByTestId("bug-page").selectOption("signup");
    await page.getByTestId("bug-feature").selectOption("email-validation");
    await page.getByTestId("bug-category").selectOption("validation");
    await page.getByTestId("bug-severity").selectOption("major");
    await page.getByTestId("bug-title").fill("Invalid email accepted at signup");
    await page
      .getByTestId("bug-steps")
      .fill("Open Sign up\nEnter user@@domain..com\nIt is accepted");
    await page.getByTestId("bug-expected").fill("Invalid address should be rejected");
    await page.getByTestId("bug-actual").fill("Invalid address is accepted");

    const submit = page.getByTestId("bug-submit");
    await expect(submit).toBeEnabled();
    await submit.click();

    const result = page.getByTestId("bug-result");
    await expect(result).toBeVisible();
    await expect(result).toContainText(/BS-001/);
  });
});

test.describe("learn — Bug Hunt milestone (A4.6)", () => {
  async function fileBug(
    page: Page,
    bug: { p: string; f: string; c: string; s: string; title: string },
  ) {
    await page.getByTestId("bug-page").selectOption(bug.p);
    await page.getByTestId("bug-feature").selectOption(bug.f);
    await page.getByTestId("bug-category").selectOption(bug.c);
    await page.getByTestId("bug-severity").selectOption(bug.s);
    await page.getByTestId("bug-title").fill(bug.title);
    await page.getByTestId("bug-steps").fill("step one\nstep two");
    await page.getByTestId("bug-expected").fill("expected behaviour");
    await page.getByTestId("bug-actual").fill("actual behaviour");
    await page.getByTestId("bug-submit").click();
    await expect(page.getByTestId("bug-result")).toBeVisible();
  }

  test("finding both seeded bugs completes the hunt", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.goto("http://localhost:3000/learn/bug-hunt-i");

    const hunt = page.getByTestId("bug-hunt");
    await expect(hunt).toBeVisible();
    await expect(page.getByTestId("hunt-count")).toContainText(/0 of \d+/);

    // report the price-filter bug, then file another for the signup email bug
    await fileBug(page, {
      p: "product-list", f: "price-filter", c: "boundary", s: "major",
      title: "Max-price item excluded",
    });
    await expect(page.getByTestId("hunt-count")).toContainText(/1 of \d+/);

    await page.getByTestId("bug-file-another").click();
    await fileBug(page, {
      p: "signup", f: "email-validation", c: "validation", s: "major",
      title: "Invalid email accepted",
    });

    // progress accrues per distinct seeded bug matched
    await expect(page.getByTestId("hunt-count")).toContainText(/2 of \d+/);
  });
});

test.describe("learn — state-machine widget (A3.5)", () => {
  test("walking the lifecycle then an invalid transition is refused", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.goto("http://localhost:3000/learn/state-transition-testing");

    const widget = page.getByTestId("widget-state-machine");
    await expect(widget).toBeVisible();
    await expect(page.getByTestId("current-state")).toHaveText("Placed");

    // happy path
    await page.getByTestId("event-Pay").click();
    await expect(page.getByTestId("current-state")).toHaveText("Paid");
    await page.getByTestId("event-Ship").click();
    await expect(page.getByTestId("current-state")).toHaveText("Shipped");

    // invalid: Cancel after Shipped is refused, state unchanged
    await page.getByTestId("event-Cancel").click();
    await expect(page.getByTestId("transition-rejected")).toBeVisible();
    await expect(page.getByTestId("current-state")).toHaveText("Shipped");
  });
});

test.describe("learn — decision-table widget (A3.4)", () => {
  test("free shipping only when all three conditions hold", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.goto("http://localhost:3000/learn/decision-tables");

    await expect(page.getByTestId("widget-decision-table")).toBeVisible();
    // nothing on -> standard shipping
    await expect(page.getByTestId("dt-action")).toHaveText("Standard shipping");

    // turn all three on -> free shipping
    await page.getByTestId("cond-0").click();
    await page.getByTestId("cond-1").click();
    await page.getByTestId("cond-2").click();
    await expect(page.getByTestId("dt-action")).toHaveText("Free shipping");

    // turning one back off -> standard again, and the exploration milestone fired
    await page.getByTestId("cond-2").click();
    await expect(page.getByTestId("dt-action")).toHaveText("Standard shipping");
    await expect(page.getByTestId("dt-explored")).toBeVisible();
  });
});

test.describe("learn — triage-grid widget (A4.3)", () => {
  test("the divergent bug (low severity, high priority) triages and explains", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.goto("http://localhost:3000/learn/priority-vs-severity");

    await expect(page.getByTestId("widget-triage-grid")).toBeVisible();
    // first bug is the divergent one: low severity, high priority
    await page.getByTestId("cell-low-high").click();
    const feedback = page.getByTestId("triage-feedback");
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText("Spot on");
    await expect(feedback).toContainText(/Severity Low, Priority High/);
  });
});

test.describe("learn — partition-picker widget (A3.2)", () => {
  test("a minimal 3-value set covers all three classes", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.goto("http://localhost:3000/learn/equivalence-partitioning");

    await expect(page.getByTestId("widget-partition-picker")).toBeVisible();
    await expect(page.getByTestId("coverage-valid")).toContainText("○");

    // one representative per class: 10 (low), 35 (valid), 80 (high)
    await page.getByTestId("candidate-10").click();
    await page.getByTestId("candidate-35").click();
    await page.getByTestId("candidate-80").click();

    await expect(page.getByTestId("selected-count")).toHaveText("3");
    await expect(page.getByTestId("partition-covered")).toBeVisible();
    await expect(page.getByTestId("partition-covered")).toContainText(/Minimal and complete/);
  });
});

test.describe("dashboard — progress & XP", () => {
  test("completing a lesson shows XP and a done marker", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.goto(`http://localhost:3000/learn/${SLUG}`);

    // pass the BVA quiz (awards XP + marks the lesson complete)
    for (const [qid, optionIndex] of Object.entries(CORRECT_ANSWERS)) {
      await page.getByTestId(`quiz-opt-${qid}-${optionIndex}`).click();
    }
    await page.getByTestId("quiz-submit").click();
    await expect(page.getByTestId("quiz-result-banner")).toContainText(/passed/i);

    // the dashboard now reflects it
    await page.goto("http://localhost:3000/dashboard");
    await expect(page.getByTestId("stat-xp")).toContainText("50");
    await expect(page.getByTestId("stat-completed")).toContainText("1");
    await expect(page.getByTestId(`lesson-done-${SLUG}`)).toBeVisible();
  });
});

test.describe("learn — all Track A lessons render", () => {
  // MDX compiles at request time, so a render check catches a broken lesson
  // body or quiz that the build can't. Covers the whole track.
  const TRACK_A_SLUGS = [
    // A1
    "what-is-software-testing",
    "sdlc-how-software-gets-built",
    "stlc-testers-lifecycle",
    "what-is-a-bug",
    "cost-of-bugs-and-agile",
    // A2
    "verification-vs-validation",
    "testing-levels",
    "testing-types",
    "black-white-grey-box",
    "seven-testing-principles",
    // A3
    "why-design-tests",
    "equivalence-partitioning",
    "boundary-value-analysis",
    "decision-tables",
    "state-transition-testing",
    "error-guessing",
    // A4
    "writing-test-cases",
    "test-data-and-preconditions",
    "priority-vs-severity",
    "bug-report-that-gets-fixed",
    "jira-and-test-management",
    "bug-hunt-i",
    // A5
    "exploratory-testing-sbtm",
    "smoke-sanity-retest-regression",
    "cross-browser-responsive-compatibility",
    "uat-reporting-signoff",
    "working-with-developers",
    "capstone-full-test-cycle",
    // Track B — B0
    "java-setup-first-program",
    "java-variables-and-types",
    "java-control-flow",
    "java-methods-and-classes",
    "java-collections-and-exceptions",
    // Track B — B1
    "why-automate",
    "the-automation-pyramid",
    "how-webdriver-works",
    "locators-and-the-dom",
    // Track B — B2
    "first-selenium-test",
    "finding-elements",
    "interacting-with-elements",
    "waits-and-synchronization",
    "dropdowns-alerts-frames",
    "actions-and-keyboard",
    // Track B — B3
    "testng-basics",
    "annotations-lifecycle",
    "data-driven-testing",
    "page-object-model",
    "maven-and-suites",
    // Track B — B4
    "stable-locators-flakiness",
    "test-structure-naming",
    "reporting-and-logging",
    "ci-for-tests",
    "automation-capstone",
    // Track B — B5
    "git-basics",
    "branching-and-merging",
    "remotes-and-prs",
    "git-in-test-workflow",
  ];

  test("every lesson renders its body and quiz", async ({ page }) => {
    test.slow(); // navigates all 57 lessons
    await signUpFreshLearner(page);
    for (const slug of TRACK_A_SLUGS) {
      await page.goto(`http://localhost:3000/learn/${slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByTestId("quiz-panel")).toBeVisible();
      await expect(page.getByTestId("quiz-submit")).toBeVisible();
    }
  });
});
