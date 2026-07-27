import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { revalidateTagMock } = vi.hoisted(() => ({ revalidateTagMock: vi.fn() }));

vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
  // curriculum-cache.ts (imported for CURRICULUM_CACHE_TAG) also calls
  // unstable_cache at module load time -- stub it as a passthrough so that
  // import doesn't throw before the mocked revalidateTag is even reached.
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));
vi.mock("server-only", () => ({}));

const { POST } = await import("./route");

const ORIGINAL_SECRET = process.env.CURRICULUM_REVALIDATE_SECRET;

function requestWith(authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("http://localhost/api/revalidate-curriculum", { method: "POST", headers });
}

describe("POST /api/revalidate-curriculum", () => {
  beforeEach(() => {
    revalidateTagMock.mockClear();
    process.env.CURRICULUM_REVALIDATE_SECRET = "s3cret-value";
  });

  afterEach(() => {
    process.env.CURRICULUM_REVALIDATE_SECRET = ORIGINAL_SECRET;
  });

  it("returns 401 and does not invalidate when no signature is provided", async () => {
    const res = await POST(requestWith());
    expect(res.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("returns 401 and does not invalidate for a wrong signature", async () => {
    const res = await POST(requestWith("Bearer wrong-value"));
    expect(res.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("returns 401 and does not invalidate when CURRICULUM_REVALIDATE_SECRET is unset", async () => {
    delete process.env.CURRICULUM_REVALIDATE_SECRET;
    const res = await POST(requestWith("Bearer s3cret-value"));
    expect(res.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("invalidates exactly once on a correct signature", async () => {
    const res = await POST(requestWith("Bearer s3cret-value"));
    expect(res.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
    expect(revalidateTagMock).toHaveBeenCalledWith("curriculum", { expire: 0 });
  });
});
