import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { usePointerFine } from "./use-pointer-fine";

function Probe() {
  const pointerFine = usePointerFine();
  return <div data-pointer-fine={pointerFine}>{pointerFine ? "monaco" : "textarea"}</div>;
}

describe("usePointerFine", () => {
  it("is false on the server — no window to query, so SSR always picks the touch-safe fallback", () => {
    const html = renderToStaticMarkup(<Probe />);
    expect(html).toContain('data-pointer-fine="false"');
    expect(html).toContain("textarea");
  });
});
