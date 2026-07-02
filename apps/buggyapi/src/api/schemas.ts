import { z } from "@hono/zod-openapi";

/**
 * Zod schemas double as the OpenAPI contract — every request/response shape
 * documented here renders in Swagger UI with examples. This file is the
 * "learnable" surface: rich descriptions + multiple examples on purpose.
 */

// ── shared ────────────────────────────────────────────────────────────────

export const ErrorSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: "not_found" }),
      message: z.string().openapi({ example: "Ticket 9f3c… does not exist." }),
      details: z.record(z.string(), z.unknown()).optional(),
    }),
  })
  .openapi("Error");

export const IdParam = z.object({
  id: z.uuid().openapi({
    param: { name: "id", in: "path" },
    example: "6fa1c07e-2f34-4b1e-9c3a-5d2f8a91b0aa",
  }),
});

// ── auth ──────────────────────────────────────────────────────────────────

export const LoginRequestSchema = z
  .object({
    email: z.email().openapi({
      example: "asha@taskflight.test",
      description: "A seeded sandbox user (shown on the BuggyAPI home page).",
    }),
    password: z.string().min(1).openapi({ example: "TestPass123!" }),
  })
  .openapi("LoginRequest");

export const LoginResponseSchema = z
  .object({
    token: z.string().openapi({
      example: "bas_7f9a1c2d3e4f5061728394a5b6c7d8e9",
      description: "Opaque bearer token. Send as `Authorization: Bearer <token>`.",
    }),
    token_type: z.literal("bearer"),
    expires_at: z.iso.datetime().openapi({ example: "2026-07-03T10:00:00.000Z" }),
  })
  .openapi("LoginResponse");

export const MeSchema = z
  .object({
    id: z.uuid(),
    name: z.string().openapi({ example: "Asha Tester" }),
    email: z.email().openapi({ example: "asha@taskflight.test" }),
    role: z.enum(["admin", "member"]),
    authenticated_via: z.enum(["api_key", "bearer", "basic"]).openapi({
      description: "Which of the three auth schemes this request used.",
    }),
    sandbox_id: z.uuid().openapi({
      description: "Your practice sandbox — all data you see/change lives in it.",
    }),
  })
  .openapi("Me");

// ── projects ──────────────────────────────────────────────────────────────

export const ProjectSchema = z
  .object({
    id: z.uuid(),
    key: z.string().openapi({ example: "TF", description: "Short project key used in ticket refs (TF-12)." }),
    name: z.string().openapi({ example: "TaskFlight" }),
    description: z.string().nullable(),
    status: z.enum(["active", "archived"]),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
  })
  .openapi("Project");

export const ProjectCreateSchema = z
  .object({
    key: z
      .string()
      .regex(/^[A-Z][A-Z0-9]{1,9}$/, "2–10 chars, uppercase letters/digits, starts with a letter")
      .openapi({ example: "OPS" }),
    name: z.string().min(1).max(120).openapi({ example: "Ground Ops" }),
    description: z.string().max(2000).optional().openapi({ example: "Everything below the wing." }),
  })
  .openapi("ProjectCreate");

export const ProjectUpdateSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).nullable().optional(),
    status: z.enum(["active", "archived"]).optional(),
  })
  .openapi("ProjectUpdate");

// ── tickets ───────────────────────────────────────────────────────────────

export const TICKET_STATUSES = ["open", "in_progress", "blocked", "done", "cancelled"] as const;
export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export const TicketSchema = z
  .object({
    id: z.uuid(),
    project_id: z.uuid(),
    ref: z.string().openapi({ example: "TF-11", description: "Human ref: project key + number." }),
    number: z.number().int(),
    title: z.string().openapi({ example: "Refund pipeline drops currency decimals" }),
    description: z.string().nullable(),
    status: z.enum(TICKET_STATUSES),
    priority: z.enum(TICKET_PRIORITIES),
    assignee_id: z.uuid().nullable(),
    labels: z.array(z.string()).openapi({ example: ["backend", "bug"] }),
    due_date: z.iso.date().nullable(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
  })
  .openapi("Ticket");

export const TicketCreateSchema = z
  .object({
    project_id: z.uuid().openapi({ description: "Project to file the ticket in." }),
    title: z.string().min(1).max(200).openapi({ example: "Boarding scanner rejects valid passes" }),
    description: z.string().max(5000).optional(),
    status: z.enum(TICKET_STATUSES).optional().openapi({ description: "Defaults to `open`." }),
    priority: z.enum(TICKET_PRIORITIES).optional().openapi({ description: "Defaults to `medium`." }),
    assignee_id: z.uuid().optional(),
    labels: z.array(z.string().min(1).max(30)).max(10).optional(),
    due_date: z.iso.date().optional().openapi({ example: "2026-08-01" }),
  })
  .openapi("TicketCreate");

export const TicketUpdateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    status: z.enum(TICKET_STATUSES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    assignee_id: z.uuid().nullable().optional(),
    labels: z.array(z.string().min(1).max(30)).max(10).optional(),
    due_date: z.iso.date().nullable().optional(),
  })
  .openapi("TicketUpdate");

export const TicketListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({
    param: { name: "page", in: "query" },
    example: 1,
  }),
  per_page: z.coerce.number().int().min(1).max(100).default(20).openapi({
    param: { name: "per_page", in: "query" },
    example: 20,
    description: "Max 100 — asking for more is a classic boundary test (you get a 422).",
  }),
  status: z.enum(TICKET_STATUSES).optional().openapi({
    param: { name: "status", in: "query" },
  }),
  priority: z.enum(TICKET_PRIORITIES).optional().openapi({
    param: { name: "priority", in: "query" },
  }),
  label: z.string().optional().openapi({
    param: { name: "label", in: "query" },
    example: "bug",
  }),
  project_id: z.uuid().optional().openapi({
    param: { name: "project_id", in: "query" },
  }),
  q: z.string().optional().openapi({
    param: { name: "q", in: "query" },
    description: "Case-insensitive substring match on the title.",
    example: "refund",
  }),
  sort: z.enum(["created_at", "updated_at", "priority", "number"]).default("number").openapi({
    param: { name: "sort", in: "query" },
  }),
  order: z.enum(["asc", "desc"]).default("asc").openapi({
    param: { name: "order", in: "query" },
  }),
});

export const TicketListSchema = z
  .object({
    data: z.array(TicketSchema),
    page: z.number().int().openapi({ example: 1 }),
    per_page: z.number().int().openapi({ example: 20 }),
    total: z.number().int().openapi({ example: 12, description: "Also sent as the X-Total-Count header." }),
    total_pages: z.number().int().openapi({ example: 1 }),
  })
  .openapi("TicketList");
