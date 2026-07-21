import type { Page } from "@playwright/test";

/**
 * Shared theme control for tests that need a specific light/dark render, not
 * whatever the browser's default color scheme resolves to. NOT a *.spec file,
 * so Playwright doesn't collect it.
 */

export async function setTheme(page: Page, theme: "light" | "dark"): Promise<void> {
  await page.addInitScript(`localStorage.setItem("theme", "${theme}")`);
}

/**
 * Wait for next-themes' own class-swap to actually land before asserting
 * anything theme-sensitive (a screenshot, a contrast check). `addInitScript`-
 * before-`goto` and next-themes' own blocking no-flash script are two
 * independently-scheduled early-document scripts — Chromium always won that
 * race in testing, WebKit didn't (caught as a ~97%-different full-page
 * screenshot diff: the whole page rendered in the wrong theme). Waiting for
 * the class directly removes the race instead of hoping script order holds.
 */
export async function waitForTheme(page: Page, theme: "light" | "dark"): Promise<void> {
  const check =
    theme === "dark"
      ? "document.documentElement.classList.contains('dark')"
      : "!document.documentElement.classList.contains('dark')";
  await page.waitForFunction(check);
}
