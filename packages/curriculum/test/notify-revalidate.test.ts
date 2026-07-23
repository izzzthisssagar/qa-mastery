import { describe, expect, it, vi } from "vitest";
import { notifyRevalidate } from "../scripts/notify-revalidate";

describe("notifyRevalidate", () => {
  it("skips (without fetching) when url/secret aren't configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await notifyRevalidate(["boundary-value-analysis"], {});
    expect(result).toEqual({ skipped: true });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("no-ops without a network call when there are no changed slugs", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await notifyRevalidate([], { url: "https://app.example/x", secret: "s3cr3t" });
    expect(result).toEqual({ skipped: false, ok: true, status: 200 });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("POSTs the changed slugs with a bearer-token auth header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await notifyRevalidate(["boundary-value-analysis", "equivalence-partitioning"], {
      url: "https://app.example/api/internal/revalidate-lesson",
      secret: "s3cr3t",
    });

    expect(result).toEqual({ skipped: false, ok: true, status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.example/api/internal/revalidate-lesson");
    expect(init.method).toBe("POST");
    expect(init.headers.authorization).toBe("Bearer s3cr3t");
    expect(JSON.parse(init.body)).toEqual({
      slugs: ["boundary-value-analysis", "equivalence-partitioning"],
    });

    vi.unstubAllGlobals();
  });

  it("surfaces a non-ok response instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    const result = await notifyRevalidate(["boundary-value-analysis"], {
      url: "https://app.example/api/internal/revalidate-lesson",
      secret: "s3cr3t",
    });

    expect(result).toEqual({ skipped: false, ok: false, status: 500 });
    vi.unstubAllGlobals();
  });
});
