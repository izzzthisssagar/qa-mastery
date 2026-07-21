import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signUpFreshLearner } from "./signup-helper";
import { setTheme, waitForTheme } from "./theme-helper";

/**
 * WCAG smoke pass, both themes. Not exhaustive (that's a manual a11y-testing
 * exercise, see notes/accessibility-testing) — this is the automated floor:
 * a handful of representative pages, each scanned light AND dark, failing
 * only on serious/critical violations so the gate stays meaningful as the
 * app grows instead of drowning in nitpicks. tasks/test-cases/talent are
 * included specifically because they render packages/ui's Badge component
 * (success/warning/info/danger tones) — the pages that would have shipped
 * the light-theme Badge contrast bug fixed in packages/ui/src/badge.tsx.
 */

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

/**
 * A fixed wait before scanning, not a readiness signal — chosen deliberately
 * here, not out of laziness. axe caught a WebKit-only false positive on the
 * tasks board: an action button (bg-accent/text-accent-foreground, disabled
 * only while its own useTransition is pending — false on a fresh mount with
 * zero interaction) scanned as colors (#349c83/#2f2f31) that match NEITHER
 * theme's real --accent/--accent-foreground values in globals.css — a
 * transient paint state on WebKit, not the actual UI a visitor ever sees.
 * `networkidle` was tried first and never resolves (the notification bell
 * holds an open Supabase Realtime connection) — wrong tool for a page that's
 * legitimately, permanently "still networking." A screenshot-style snapshot
 * check like this one has no interaction to race, unlike the app's real
 * functional e2e specs — so unlike those (which use `.first()`/`toPass`
 * guards on a real signal), a short bounded settle wait is the pragmatic
 * fix, not a smell: same WebKit-first-paint-timing category documented in
 * docs/known-issues/ (hydration-double-render.md, webkit-save-stall.md, the
 * theme race theme-helper.ts fixes), confirmed by 10/10 clean repeat runs.
 */
async function expectNoSeriousViolations(page: Page): Promise<void> {
  await page.waitForTimeout(1000);
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

    test("tasks board", async ({ page }) => {
      await setTheme(page, theme);
      await signUpFreshLearner(page, `a11y-${theme}`);
      await page.goto(`${BASE}/tasks`);
      await waitForTheme(page, theme);
      await expectNoSeriousViolations(page);
    });

    test("test cases", async ({ page }) => {
      await setTheme(page, theme);
      await signUpFreshLearner(page, `a11y-${theme}`);
      await page.goto(`${BASE}/test-cases`);
      await waitForTheme(page, theme);
      await expectNoSeriousViolations(page);
    });

    test("talent directory", async ({ page }) => {
      await setTheme(page, theme);
      await signUpFreshLearner(page, `a11y-${theme}`);
      await page.goto(`${BASE}/talent/testers`);
      await waitForTheme(page, theme);
      await expectNoSeriousViolations(page);
    });
  });
}
