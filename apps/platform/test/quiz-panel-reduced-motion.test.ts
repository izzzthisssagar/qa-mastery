import { afterEach, describe, expect, it, vi } from "vitest";
import { prefersReducedMotion } from "../src/lib/reduced-motion";

/**
 * canvas-confetti has no reduced-motion awareness of its own (P2-8) — the
 * quiz pass celebration must check the media query before firing it.
 */
describe("prefersReducedMotion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is true when the OS/browser requests reduced motion", () => {
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)" }),
    });
    expect(prefersReducedMotion()).toBe(true);
  });

  it("is false when motion is not reduced", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false }),
    });
    expect(prefersReducedMotion()).toBe(false);
  });
});
