import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("keeps a same-origin application path", () => {
    expect(safeNextPath("/notes/x")).toBe("/notes/x");
  });

  it("keeps a same-origin path with a query string and hash", () => {
    expect(safeNextPath("/notes/x?tab=progress#top")).toBe("/notes/x?tab=progress#top");
  });

  it("falls back to /dashboard for a missing value", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });

  it("falls back to /dashboard for an absolute URL", () => {
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
  });

  it("falls back to /dashboard for a protocol-relative URL", () => {
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
  });

  it("falls back to /dashboard for a backslash variant a browser could treat as protocol-relative", () => {
    expect(safeNextPath("/\\evil.example")).toBe("/dashboard");
    expect(safeNextPath("\\\\evil.example")).toBe("/dashboard");
  });

  it("falls back to /dashboard for a path with no leading slash", () => {
    expect(safeNextPath("notes")).toBe("/dashboard");
  });

  it("falls back to /dashboard for a raw control character", () => {
    expect(safeNextPath("/notes\x00")).toBe("/dashboard");
    expect(safeNextPath("/notes\r\nSet-Cookie:%20evil=1")).toBe("/dashboard");
  });

  it("falls back to /dashboard for an auth-loop destination", () => {
    expect(safeNextPath("/login")).toBe("/dashboard");
    expect(safeNextPath("/signup")).toBe("/dashboard");
    expect(safeNextPath("/login?next=/notes")).toBe("/dashboard");
    expect(safeNextPath("/signup/")).toBe("/dashboard");
  });

  it("does not treat a path merely prefixed by an auth path's name as a loop", () => {
    expect(safeNextPath("/login-help")).toBe("/login-help");
  });
});
