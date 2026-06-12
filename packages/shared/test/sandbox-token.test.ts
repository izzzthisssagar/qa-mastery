import { describe, expect, it } from "vitest";
import {
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
});
