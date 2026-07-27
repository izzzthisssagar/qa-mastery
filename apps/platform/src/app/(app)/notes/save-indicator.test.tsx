import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SaveIndicator } from "./save-indicator";

describe("SaveIndicator", () => {
  it("renders nothing for idle", () => {
    expect(renderToStaticMarkup(<SaveIndicator status="idle" />)).toBe("");
  });

  it("shows a saving state", () => {
    const html = renderToStaticMarkup(<SaveIndicator status="saving" />);
    expect(html).toContain("Saving…");
  });

  it("shows a saved state, distinct from saving", () => {
    const html = renderToStaticMarkup(<SaveIndicator status="saved" />);
    expect(html).toContain("Saved");
    expect(html).not.toContain("Saving");
  });

  it("never shows error silently — always offers a retry affordance when onRetry is given", () => {
    const html = renderToStaticMarkup(<SaveIndicator status="error" onRetry={() => {}} />);
    expect(html).toContain("Couldn&#x27;t save");
    expect(html).toContain("Retry");
    expect(html).toContain("<button");
  });

  it("omits the retry button when no onRetry is given", () => {
    const html = renderToStaticMarkup(<SaveIndicator status="error" />);
    expect(html).toContain("Couldn&#x27;t save");
    expect(html).not.toContain("<button");
  });
});
