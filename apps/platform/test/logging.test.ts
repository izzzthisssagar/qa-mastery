import { describe, expect, it, vi } from "vitest";
import { hashUserId, logAction, withLogging } from "../src/lib/logging";

describe("hashUserId", () => {
  it("is deterministic and never returns the raw id", () => {
    const hash = hashUserId("user-123");
    expect(hash).toBe(hashUserId("user-123"));
    expect(hash).not.toContain("user-123");
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("logAction", () => {
  it("emits one JSON line with the required fields", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logAction({ action: "test", userIdHash: "abc", ok: true, ms: 12 });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(spy.mock.calls[0][0] as string)).toEqual({
      action: "test",
      userIdHash: "abc",
      ok: true,
      ms: 12,
    });
    spy.mockRestore();
  });
});

describe("withLogging", () => {
  it("logs ok:true and returns the result on success", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await withLogging("myAction", "user-1", async () => "done");
    expect(result).toBe("done");
    const line = JSON.parse(spy.mock.calls[0][0] as string);
    expect(line.action).toBe("myAction");
    expect(line.ok).toBe(true);
    expect(line.userIdHash).toBe(hashUserId("user-1"));
    expect(typeof line.ms).toBe("number");
    spy.mockRestore();
  });

  it("logs ok:false with the error message and re-throws", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(
      withLogging("myAction", "user-1", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    const line = JSON.parse(spy.mock.calls[0][0] as string);
    expect(line.ok).toBe(false);
    expect(line.error).toBe("boom");
    spy.mockRestore();
  });

  it("hashes null user ids as 'anonymous'", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await withLogging("anonAction", null, async () => undefined);
    const line = JSON.parse(spy.mock.calls[0][0] as string);
    expect(line.userIdHash).toBe("anonymous");
    spy.mockRestore();
  });
});
