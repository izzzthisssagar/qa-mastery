import { jwtVerify } from "jose";

/**
 * Verifies a BuggyAPI sandbox *session* token (the one /enter stores in
 * localStorage). Mirrors packages/shared/src/sandbox-token.ts verify() for the
 * "buggyapi-session" audience — duplicated on purpose: this service deploys as
 * a self-contained Docker image on Fly.io, and jose-only verification keeps the
 * image free of the monorepo build graph. Any change to the token contract in
 * packages/shared must be mirrored here (same ISSUER/audience/claims).
 */

const ISSUER = "qa-mastery-platform";
const AUDIENCE = "buggyapi-session";

export interface WsClaims {
  userId: string;
  sandboxId: string;
  release: string;
  mode?: "clean" | "bughunt";
}

export async function verifyWsToken(token: string, secret: string): Promise<WsClaims> {
  if (!secret || secret.length < 16) {
    throw new Error("SANDBOX_JWT_SECRET must be set and at least 16 chars");
  }
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  const sub = payload.sub;
  const sbx = payload.sbx;
  const rel = payload.rel;
  const mode = payload.mode;
  if (typeof sub !== "string" || typeof sbx !== "string" || typeof rel !== "string") {
    throw new Error("Malformed sandbox token payload");
  }
  if (mode !== undefined && mode !== "clean" && mode !== "bughunt") {
    throw new Error("Malformed sandbox token payload");
  }
  return {
    userId: sub,
    sandboxId: sbx,
    release: rel,
    ...(mode !== undefined ? { mode } : {}),
  };
}
