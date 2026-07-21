import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signUpFreshLearner } from "./signup-helper";
import { setTheme, waitForTheme } from "./theme-helper";

/**
 * WCAG smoke pass, both themes. Not exhaustive (that's a manual a11y-testing
 * exercise, see notes/accessibility-testing) — this is the automated floor:
 * one marketing page, one app-chrome page and one MDX content page, each
 * scanned light AND dark, failing only on serious/critical violations so the
 * gate stays meaningful as the app grows instead of drowning in nitpicks.
 */

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

async function expectNoSeriousViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`a11y — ${theme} theme`, () => {
    test("marketing homepage", async ({ page }) => {
      await setTheme(page, theme);
      await page.goto(BASE);
      await waitForTheme(page, theme);
      await expectNoSeriousViolations(page);
    });

    test("dashboard (authenticated app chrome)", async ({ page }) => {
      await setTheme(page, theme);
      await signUpFreshLearner(page, `a11y-${theme}`);
      await waitForTheme(page, theme);
      await expectNoSeriousViolations(page);
    });

    test("notes topic page (MDX content)", async ({ page }) => {
      await setTheme(page, theme);
      await signUpFreshLearner(page, `a11y-${theme}`);
      await page.goto(`${BASE}/notes/qa-foundations/what-is-qa/qa-vs-qc-vs-testing`);
      await waitForTheme(page, theme);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      await expectNoSeriousViolations(page);
    });
  });
}
