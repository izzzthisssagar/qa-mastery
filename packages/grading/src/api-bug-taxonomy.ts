/**
 * The "stripped" API bug-report taxonomy: the option universe a learner picks
 * from when filing a BuggyAPI report. Like bug-taxonomy.ts it deliberately
 * lists every plausible surface / endpoint / category across TaskFlight — NOT
 * just the ones with seeded bugs — so the dropdowns never reveal where a bug
 * hides. The manifest (buggyapi.ba_bug_manifest, server-only) is the only
 * thing that knows which combination is buggy.
 */

export const API_BUG_SURFACES = ["rest", "graphql", "soap", "ws"] as const;

export const API_BUG_ENDPOINTS = [
  "POST /v1/auth/login",
  "GET /v1/me",
  "GET /v1/oauth/authorize",
  "POST /v1/oauth/token",
  "GET /v1/projects",
  "POST /v1/projects",
  "GET /v1/projects/{id}",
  "PATCH /v1/projects/{id}",
  "DELETE /v1/projects/{id}",
  "GET /v1/tickets",
  "POST /v1/tickets",
  "GET /v1/tickets/{id}",
  "PATCH /v1/tickets/{id}",
  "DELETE /v1/tickets/{id}",
  "POST /v1/tickets/{id}/attachments",
  "GET /v1/tickets/{id}/attachments",
  "GraphQL query tickets",
  "GraphQL query ticket",
  "GraphQL mutation createTicket",
  "GraphQL mutation setTicketStatus",
  "SOAP ListProjects",
  "SOAP GetTicket",
  "WS /ws/echo",
  "WS /ws/tickets-stream",
] as const;

export const API_BUG_CATEGORIES = [
  "wrong-status-code",
  "schema-violation",
  "pagination",
  "filtering",
  "validation",
  "auth",
  "rate-limit",
  "contract-mismatch",
  "data-integrity",
] as const;

export type ApiBugSurface = (typeof API_BUG_SURFACES)[number];
export type ApiBugEndpoint = (typeof API_BUG_ENDPOINTS)[number];
export type ApiBugCategory = (typeof API_BUG_CATEGORIES)[number];
