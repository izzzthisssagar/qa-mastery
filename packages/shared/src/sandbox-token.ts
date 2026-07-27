import { SignJWT, jwtVerify } from "jose";
import { isRelease, type Release } from "./releases";

/**
 * Sandbox session handoff between the platform and its practice apps
 * (BuggyShop, BuggyAPI).
 *
 * Two token kinds, same secret, different audiences:
 *  - handoff token: minted by the platform, 10-min TTL, travels in the URL
 *    fragment of /enter#t=… (fragments never reach server logs/referrers).
 *  - session token: minted by the practice app's /api/session in exchange for
 *    a valid handoff token, 24h TTL, stored in localStorage, sent on every
 *    API call.
 *
 * Audiences are parameterized per app (`${app}-handoff` / `${app}-session`);
 * the default stays "buggyshop", so tokens minted before BuggyAPI existed keep
 * verifying unchanged.
 *
 * Cookie-free on purpose: survives Safari ITP in a cross-origin iframe and
 * works unchanged inside a future Capacitor webview.
 */

const ISSUER = "qa-mastery-platform";

/** Practice apps that accept a sandbox handoff. */
export type SandboxApp = "buggyshop" | "buggyapi";
const DEFAULT_APP: SandboxApp = "buggyshop";

/** BuggyAPI serves a perfect reference API in "clean" and seeds bugs in "bughunt". */
export type SandboxMode = "clean" | "bughunt";

export function isSandboxMode(value: unknown): value is SandboxMode {
  return value === "clean" || value === "bughunt";
}

export const HANDOFF_TTL_SECONDS = 10 * 60;
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

export interface SandboxClaims {
  /** Platform user id (auth.users.id). */
  userId: string;
  /** public.sandboxes.id — scopes every practice-app (bs_*, ba_*) row. */
  sandboxId: string;
  /** Highest BuggyShop release this learner has unlocked. */
  release: Release;
  /** BuggyAPI only: clean reference API vs seeded bug-hunt. Absent for BuggyShop. */
  mode?: SandboxMode;
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
  return new SignJWT({
    sbx: claims.sandboxId,
    rel: claims.release,
    // Only stamped when present (BuggyAPI); BuggyShop tokens stay byte-compatible.
    ...(claims.mode ? { mode: claims.mode } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(secretKey(secret));
}

async function verify(token: string, secret: string, audience: string): Promise<SandboxClaims> {
  const { payload } = await jwtVerify(token, secretKey(secret), {
    issuer: ISSUER,
    audience,
  });
  const sub = payload.sub;
  const sbx = payload.sbx;
  const rel = payload.rel;
  const mode = payload.mode;
  if (
    typeof sub !== "string" ||
    typeof sbx !== "string" ||
    typeof rel !== "string" ||
    !isRelease(rel) ||
    (mode !== undefined && !isSandboxMode(mode))
  ) {
    throw new Error("Malformed sandbox token payload");
  }
  return {
    userId: sub,
    sandboxId: sbx,
    release: rel,
    ...(isSandboxMode(mode) ? { mode } : {}),
  };
}

export function mintHandoffToken(
  claims: SandboxClaims,
  secret: string,
  app: SandboxApp = DEFAULT_APP,
): Promise<string> {
  return mint(claims, secret, `${app}-handoff`, HANDOFF_TTL_SECONDS);
}

export function verifyHandoffToken(
  token: string,
  secret: string,
  app: SandboxApp = DEFAULT_APP,
): Promise<SandboxClaims> {
  return verify(token, secret, `${app}-handoff`);
}

export function mintSessionToken(
  claims: SandboxClaims,
  secret: string,
  app: SandboxApp = DEFAULT_APP,
): Promise<string> {
  return mint(claims, secret, `${app}-session`, SESSION_TTL_SECONDS);
}

export function verifySessionToken(
  token: string,
  secret: string,
  app: SandboxApp = DEFAULT_APP,
): Promise<SandboxClaims> {
  return verify(token, secret, `${app}-session`);
}
