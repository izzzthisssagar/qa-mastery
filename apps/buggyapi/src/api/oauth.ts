import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import { buggyapiDb } from "./db";
import type { AuthEnv } from "./auth";

/**
 * OAuth2 practice endpoints — deliberately-simplified but spec-shaped:
 *
 *  - client_credentials: POST /v1/oauth/token with client_id + client_secret
 *    (form body or HTTP Basic) → bao_ access token.
 *  - authorization_code: GET /v1/oauth/authorize 302-redirects back to
 *    redirect_uri with ?code=…&state=… (consent screen skipped on purpose —
 *    the flow mechanics are the lesson, not the UI), then the code is
 *    exchanged at POST /v1/oauth/token.
 *
 * Everything is fake by design (invariant 3): clients are seeded rows in a
 * deny-all schema; tokens grant access only to the learner's own sandbox.
 */

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1h — short enough to practice expiry
const CODE_TTL_MS = 5 * 60 * 1000;

const TokenRequestSchema = z
  .object({
    grant_type: z.enum(["client_credentials", "authorization_code"]).openapi({
      example: "client_credentials",
    }),
    client_id: z.string().optional().openapi({
      example: "tfc_…",
      description: "May also travel in an HTTP Basic Authorization header.",
    }),
    client_secret: z.string().optional().openapi({ example: "tfs_…" }),
    code: z.string().optional().openapi({
      description: "authorization_code grant only — the code from /v1/oauth/authorize.",
    }),
    redirect_uri: z.string().optional().openapi({
      description: "authorization_code grant only — must match the authorize request.",
    }),
    scope: z.string().optional().openapi({ example: "taskflight.read taskflight.write" }),
  })
  .openapi("OAuthTokenRequest");

// RFC 6749 §5.2 error shape — deliberately different from the API envelope;
// recognizing which spec governs which payload is part of the curriculum.
const OAuthErrorSchema = z
  .object({
    error: z.string().openapi({ example: "invalid_client" }),
    error_description: z.string().openapi({ example: "Client authentication failed." }),
  })
  .openapi("OAuthError");

const TokenResponseSchema = z
  .object({
    access_token: z.string().openapi({ example: "bao_9f3c…" }),
    token_type: z.literal("Bearer"),
    expires_in: z.number().int().openapi({ example: 3600 }),
    scope: z.string().openapi({ example: "taskflight.read taskflight.write" }),
  })
  .openapi("OAuthTokenResponse");

function oauthError(code: string, description: string) {
  // RFC 6749 §5.2 error shape — different from the API envelope on purpose;
  // recognizing which spec governs which payload is part of the curriculum.
  return { error: code, error_description: description };
}

export function registerOAuthRoutes(app: OpenAPIHono<AuthEnv>) {
  app.openapi(
    createRoute({
      method: "get",
      path: "/v1/oauth/authorize",
      tags: ["oauth"],
      summary: "Authorization endpoint (auth-code flow, consent auto-approved)",
      description:
        "Start the authorization_code flow. Responds `302 Found` to " +
        "`redirect_uri?code=…&state=…`. Test with `curl -v` and watch the Location header.",
      request: {
        query: z.object({
          response_type: z.literal("code").openapi({
            param: { name: "response_type", in: "query" },
            example: "code",
          }),
          client_id: z.string().openapi({ param: { name: "client_id", in: "query" } }),
          redirect_uri: z.string().openapi({ param: { name: "redirect_uri", in: "query" } }),
          state: z
            .string()
            .optional()
            .openapi({
              param: { name: "state", in: "query" },
              description: "Echoed back verbatim — verify it to prevent CSRF.",
            }),
        }),
      },
      responses: {
        302: { description: "Redirect to redirect_uri with ?code=…&state=…." },
        400: {
          description: "Unknown client or redirect_uri mismatch (RFC 6749 error shape).",
          content: { "application/json": { schema: OAuthErrorSchema } },
        },
      },
    }),
    async (c) => {
      const q = c.req.valid("query");
      const db = buggyapiDb();

      const { data: client } = await db
        .from("ba_oauth_clients")
        .select("sandbox_id, client_id, redirect_uri")
        .eq("client_id", q.client_id)
        .maybeSingle();
      if (!client) {
        return c.json(oauthError("invalid_client", "Unknown client_id."), 400);
      }
      if (client.redirect_uri && client.redirect_uri !== q.redirect_uri) {
        return c.json(
          oauthError("invalid_request", "redirect_uri does not match the registered value."),
          400,
        );
      }

      const code = "bac_" + crypto.randomUUID().replace(/-/g, "");
      await db.from("ba_auth_codes").insert({
        sandbox_id: client.sandbox_id,
        client_id: client.client_id,
        code,
        redirect_uri: q.redirect_uri,
        expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      });

      const target = new URL(q.redirect_uri);
      target.searchParams.set("code", code);
      if (q.state) target.searchParams.set("state", q.state);
      return c.redirect(target.toString(), 302);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/v1/oauth/token",
      tags: ["oauth"],
      summary: "Token endpoint — client_credentials & authorization_code",
      description:
        "Exchange client credentials (form body or HTTP Basic) or an authorization code " +
        "for a `bao_` Bearer access token. Errors use the RFC 6749 shape " +
        "(`{error, error_description}`), not the API envelope — spot the difference.",
      request: {
        body: {
          content: {
            "application/x-www-form-urlencoded": { schema: TokenRequestSchema },
            "application/json": { schema: TokenRequestSchema },
          },
        },
      },
      responses: {
        200: {
          description: "Access token issued.",
          content: { "application/json": { schema: TokenResponseSchema } },
        },
        400: {
          description: "invalid_grant / invalid_request (RFC 6749 shape).",
          content: { "application/json": { schema: OAuthErrorSchema } },
        },
        401: {
          description: "invalid_client (RFC 6749 shape).",
          content: { "application/json": { schema: OAuthErrorSchema } },
        },
      },
    }),
    async (c) => {
      // Both content types are declared on the route, so the zod-openapi
      // validator has already parsed + validated whichever one arrived —
      // re-reading the raw body here would throw (stream already consumed).
      const contentType = c.req.header("content-type") ?? "";
      const body = contentType.includes("json") ? c.req.valid("json") : c.req.valid("form");

      // client_id/secret can come Basic-encoded (RFC 6749 §2.3.1) or in the body.
      let clientId = body.client_id;
      let clientSecret = body.client_secret;
      const authHeader = c.req.header("authorization") ?? "";
      if (authHeader.toLowerCase().startsWith("basic ")) {
        try {
          const decoded = atob(authHeader.slice(6).trim());
          const sep = decoded.indexOf(":");
          clientId = decodeURIComponent(decoded.slice(0, sep));
          clientSecret = decodeURIComponent(decoded.slice(sep + 1));
        } catch {
          return c.json(oauthError("invalid_client", "Malformed Basic client credentials."), 401);
        }
      }
      if (!clientId || !clientSecret) {
        return c.json(oauthError("invalid_client", "Missing client credentials."), 401);
      }

      const db = buggyapiDb();
      const { data: client } = await db
        .from("ba_oauth_clients")
        .select("sandbox_id, client_id, client_secret")
        .eq("client_id", clientId)
        .maybeSingle();
      if (!client || client.client_secret !== clientSecret) {
        return c.json(oauthError("invalid_client", "Client authentication failed."), 401);
      }

      if (body.grant_type === "authorization_code") {
        if (!body.code || !body.redirect_uri) {
          return c.json(
            oauthError("invalid_request", "authorization_code grant needs code + redirect_uri."),
            400,
          );
        }
        const { data: codeRow } = await db
          .from("ba_auth_codes")
          .select("id, client_id, redirect_uri, used, expires_at")
          .eq("code", body.code)
          .maybeSingle();
        if (!codeRow || codeRow.client_id !== client.client_id) {
          return c.json(oauthError("invalid_grant", "Unknown authorization code."), 400);
        }
        if (codeRow.used) {
          return c.json(oauthError("invalid_grant", "Authorization code already used."), 400);
        }
        if (new Date(codeRow.expires_at).getTime() < Date.now()) {
          return c.json(oauthError("invalid_grant", "Authorization code expired."), 400);
        }
        if (codeRow.redirect_uri !== body.redirect_uri) {
          return c.json(oauthError("invalid_grant", "redirect_uri mismatch."), 400);
        }
        await db.from("ba_auth_codes").update({ used: true }).eq("id", codeRow.id);
      }

      const scope = body.scope ?? "taskflight.read taskflight.write";
      const token = "bao_" + crypto.randomUUID().replace(/-/g, "");
      const { error } = await db.from("ba_oauth_tokens").insert({
        sandbox_id: client.sandbox_id,
        client_id: client.client_id,
        token,
        scope,
        expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
      });
      if (error) {
        return c.json(oauthError("server_error", "Could not issue token."), 400);
      }

      return c.json(
        {
          access_token: token,
          token_type: "Bearer" as const,
          expires_in: TOKEN_TTL_MS / 1000,
          scope,
        },
        200,
      );
    },
  );
}
