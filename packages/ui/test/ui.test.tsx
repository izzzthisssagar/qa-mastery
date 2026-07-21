import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Badge, Button, cn } from "../src/index";

describe("cn", () => {
  it("joins truthy classes and skips falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
    expect(cn()).toBe("");
  });
});

describe("Button", () => {
  it("defaults to type=button — never submits a form by accident", () => {
    expect(renderToStaticMarkup(<Button>Go</Button>)).toContain('type="button"');
  });

  it("an explicit type=submit still wins", () => {
    expect(renderToStaticMarkup(<Button type="submit">Save</Button>)).toContain('type="submit"');
  });

  it("applies the variant classes and appends custom className last", () => {
    const html = renderToStaticMarkup(
      <Button variant="danger" className="w-full">
        Delete
      </Button>,
    );
    expect(html).toContain("bg-red-500");
    expect(html).toMatch(/class="[^"]*w-full"/);
  });

  it("passes through disabled and other native props", () => {
    expect(renderToStaticMarkup(<Button disabled>Wait</Button>)).toContain("disabled");
  });

  it("loading shows the spinner, disables and marks aria-busy", () => {
    const html = renderToStaticMarkup(<Button loading>Saving…</Button>);
    expect(html).toContain('role="status"'); // the Spinner
    expect(html).toContain('disabled=""'); // the attribute, not the Tailwind class
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Saving…");
  });

  it("not loading renders no spinner and stays enabled", () => {
    const html = renderToStaticMarkup(<Button>Save</Button>);
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('disabled=""');
  });
});

describe("Badge", () => {
  it("renders each tone with its palette", () => {
    expect(renderToStaticMarkup(<Badge tone="success">ok</Badge>)).toContain("text-emerald-300");
    expect(renderToStaticMarkup(<Badge tone="danger">bad</Badge>)).toContain("text-red-300");
    // The neutral tone is theme-driven, so it uses semantic tokens rather than
    // a fixed zinc ramp — the coloured tones stay literal on purpose.
    expect(renderToStaticMarkup(<Badge>plain</Badge>)).toContain("text-foreground");
  });
});
