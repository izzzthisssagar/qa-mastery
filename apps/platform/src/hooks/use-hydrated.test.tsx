import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { useHydrated } from "./use-hydrated";

function Probe() {
  const hydrated = useHydrated();
  return <div data-hydrated={hydrated}>{hydrated ? "ready" : "gated"}</div>;
}

describe("useHydrated", () => {
  it("is false on the server — effects never run during static SSR, so the first paint is always gated", () => {
    const html = renderToStaticMarkup(<Probe />);
    expect(html).toContain('data-hydrated="false"');
    expect(html).toContain("gated");
  });
});
