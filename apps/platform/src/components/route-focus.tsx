"use client";

import { useEffect } from "react";

/**
 * Moves focus to the page's <h1> after every route change so screen-reader
 * users get the new page announced instead of keeping focus on a stale nav
 * link (WCAG 2.4.3). Lives inside (app)/template.tsx, which Next.js remounts
 * on every navigation — so this effect re-runs per route without needing
 * usePathname.
 */
export function RouteFocusHeading() {
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>("main h1");
    if (!heading) return;
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    // Programmatic focus (not a keyboard tab stop) still triggers the
    // browser's default :focus-visible ring in Chromium/WebKit — visibly
    // different per-browser and enough to bust the pinned visual-regression
    // baselines (maxDiffPixelRatio 0.01) on every dashboard screenshot.
    heading.style.outline = "none";
    heading.focus({ preventScroll: true });
  }, []);

  return null;
}
