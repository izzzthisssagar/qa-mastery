import type { Context, Next } from "hono";
import { buggyapiDb } from "./db";

/**
 * Sandbox + identity resolution shared by every BuggyAPI surface (REST,
 * GraphQL, SOAP). Four schemes, checked in order — each one is a curriculum
 * subject:
 *
 *  1. `X-API-Key: bak_…`         — key row itself carries the sandbox (globally
 *                                   unique), the way most SaaS APIs work.
 *  2. `Authorization: Bearer bao_…` — OAuth2 access token (client_credentials /
 *                                   authorization_code, POST /v1/oauth/token).
 *  3. `Authorization: Bearer bas_…` — opaque user session from POST /v1/auth/login.
 *  4. `Authorization: Basic` + `X-Sandbox-Id` — classic Basic auth; the sandbox
 *     header plays the "tenant id" role real multi-tenant APIs require.
 *
 * All error payloads use the API-wide envelope { error: { code, message } }.
 */

export interface Actor {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  via: "api_key" | "bearer" | "basic" | "oauth";
  /** OAuth only — granted scopes. */
  scope?: string;
}

export interface AuthEnv {
  Variables: {
    sandboxId: string;
    actor: Actor;
  };
}

export type AuthResult =
  | { ok: true; sandboxId: string; actor: Actor }
  | { ok: false; message: string };

type HeaderGetter = (name: string) => string | null | undefined;

/** Transport-agnostic auth core — REST middleware, GraphQL context, and the
 *  SOAP endpoint all call this with their own header accessor. */
export async function resolveAuth(getHeader: HeaderGetter): Promise<AuthResult> {
  const db = buggyapiDb();

  // 1) API key
  const apiKey = getHeader("x-api-key");
  if (apiKey) {
    const { data } = await db
      .from("ba_api_keys")
      .select("sandbox_id, revoked, ba_users:ba_user_id (id, name, email, role)")
      .eq("key", apiKey)
      .maybeSingle();
    if (!data || data.revoked) {
      return { ok: false, message: "Invalid or revoked API key." };
    }
    const user = data.ba_users as unknown as {
      id: string;
      name: string;
      email: string;
      role: "admin" | "member";
    };
    return { ok: true, sandboxId: data.sandbox_id, actor: { ...user, via: "api_key" } };
  }

  const authHeader = getHeader("authorization") ?? "";

  // 2 + 3) Bearer — OAuth access token (bao_) or user session (bas_)
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();

    if (token.startsWith("bao_")) {
      const { data } = await db
        .from("ba_oauth_tokens")
        .select("sandbox_id, client_id, scope, expires_at")
        .eq("token", token)
        .maybeSingle();
      if (!data) return { ok: false, message: "Invalid OAuth access token." };
      if (new Date(data.expires_at).getTime() < Date.now()) {
        return { ok: false, message: "OAuth access token expired — request a new one at POST /v1/oauth/token." };
      }
      return {
        ok: true,
        sandboxId: data.sandbox_id,
        actor: {
          id: data.client_id,
          name: `OAuth client ${data.client_id}`,
          email: `${data.client_id}@oauth.taskflight.test`,
          role: data.scope.includes("taskflight.write") ? "admin" : "member",
          via: "oauth",
          scope: data.scope,
        },
      };
    }

    const { data } = await db
      .from("ba_sessions")
      .select("sandbox_id, expires_at, ba_users:ba_user_id (id, name, email, role)")
      .eq("token", token)
      .maybeSingle();
    if (!data) return { ok: false, message: "Invalid bearer token." };
    if (new Date(data.expires_at).getTime() < Date.now()) {
      return { ok: false, message: "Bearer token expired — log in again at POST /v1/auth/login." };
    }
    const user = data.ba_users as unknown as {
      id: string;
      name: string;
      email: string;
      role: "admin" | "member";
    };
    return { ok: true, sandboxId: data.sandbox_id, actor: { ...user, via: "bearer" } };
  }

  // 4) Basic + X-Sandbox-Id (tenant header)
  if (authHeader.toLowerCase().startsWith("basic ")) {
    const sandboxId = getHeader("x-sandbox-id");
    if (!sandboxId) {
      return {
        ok: false,
        message:
          "Basic auth needs the X-Sandbox-Id header (your sandbox id — shown on the BuggyAPI home page).",
      };
    }
    let email = "";
    let password = "";
    try {
      const decoded = atob(authHeader.slice(6).trim());
      const sep = decoded.indexOf(":");
      email = decoded.slice(0, sep);
      password = decoded.slice(sep + 1);
    } catch {
      return { ok: false, message: "Malformed Basic credentials." };
    }
    const { data } = await db
      .from("ba_users")
      .select("id, name, email, role, password")
      .eq("sandbox_id", sandboxId)
      .eq("email", email)
      .maybeSingle();
    // Fake practice creds compared in plaintext BY DESIGN — deny-all schema,
    // seeded values, nothing real to protect (invariant 3).
    if (!data || data.password !== password) {
      return { ok: false, message: "Wrong email or password." };
    }
    return {
      ok: true,
      sandboxId,
      actor: {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as Actor["role"],
        via: "basic",
      },
    };
  }

  return {
    ok: false,
    message:
      "Authenticate with X-API-Key, a Bearer token (POST /v1/auth/login or /v1/oauth/token), or Basic auth + X-Sandbox-Id.",
  };
}

export function unauthorized(c: Context, message: string) {
  c.header("WWW-Authenticate", 'Basic realm="TaskFlight", charset="UTF-8"');
  return c.json({ error: { code: "unauthorized", message } }, 401);
}

export async function authMiddleware(c: Context, next: Next) {
  const result = await resolveAuth((name) => c.req.header(name));
  if (!result.ok) return unauthorized(c, result.message);
  c.set("sandboxId", result.sandboxId);
  c.set("actor", result.actor);
  return next();
}
