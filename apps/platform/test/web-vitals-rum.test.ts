import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * P0-5: Web Vitals RUM. Vercel Analytics + Speed Insights report per-route
 * LCP/INP/CLS to the dashboard; INP is the hydration-regression signal
 * (see the notes-bug-hunt hydration-race workaround). Guards against the
 * root layout losing either component on a future edit.
 */
const layout = readFileSync(join(__dirname, "../src/app/layout.tsx"), "utf8");

describe("Web Vitals RUM wired into the root layout", () => {
  it("imports Vercel Analytics and Speed Insights", () => {
    expect(layout).toMatch(/from ["']@vercel\/analytics\/react["']/);
    expect(layout).toMatch(/from ["']@vercel\/speed-insights\/next["']/);
  });

  it("renders <Analytics /> and <SpeedInsights /> in the document body", () => {
    expect(layout).toMatch(/<Analytics\s*\/>/);
    expect(layout).toMatch(/<SpeedInsights\s*\/>/);
  });
});
