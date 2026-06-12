import { SignJWT, jwtVerify } from "jose";
import { isRelease, type Release } from "./releases";

/**
 * Sandbox session handoff between the platform and BuggyShop.
 *
 * Two token kinds, same secret, different audiences:
 *  - handoff token: minted by the platform, 10-min TTL, travels in the URL
 *    fragment of /enter#t=… (fragments never reach server logs/referrers).
 *  - session token: minted by BuggyShop's /api/session in exchange for a valid
 *    handoff token, 24h TTL, stored in localStorage, sent on every API call.
 *
 * Cookie-free on purpose: survives Safari ITP in a cross-origin iframe and
 * works unchanged inside a future Capacitor webview.
 */

const ISSUER = "qa-mastery-platform";
const HANDOFF_AUDIENCE = "buggyshop-handoff";
const SESSION_AUDIENCE = "buggyshop-session";

export const HANDOFF_TTL_SECONDS = 10 * 60;
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

export interface SandboxClaims {
  /** Platform user id (auth.users.id). */
  userId: string;
  /** public.sandboxes.id — scopes every bs_* row. */
  sandboxId: string;
  /** Highest BuggyShop release this learner has unlocked. */
  release: Release;
}

function secretKey(secret: string): Uint8Array {
  if (!secret || secret.length < 16) {
    throw new Error("SANDBOX_JWT_SECRET must be set and at least 16 chars");
  }
  return new TextEncoder().encode(secret);
}

async function mint(
  claims: SandboxClaims,
  secret: string,
  audience: string,
  ttlSeconds: number,
): Promise<string> {
  return new SignJWT({ sbx: claims.sandboxId, rel: claims.release })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(secretKey(secret));
}

async function verify(
  token: string,
  secret: string,
  audience: string,
): Promise<SandboxClaims> {
  const { payload } = await jwtVerify(token, secretKey(secret), {
    issuer: ISSUER,
    audience,
  });
  const sub = payload.sub;
  const sbx = payload.sbx;
  const rel = payload.rel;
  if (
    typeof sub !== "string" ||
    typeof sbx !== "string" ||
    typeof rel !== "string" ||
    !isRelease(rel)
  ) {
    throw new Error("Malformed sandbox token payload");
  }
  return { userId: sub, sandboxId: sbx, release: rel };
}

export function mintHandoffToken(claims: SandboxClaims, secret: string): Promise<string> {
  return mint(claims, secret, HANDOFF_AUDIENCE, HANDOFF_TTL_SECONDS);
}

export function verifyHandoffToken(token: string, secret: string): Promise<SandboxClaims> {
  return verify(token, secret, HANDOFF_AUDIENCE);
}

export function mintSessionToken(claims: SandboxClaims, secret: string): Promise<string> {
  return mint(claims, secret, SESSION_AUDIENCE, SESSION_TTL_SECONDS);
}

export function verifySessionToken(token: string, secret: string): Promise<SandboxClaims> {
  return verify(token, secret, SESSION_AUDIENCE);
}
