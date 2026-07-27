import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JiraBoard, SDLCVisualizer } from "@qa-mastery/widgets";

/**
 * P2-8: the Kanban (JiraBoard) and SDLC-cost (SDLCVisualizer) widgets used to
 * put their click handler on a plain <div>, which is invisible to keyboard
 * and screen-reader users — no tab stop, no role, no announced state change.
 * This asserts the rendered markup carries the fix: a real interactive
 * element (or role="button" + tabindex) plus a live region for the
 * on-activate state change.
 */
describe("JiraBoard keyboard + SR a11y", () => {
  const html = renderToStaticMarkup(<JiraBoard />);

  it("exposes each open ticket as a focusable, keyboard-operable control", () => {
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
  });

  it("labels the ticket's action for screen readers", () => {
    expect(html).toContain("Activate to move to");
  });

  it("carries a live region for status-change announcements", () => {
    expect(html).toContain('role="status"');
    expect(html).toMatch(/aria-live="polite"/);
  });
});

describe("SDLCVisualizer keyboard + SR a11y", () => {
  const html = renderToStaticMarkup(<SDLCVisualizer />);

  it("renders each phase as a native button, not a bare clickable div", () => {
    expect(html).toContain("<button");
    expect(html).toContain('aria-pressed="false"');
  });

  it("labels each phase's cost for screen readers", () => {
    expect(html).toContain("cost to fix a defect found here is");
  });

  it("marks the cost reveal panel as a live region", () => {
    expect(html).toContain('role="status"');
    expect(html).toMatch(/aria-live="polite"/);
  });
});
