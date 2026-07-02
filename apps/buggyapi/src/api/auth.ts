import type { Context, Next } from "hono";
import { buggyapiDb } from "./db";

/**
 * Sandbox + identity resolution for every /v1 endpoint. Three schemes, checked
 * in order — each one is a curriculum subject:
 *
 *  1. `X-API-Key: bak_…`       — key row itself carries the sandbox (globally
 *                                 unique), the way most SaaS APIs work.
 *  2. `Authorization: Bearer`  — opaque session token from POST /v1/auth/login.
 *  3. `Authorization: Basic` + `X-Sandbox-Id` — classic Basic auth; the sandbox
 *     header plays the "tenant id" role real multi-tenant APIs require.
 *
 * On success the context carries { sandboxId, actor }. All error payloads use
 * the API-wide envelope { error: { code, message } } so learners can assert on
 * a stable contract.
 */

export interface Actor {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  via: "api_key" | "bearer" | "basic";
}

export interface AuthEnv {
  Variables: {
    sandboxId: string;
    actor: Actor;
  };
}

export function unauthorized(c: Context, message: string) {
  c.header("WWW-Authenticate", 'Basic realm="TaskFlight", charset="UTF-8"');
  return c.json({ error: { code: "unauthorized", message } }, 401);
}

export async function authMiddleware(c: Context, next: Next) {
  const db = buggyapiDb();

  // 1) API key
  const apiKey = c.req.header("x-api-key");
  if (apiKey) {
    const { data } = await db
      .from("ba_api_keys")
      .select("sandbox_id, revoked, ba_users:ba_user_id (id, name, email, role)")
      .eq("key", apiKey)
      .maybeSingle();
    if (!data || data.revoked) {
      return unauthorized(c, "Invalid or revoked API key.");
    }
    const user = data.ba_users as unknown as {
      id: string;
      name: string;
      email: string;
      role: "admin" | "member";
    };
    c.set("sandboxId", data.sandbox_id);
    c.set("actor", { ...user, via: "api_key" satisfies Actor["via"] });
    return next();
  }

  const authHeader = c.req.header("authorization") ?? "";

  // 2) Bearer session token
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    const { data } = await db
      .from("ba_sessions")
      .select("sandbox_id, expires_at, ba_users:ba_user_id (id, name, email, role)")
      .eq("token", token)
      .maybeSingle();
    if (!data) return unauthorized(c, "Invalid bearer token.");
    if (new Date(data.expires_at).getTime() < Date.now()) {
      return unauthorized(c, "Bearer token expired — log in again at POST /v1/auth/login.");
    }
    const user = data.ba_users as unknown as {
      id: string;
      name: string;
      email: string;
      role: "admin" | "member";
    };
    c.set("sandboxId", data.sandbox_id);
    c.set("actor", { ...user, via: "bearer" satisfies Actor["via"] });
    return next();
  }

  // 3) Basic + X-Sandbox-Id (tenant header)
  if (authHeader.toLowerCase().startsWith("basic ")) {
    const sandboxId = c.req.header("x-sandbox-id");
    if (!sandboxId) {
      return unauthorized(
        c,
        "Basic auth needs the X-Sandbox-Id header (your sandbox id — shown on the BuggyAPI home page).",
      );
    }
    let email = "";
    let password = "";
    try {
      const decoded = atob(authHeader.slice(6).trim());
      const sep = decoded.indexOf(":");
      email = decoded.slice(0, sep);
      password = decoded.slice(sep + 1);
    } catch {
      return unauthorized(c, "Malformed Basic credentials.");
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
      return unauthorized(c, "Wrong email or password.");
    }
    c.set("sandboxId", sandboxId);
    c.set("actor", {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as Actor["role"],
      via: "basic" satisfies Actor["via"],
    });
    return next();
  }

  return unauthorized(
    c,
    "Authenticate with X-API-Key, a Bearer token (POST /v1/auth/login), or Basic auth + X-Sandbox-Id.",
  );
}
