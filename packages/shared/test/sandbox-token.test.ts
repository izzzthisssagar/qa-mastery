import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HANDOFF_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  mintHandoffToken,
  mintSessionToken,
  verifyHandoffToken,
  verifySessionToken,
  type SandboxClaims,
} from "../src/sandbox-token";

const SECRET = "test-secret-at-least-16-chars-long";
const CLAIMS: SandboxClaims = {
  userId: "user-123",
  sandboxId: "sandbox-456",
  release: "1.0",
};

describe("sandbox tokens", () => {
  it("handoff token round-trips its claims", async () => {
    const token = await mintHandoffToken(CLAIMS, SECRET);
    const verified = await verifyHandoffToken(token, SECRET);
    expect(verified).toEqual(CLAIMS);
  });

  it("session token round-trips its claims", async () => {
    const token = await mintSessionToken(CLAIMS, SECRET);
    const verified = await verifySessionToken(token, SECRET);
    expect(verified).toEqual(CLAIMS);
  });

  it("rejects a handoff token presented as a session token (audience check)", async () => {
    const token = await mintHandoffToken(CLAIMS, SECRET);
    await expect(verifySessionToken(token, SECRET)).rejects.toThrow();
  });

  it("rejects tokens signed with a different secret", async () => {
    const token = await mintHandoffToken(CLAIMS, SECRET);
    await expect(
      verifyHandoffToken(token, "another-secret-also-16-chars"),
    ).rejects.toThrow();
  });

  it("refuses to mint with a weak/missing secret", async () => {
    await expect(mintHandoffToken(CLAIMS, "short")).rejects.toThrow(
      /SANDBOX_JWT_SECRET/,
    );
  });

  it("buggyapi tokens round-trip, including the mode claim", async () => {
    const claims: SandboxClaims = { ...CLAIMS, mode: "bughunt" };
    const token = await mintHandoffToken(claims, SECRET, "buggyapi");
    const verified = await verifyHandoffToken(token, SECRET, "buggyapi");
    expect(verified).toEqual(claims);
  });

  it("rejects a buggyshop token presented to buggyapi (audience isolation)", async () => {
    const token = await mintHandoffToken(CLAIMS, SECRET);
    await expect(verifyHandoffToken(token, SECRET, "buggyapi")).rejects.toThrow();
  });

  it("default app stays buggyshop — pre-existing tokens keep verifying", async () => {
    const token = await mintHandoffToken(CLAIMS, SECRET, "buggyshop");
    const verified = await verifyHandoffToken(token, SECRET);
    expect(verified).toEqual(CLAIMS);
    expect(verified.mode).toBeUndefined();
  });

  it("rejects a token with a malformed mode claim", async () => {
    const bad = { ...CLAIMS, mode: "cheat" as unknown as SandboxClaims["mode"] };
    const token = await mintHandoffToken(bad, SECRET, "buggyapi");
    await expect(verifyHandoffToken(token, SECRET, "buggyapi")).rejects.toThrow(
      /Malformed/,
    );
  });
});

describe("sandbox token expiry", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("a handoff token dies after its 10-minute TTL", async () => {
    vi.useFakeTimers({ now: new Date("2026-07-10T12:00:00Z") });
    const token = await mintHandoffToken(CLAIMS, SECRET);
    // Still valid one minute before the deadline…
    vi.setSystemTime(new Date(Date.now() + (HANDOFF_TTL_SECONDS - 60) * 1000));
    await expect(verifyHandoffToken(token, SECRET)).resolves.toEqual(CLAIMS);
    // …dead one minute after it.
    vi.setSystemTime(new Date(Date.now() + 2 * 60 * 1000));
    await expect(verifyHandoffToken(token, SECRET)).rejects.toThrow(/exp/);
  });

  it("a session token dies after its 24-hour TTL", async () => {
    vi.useFakeTimers({ now: new Date("2026-07-10T12:00:00Z") });
    const token = await mintSessionToken(CLAIMS, SECRET);
    vi.setSystemTime(new Date(Date.now() + (SESSION_TTL_SECONDS + 60) * 1000));
    await expect(verifySessionToken(token, SECRET)).rejects.toThrow(/exp/);
  });
});
