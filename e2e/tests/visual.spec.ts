import { expect, test } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";
import { setTheme, waitForTheme } from "./theme-helper";

/**
 * Visual regression, both themes. Deliberately small (2 pages): the point is
 * to catch an accidental full-page style regression (a token change that
 * breaks a whole surface, a CSS reset, a layout shift), not to pixel-lock
 * every component — that's what the design system + a11y gate are for.
 *
 * `reducedMotion: "reduce"` is load-bearing, not incidental: Reveal/
 * RevealOnView (components/motion.tsx) are Framer Motion, which animates via
 * requestAnimationFrame rather than CSS — Playwright's own
 * `animations: "disabled"` only freezes CSS animations/transitions, so it
 * cannot make a Framer Motion mount-fade deterministic. Forcing
 * prefers-reduced-motion makes those components skip the animation entirely
 * (they already branch on useReducedMotion for real visitors), which is both
 * deterministic AND doubles as coverage that the reduced-motion path renders
 * correctly.
 *
 * These snapshots are only meaningful captured and compared inside the same
 * pinned container — see docs/known-issues/visual-regression-baselines.md.
 */

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

for (const theme of ["light", "dark"] as const) {
  test.describe(`visual — ${theme} theme`, () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("marketing homepage", async ({ page }) => {
      await setTheme(page, theme);
      await page.goto(BASE);
      await waitForTheme(page, theme);
      await expect(page).toHaveScreenshot(`homepage-${theme}.png`, {
        fullPage: true,
        animations: "disabled",
        timeout: 15_000,
      });
    });

    test("dashboard (authenticated app chrome)", async ({ page }) => {
      await setTheme(page, theme);
      await signUpFreshLearner(page, `visual-${theme}`);
      await waitForTheme(page, theme);
      await expect(page).toHaveScreenshot(`dashboard-${theme}.png`, {
        fullPage: true,
        animations: "disabled",
        timeout: 15_000,
      });
    });
  });
}
