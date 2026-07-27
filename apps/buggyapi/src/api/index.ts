import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { authMiddleware, unauthorized, type AuthEnv } from "./auth";
import { buggyapiDb } from "./db";
import { registerOAuthRoutes } from "./oauth";
import { registerAttachmentRoutes } from "./attachments";
import { checkRateLimit, WRITE_RULE } from "./rate-limit";
import { apiBugFlag, sandboxMode } from "./bugs";
import {
  ErrorSchema,
  IdParam,
  LoginRequestSchema,
  LoginResponseSchema,
  MeSchema,
  ProjectCreateSchema,
  ProjectSchema,
  ProjectUpdateSchema,
  TicketCreateSchema,
  TicketListQuerySchema,
  TicketListSchema,
  TicketSchema,
  TicketUpdateSchema,
} from "./schemas";

/**
 * TaskFlight — the BuggyAPI practice REST API (v1).
 *
 * Every endpoint is defined via zod schemas, so the OpenAPI 3.1 spec at
 * /api/v1/openapi.json is generated from the same source the runtime
 * validates against — the docs can't drift from the behavior.
 *
 * Clean mode (Phase 1a) serves a correct reference API. Bug-hunt mode
 * (Phase 1d) will seed deliberate contract violations behind bugFlag().
 */

const SECURITY: Array<Record<string, string[]>> = [
  { ApiKeyAuth: [] },
  { BearerAuth: [] },
  { BasicAuth: [] },
];

function errorJson(code: string, message: string) {
  return { error: { code, message } };
}

const app = new OpenAPIHono<AuthEnv>({
  // Consistent 422 envelope for validation failures — a teachable contract.
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            code: "validation_failed",
            message: "Request failed validation — see details.",
            details: { issues: result.error.issues },
          },
        },
        422,
      );
    }
  },
}).basePath("/api");

app.openAPIRegistry.registerComponent("securitySchemes", "ApiKeyAuth", {
  type: "apiKey",
  in: "header",
  name: "X-API-Key",
  description: "Your sandbox API key (starts with `bak_`). Shown on the BuggyAPI home page.",
});
app.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  description: "Opaque token from POST /v1/auth/login.",
});
app.openAPIRegistry.registerComponent("securitySchemes", "BasicAuth", {
  type: "http",
  scheme: "basic",
  description:
    "Seeded user email:password. Requires the X-Sandbox-Id header (multi-tenant pattern).",
});

// Auth guard for everything under /v1 except login, OAuth endpoints (they
// authenticate the CLIENT themselves), and the spec.
app.use("/v1/*", async (c, next) => {
  const path = c.req.path;
  if (
    path.endsWith("/v1/auth/login") ||
    path.includes("/v1/oauth/") ||
    path.endsWith("/v1/openapi.json")
  ) {
    return next();
  }
  return authMiddleware(c, next);
});

// Write budget: 30 mutations/min per sandbox → real 429s with Retry-After.
// Runs after auth (needs sandboxId); reads/auth/oauth are never limited.
app.use("/v1/*", async (c, next) => {
  if (["POST", "PATCH", "PUT", "DELETE"].includes(c.req.method)) {
    const path = c.req.path;
    if (!path.includes("/v1/oauth/") && !path.endsWith("/v1/auth/login")) {
      const limited = await checkRateLimit(c, c.get("sandboxId"), WRITE_RULE);
      if (limited) return limited;
    }
  }
  return next();
});

// ── auth ──────────────────────────────────────────────────────────────────

app.openapi(
  createRoute({
    method: "post",
    path: "/v1/auth/login",
    tags: ["auth"],
    summary: "Log in with a seeded user → bearer token",
    description:
      "Exchange a seeded user's email + password for a 24h opaque bearer token. " +
      "Requires the `X-Sandbox-Id` header (your sandbox id — the tenant you log into).",
    request: {
      headers: z.object({
        "x-sandbox-id": z.uuid().openapi({
          param: { name: "x-sandbox-id", in: "header" },
          description: "Your sandbox id (shown on the BuggyAPI home page).",
        }),
      }),
      body: { content: { "application/json": { schema: LoginRequestSchema } } },
    },
    responses: {
      200: {
        description: "Logged in.",
        content: { "application/json": { schema: LoginResponseSchema } },
      },
      401: {
        description: "Wrong credentials.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      422: {
        description: "Validation failed.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal error.",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const sandboxId = c.req.valid("header")["x-sandbox-id"];
    const { email, password } = c.req.valid("json");
    const db = buggyapiDb();

    const { data: user } = await db
      .from("ba_users")
      .select("id, password")
      .eq("sandbox_id", sandboxId)
      .eq("email", email)
      .maybeSingle();
    if (!user || user.password !== password) {
      return unauthorized(c, "Wrong email or password.");
    }

    const token = "bas_" + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await db.from("ba_sessions").insert({
      sandbox_id: sandboxId,
      ba_user_id: user.id,
      token,
      expires_at: expiresAt,
    });
    if (error) {
      return c.json(errorJson("internal", "Could not create session."), 500);
    }
    return c.json({ token, token_type: "bearer" as const, expires_at: expiresAt }, 200);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/me",
    tags: ["auth"],
    summary: "Who am I?",
    description: "Returns the authenticated principal — handy for verifying each auth scheme.",
    security: SECURITY,
    responses: {
      200: { description: "You.", content: { "application/json": { schema: MeSchema } } },
      401: {
        description: "Not authenticated.",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  (c) => {
    const actor = c.get("actor");
    return c.json(
      {
        id: actor.id,
        name: actor.name,
        email: actor.email,
        role: actor.role,
        authenticated_via: actor.via,
        sandbox_id: c.get("sandboxId"),
      },
      200,
    );
  },
);

// ── projects ──────────────────────────────────────────────────────────────

const projectRow = "id, key, name, description, status, created_at, updated_at";

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/projects",
    tags: ["projects"],
    summary: "List projects",
    security: SECURITY,
    responses: {
      200: {
        description: "All projects in your sandbox.",
        content: { "application/json": { schema: z.array(ProjectSchema) } },
      },
      401: {
        description: "Not authenticated.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal error.",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { data, error } = await buggyapiDb()
      .from("ba_projects")
      .select(projectRow)
      .eq("sandbox_id", c.get("sandboxId"))
      .order("created_at", { ascending: true });
    if (error) return c.json(errorJson("internal", error.message), 500);
    return c.json(data ?? [], 200);
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/v1/projects",
    tags: ["projects"],
    summary: "Create a project",
    security: SECURITY,
    request: { body: { content: { "application/json": { schema: ProjectCreateSchema } } } },
    responses: {
      201: { description: "Created.", content: { "application/json": { schema: ProjectSchema } } },
      401: {
        description: "Not authenticated.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      409: {
        description: "Project key already exists in your sandbox.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      422: {
        description: "Validation failed.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal error.",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const { data, error } = await buggyapiDb()
      .from("ba_projects")
      .insert({
        sandbox_id: c.get("sandboxId"),
        key: body.key,
        name: body.name,
        description: body.description ?? null,
      })
      .select(projectRow)
      .single();
    if (error) {
      if (error.code === "23505") {
        return c.json(errorJson("conflict", `Project key "${body.key}" already exists.`), 409);
      }
      return c.json(errorJson("internal", error.message), 500);
    }
    return c.json(data, 201);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/projects/{id}",
    tags: ["projects"],
    summary: "Get a project",
    security: SECURITY,
    request: { params: IdParam },
    responses: {
      200: {
        description: "The project.",
        content: { "application/json": { schema: ProjectSchema } },
      },
      401: {
        description: "Not authenticated.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "No such project.",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const { data } = await buggyapiDb()
      .from("ba_projects")
      .select(projectRow)
      .eq("sandbox_id", c.get("sandboxId"))
      .eq("id", id)
      .maybeSingle();
    if (!data) return c.json(errorJson("not_found", `Project ${id} does not exist.`), 404);
    return c.json(data, 200);
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/v1/projects/{id}",
    tags: ["projects"],
    summary: "Update a project",
    security: SECURITY,
    request: {
      params: IdParam,
      body: { content: { "application/json": { schema: ProjectUpdateSchema } } },
    },
    responses: {
      200: { description: "Updated.", content: { "application/json": { schema: ProjectSchema } } },
      401: {
        description: "Not authenticated.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "No such project.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      422: {
        description: "Validation failed.",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const { data } = await buggyapiDb()
      .from("ba_projects")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("sandbox_id", c.get("sandboxId"))
      .eq("id", id)
      .select(projectRow)
      .maybeSingle();
    if (!data) return c.json(errorJson("not_found", `Project ${id} does not exist.`), 404);
    return c.json(data, 200);
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/v1/projects/{id}",
    tags: ["projects"],
    summary: "Delete a project (and its tickets)",
    security: SECURITY,
    request: { params: IdParam },
    responses: {
      204: { description: "Deleted — no body, on purpose." },
      401: {
        description: "Not authenticated.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "No such project.",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const { data } = await buggyapiDb()
      .from("ba_projects")
      .delete()
      .eq("sandbox_id", c.get("sandboxId"))
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (!data) return c.json(errorJson("not_found", `Project ${id} does not exist.`), 404);
    return c.body(null, 204);
  },
);

// ── tickets ───────────────────────────────────────────────────────────────

const ticketRow =
  "id, project_id, number, title, description, status, priority, assignee_id, labels, due_date, created_at, updated_at, ba_projects!inner(key)";

// TECH_DEBT: `row` is an untyped Supabase select() result with a joined
// ba_projects row; no generated row type for this shape yet. Tracked by
// docs/superpowers/plans/2026-07-26-release-repository-governance.md Task 5.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTicket(row: any) {
  const { ba_projects, ...rest } = row;
  return { ...rest, ref: `${ba_projects.key}-${row.number}` };
}

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/tickets",
    tags: ["tickets"],
    summary: "List tickets — pagination, filtering, sorting",
    description:
      "The workhorse endpoint for API-testing practice: page through results, combine filters, " +
      "flip sort order, and check the `X-Total-Count` header against the body's `total`.",
    security: SECURITY,
    request: { query: TicketListQuerySchema },
    responses: {
      200: {
        description: "A page of tickets.",
        content: { "application/json": { schema: TicketListSchema } },
        headers: z.object({
          "X-Total-Count": z.string().openapi({ description: "Total matching tickets." }),
        }),
      },
      401: {
        description: "Not authenticated.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      422: {
        description: "Validation failed.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal error.",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const q = c.req.valid("query");
    const mode = await sandboxMode(c.get("sandboxId"));
    let query = buggyapiDb()
      .from("ba_tickets")
      .select(ticketRow, { count: "exact" })
      .eq("sandbox_id", c.get("sandboxId"));

    // BA-003 (bug-hunt): status silently dropped when combined with priority.
    const dropStatus = apiBugFlag("BA-003", mode) && !!q.status && !!q.priority;
    if (q.status && !dropStatus) query = query.eq("status", q.status);
    if (q.priority) query = query.eq("priority", q.priority);
    if (q.project_id) query = query.eq("project_id", q.project_id);
    if (q.label) query = query.contains("labels", [q.label]);
    if (q.q) query = query.ilike("title", `%${q.q}%`);

    const from = (q.page - 1) * q.per_page;
    const { data, count, error } = await query
      .order(q.sort, { ascending: q.order === "asc" })
      .range(from, from + q.per_page - 1);
    if (error) return c.json(errorJson("internal", error.message), 500);

    const total = count ?? 0;
    // BA-001 (bug-hunt): floor instead of ceil — the last partial page vanishes.
    const totalPages = apiBugFlag("BA-001", mode)
      ? Math.max(1, Math.floor(total / q.per_page))
      : Math.max(1, Math.ceil(total / q.per_page));
    c.header("X-Total-Count", String(total));
    return c.json(
      {
        data: (data ?? []).map(toTicket),
        page: q.page,
        per_page: q.per_page,
        total,
        total_pages: totalPages,
      },
      200,
    );
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/v1/tickets",
    tags: ["tickets"],
    summary: "Create a ticket",
    security: SECURITY,
    request: { body: { content: { "application/json": { schema: TicketCreateSchema } } } },
    responses: {
      201: { description: "Created.", content: { "application/json": { schema: TicketSchema } } },
      401: {
        description: "Not authenticated.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "project_id doesn't exist in your sandbox.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      422: {
        description: "Validation failed.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal error.",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const db = buggyapiDb();
    const sandboxId = c.get("sandboxId");

    const { data: project } = await db
      .from("ba_projects")
      .select("id, key")
      .eq("sandbox_id", sandboxId)
      .eq("id", body.project_id)
      .maybeSingle();
    if (!project) {
      return c.json(errorJson("not_found", `Project ${body.project_id} does not exist.`), 404);
    }

    // Next per-project number. A racing duplicate hits the unique(project_id,
    // number) constraint and 500s — acceptable for a single-learner sandbox.
    const { data: last } = await db
      .from("ba_tickets")
      .select("number")
      .eq("project_id", project.id)
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await db
      .from("ba_tickets")
      .insert({
        sandbox_id: sandboxId,
        project_id: project.id,
        number: (last?.number ?? 0) + 1,
        title: body.title,
        description: body.description ?? null,
        status: body.status ?? "open",
        priority: body.priority ?? "medium",
        assignee_id: body.assignee_id ?? null,
        labels: body.labels ?? [],
        due_date: body.due_date ?? null,
      })
      .select(ticketRow)
      .single();
    if (error) return c.json(errorJson("internal", error.message), 500);
    // BA-002 (bug-hunt): 200 instead of 201 — a deliberate contract violation,
    // so the runtime status is cast past the 201 the spec declares.
    const createdStatus = (apiBugFlag("BA-002", await sandboxMode(sandboxId)) ? 200 : 201) as 201;
    return c.json(toTicket(data), createdStatus);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/tickets/{id}",
    tags: ["tickets"],
    summary: "Get a ticket",
    security: SECURITY,
    request: { params: IdParam },
    responses: {
      200: {
        description: "The ticket.",
        content: { "application/json": { schema: TicketSchema } },
      },
      401: {
        description: "Not authenticated.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "No such ticket.",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const { data } = await buggyapiDb()
      .from("ba_tickets")
      .select(ticketRow)
      .eq("sandbox_id", c.get("sandboxId"))
      .eq("id", id)
      .maybeSingle();
    if (!data) return c.json(errorJson("not_found", `Ticket ${id} does not exist.`), 404);
    const ticket = toTicket(data);
    // BA-005 (bug-hunt): labels degrade to a comma-joined string — a schema
    // violation learners catch by validating against the published contract.
    if (apiBugFlag("BA-005", await sandboxMode(c.get("sandboxId")))) {
      ticket.labels = (ticket.labels as string[]).join(",");
    }
    return c.json(ticket, 200);
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/v1/tickets/{id}",
    tags: ["tickets"],
    summary: "Update a ticket",
    security: SECURITY,
    request: {
      params: IdParam,
      body: { content: { "application/json": { schema: TicketUpdateSchema } } },
    },
    responses: {
      200: { description: "Updated.", content: { "application/json": { schema: TicketSchema } } },
      401: {
        description: "Not authenticated.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "No such ticket.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      422: {
        description: "Validation failed.",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const { data } = await buggyapiDb()
      .from("ba_tickets")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("sandbox_id", c.get("sandboxId"))
      .eq("id", id)
      .select(ticketRow)
      .maybeSingle();
    if (!data) return c.json(errorJson("not_found", `Ticket ${id} does not exist.`), 404);
    return c.json(toTicket(data), 200);
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/v1/tickets/{id}",
    tags: ["tickets"],
    summary: "Delete a ticket",
    security: SECURITY,
    request: { params: IdParam },
    responses: {
      204: { description: "Deleted." },
      401: {
        description: "Not authenticated.",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "No such ticket.",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const { data } = await buggyapiDb()
      .from("ba_tickets")
      .delete()
      .eq("sandbox_id", c.get("sandboxId"))
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (!data) return c.json(errorJson("not_found", `Ticket ${id} does not exist.`), 404);
    // BA-004 (bug-hunt): 200 + a body where the contract says 204 No Content.
    // The route only declares a 204 response, so the deliberate 200 return is
    // cast past that union (`as never`) — the spec keeps showing the correct
    // 204 for learners to spot the deviation against.
    if (apiBugFlag("BA-004", await sandboxMode(c.get("sandboxId")))) {
      return c.json({ deleted: true }, 200) as never;
    }
    return c.body(null, 204);
  },
);

// ── OAuth2 + attachments ──────────────────────────────────────────────────

registerOAuthRoutes(app);
registerAttachmentRoutes(app);

// ── spec + docs ───────────────────────────────────────────────────────────

app.doc31("/v1/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "TaskFlight (BuggyAPI)",
    version: "1.1.0",
    description:
      "A live practice API for learning API testing in depth. Real persistence " +
      "(scoped to your sandbox), four auth schemes, honest status codes, and a " +
      "spec generated from the same schemas the server validates with.\n\n" +
      "**Get credentials:** open BuggyAPI from a QA Mastery lesson — the handoff " +
      "provisions your sandbox and shows your API key, seeded users, OAuth client, " +
      "and sandbox id.\n\n" +
      "**Rate limits:** mutations share a budget of 30/min per sandbox — watch the " +
      "`X-RateLimit-*` headers and earn a real `429` with `Retry-After`.\n\n" +
      "**Other paradigms on this host:** GraphQL (with GraphiQL) at `/api/graphql`, " +
      "SOAP 1.1 at `/api/soap` (WSDL: `/api/soap?wsdl`).",
  },
  tags: [
    {
      name: "auth",
      description: "Login + identity. Schemes: API key, Bearer, Basic (+ OAuth below).",
    },
    {
      name: "oauth",
      description: "OAuth2: client_credentials & authorization_code (RFC 6749-shaped).",
    },
    { name: "projects", description: "TaskFlight projects — simple CRUD." },
    { name: "tickets", description: "Tickets — CRUD plus pagination, filtering, and sorting." },
    { name: "attachments", description: "Multipart uploads to a private bucket → signed URLs." },
  ],
});

app.get("/docs", swaggerUI({ url: "/api/v1/openapi.json" }));

export { app };
