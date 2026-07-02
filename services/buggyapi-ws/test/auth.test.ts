import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { verifyWsToken } from "../src/auth.js";

const SECRET = "test-secret-at-least-16-chars-long";

function mint(opts: {
  secret?: string;
  audience?: string;
  issuer?: string;
  mode?: string;
  expired?: boolean;
}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    sbx: "sandbox-456",
    rel: "1.0",
    ...(opts.mode ? { mode: opts.mode } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("user-123")
    .setIssuer(opts.issuer ?? "qa-mastery-platform")
    .setAudience(opts.audience ?? "buggyapi-session")
    .setIssuedAt(opts.expired ? now - 7200 : now)
    .setExpirationTime(opts.expired ? now - 3600 : now + 3600)
    .sign(new TextEncoder().encode(opts.secret ?? SECRET));
}

describe("buggyapi-ws token verification", () => {
  it("accepts a valid buggyapi session token", async () => {
    const claims = await verifyWsToken(await mint({}), SECRET);
    expect(claims).toEqual({ userId: "user-123", sandboxId: "sandbox-456", release: "1.0" });
  });

  it("carries the mode claim through", async () => {
    const claims = await verifyWsToken(await mint({ mode: "bughunt" }), SECRET);
    expect(claims.mode).toBe("bughunt");
  });

  it("rejects a buggyshop-audience token (isolation)", async () => {
    const token = await mint({ audience: "buggyshop-session" });
    await expect(verifyWsToken(token, SECRET)).rejects.toThrow();
  });

  it("rejects a buggyapi HANDOFF token (wrong kind)", async () => {
    const token = await mint({ audience: "buggyapi-handoff" });
    await expect(verifyWsToken(token, SECRET)).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    const token = await mint({ expired: true });
    await expect(verifyWsToken(token, SECRET)).rejects.toThrow();
  });

  it("rejects the wrong secret", async () => {
    const token = await mint({ secret: "another-secret-also-16-chars" });
    await expect(verifyWsToken(token, SECRET)).rejects.toThrow();
  });

  it("rejects a malformed mode claim", async () => {
    const token = await mint({ mode: "cheat" });
    await expect(verifyWsToken(token, SECRET)).rejects.toThrow(/Malformed/);
  });
});
