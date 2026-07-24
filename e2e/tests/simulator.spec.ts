import { expect, test, type Page } from "@playwright/test";
import { signUpFreshLearner as sharedSignUp } from "./signup-helper";

/**
 * Coding-simulator smoke. Verifies the page is auth-gated, renders the Monaco
 * editor + language picker, and swaps the starter snippet when the language
 * changes. It deliberately does NOT click Run — execution hits the live Wandbox
 * API, which we keep out of CI (network + shared rate limit). The runner logic
 * is covered by unit tests (wandbox-runner.test.ts).
 */

async function signUpFreshLearner(page: Page): Promise<void> {
  await sharedSignUp(page, "sim");
}

test.describe("coding simulator", () => {
  test("anonymous visitor is redirected to login", async ({ page }) => {
    await page.goto("http://localhost:3000/simulator");
    await expect(page).toHaveURL(/\/login/);
  });

  test("renders the editor and swaps starters on language change", async ({ page }) => {
    await signUpFreshLearner(page);
    await page.goto("http://localhost:3000/simulator");

    await expect(page.getByRole("heading", { name: /coding simulator/i })).toBeVisible();

    const langSelect = page.getByTestId("simulator-language");
    await expect(langSelect).toBeVisible();
    await expect(page.getByTestId("simulator-run")).toBeVisible();

    // Monaco renders its text into the DOM; the Java starter is the default.
    const editor = page.locator(".monaco-editor");
    await expect(editor).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).toContainText("public class Main");

    // Switching to Python replaces the untouched starter buffer.
    await langSelect.selectOption("python");
    await expect(page.locator("body")).toContainText('print("Hello, QA!")');
  });

  test("falls back to a plain textarea on touch-only (no fine pointer) devices", async ({ page }) => {
    // Stubbing matchMedia is deterministic across Chromium AND WebKit, unlike
    // device-emulation presets (isMobile isn't supported on WebKit contexts).
    await page.addInitScript(() => {
      // Cast to `any`: this runs in the browser (DOM lib), but the e2e
      // package's tsconfig has no "dom" lib, so `window`/`MediaQueryList`
      // aren't declared types here.
      const win = globalThis as any;
      const real = win.matchMedia.bind(win);
      win.matchMedia = (query: string) =>
        query.includes("pointer: fine")
          ? {
              matches: false,
              media: query,
              addEventListener() {},
              removeEventListener() {},
              addListener() {},
              removeListener() {},
              onchange: null,
              dispatchEvent: () => false,
            }
          : real(query);
    });

    await signUpFreshLearner(page);
    await page.goto("http://localhost:3000/simulator");

    const fallback = page.getByTestId("simulator-editor-fallback");
    await expect(fallback).toBeVisible();
    await expect(page.locator(".monaco-editor")).toHaveCount(0);
    await expect(fallback).toHaveValue(/public class Main/);

    // Edits land in the same `code` state Monaco would write to — the
    // fallback isn't a second, divergent code path, so grading (via Run,
    // covered by unit tests, not exercised here) sees identical input.
    await fallback.fill('print("mobile fallback")');
    await expect(fallback).toHaveValue('print("mobile fallback")');
  });
});
