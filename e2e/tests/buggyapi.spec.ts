import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

const BUGGYAPI = "http://localhost:3002";

/**
 * BuggyAPI contract smoke — everything here runs without a seeded sandbox
 * (auth-gated DB flows are covered once the 0024 migration is live; the
 * contract below must hold regardless).
 */

test.describe("BuggyAPI contract", () => {
  test("health endpoint answers", async ({ request }) => {
    const res = await request.get(`${BUGGYAPI}/api/health`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ok: true, app: "buggyapi" });
  });

  test("serves a valid OpenAPI 3.1 spec with all v1 surfaces", async ({ request }) => {
    const res = await request.get(`${BUGGYAPI}/api/v1/openapi.json`);
    expect(res.status()).toBe(200);
    const spec = await res.json();

    expect(spec.openapi).toBe("3.1.0");
    expect(spec.info.title).toContain("TaskFlight");

    const paths = Object.keys(spec.paths);
    for (const p of [
      "/api/v1/auth/login",
      "/api/v1/me",
      "/api/v1/projects",
      "/api/v1/projects/{id}",
      "/api/v1/tickets",
      "/api/v1/tickets/{id}",
    ]) {
      expect(paths).toContain(p);
    }

    // All three teaching auth schemes are documented.
    expect(Object.keys(spec.components.securitySchemes).sort()).toEqual([
      "ApiKeyAuth",
      "BasicAuth",
      "BearerAuth",
    ]);
  });

  test("swagger UI renders", async ({ page }) => {
    await page.goto(`${BUGGYAPI}/api/docs`);
    await expect(page.locator(".swagger-ui")).toBeVisible();
    await expect(page.getByText("TaskFlight", { exact: false }).first()).toBeVisible();
  });

  test("unauthenticated requests get the documented 401 envelope", async ({ request }) => {
    const res = await request.get(`${BUGGYAPI}/api/v1/tickets`);
    expect(res.status()).toBe(401);
    expect(res.headers()["www-authenticate"]).toContain("Basic");
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
    expect(typeof body.error.message).toBe("string");
  });

  test("invalid API key is rejected, not errored", async ({ request }) => {
    const res = await request.get(`${BUGGYAPI}/api/v1/me`, {
      headers: { "X-API-Key": "bak_definitely_not_real" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
  });

  test("home page explains the handoff when no sandbox exists", async ({ page }) => {
    await page.goto(`${BUGGYAPI}/`);
    await expect(page.getByTestId("no-credentials")).toBeVisible();
    await expect(page.getByTestId("open-docs")).toBeVisible();
  });

  test("/enter without a token reports the missing lab pass", async ({ page }) => {
    await page.goto(`${BUGGYAPI}/enter`);
    await expect(page.getByTestId("enter-status")).toContainText("No lab pass found");
  });

  test("spec documents the 1b surfaces (oauth + attachments)", async ({ request }) => {
    const spec = await (await request.get(`${BUGGYAPI}/api/v1/openapi.json`)).json();
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/api/v1/oauth/token");
    expect(paths).toContain("/api/v1/oauth/authorize");
    expect(paths).toContain("/api/v1/tickets/{id}/attachments");
  });

  test("oauth token endpoint speaks RFC 6749 errors", async ({ request }) => {
    const res = await request.post(`${BUGGYAPI}/api/v1/oauth/token`, {
      form: { grant_type: "client_credentials", client_id: "tfc_nope", client_secret: "tfs_nope" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    // RFC shape — {error, error_description}, NOT the API envelope.
    expect(body.error).toBe("invalid_client");
    expect(typeof body.error_description).toBe("string");
  });

  test("graphql introspection is open, data requires auth", async ({ request }) => {
    const introspection = await request.post(`${BUGGYAPI}/api/graphql`, {
      data: { query: "{ __schema { queryType { name } } }" },
    });
    expect(introspection.status()).toBe(200);
    expect((await introspection.json()).data.__schema.queryType.name).toBe("Query");

    const data = await request.post(`${BUGGYAPI}/api/graphql`, {
      data: { query: "{ me { name } }" },
    });
    const body = await data.json();
    expect(body.errors[0].extensions.code).toBe("UNAUTHENTICATED");
  });

  test("soap serves a WSDL and faults without auth", async ({ request }) => {
    const wsdl = await request.get(`${BUGGYAPI}/api/soap?wsdl`);
    expect(wsdl.status()).toBe(200);
    expect(wsdl.headers()["content-type"]).toContain("text/xml");
    expect(await wsdl.text()).toContain("TaskFlightService");

    const fault = await request.post(`${BUGGYAPI}/api/soap`, {
      headers: { "Content-Type": "text/xml" },
      data: "<x/>",
    });
    expect(fault.status()).toBe(401);
    expect(await fault.text()).toContain("soap:Fault");
  });
});

/**
 * GraphQL Yoga 5.24 security-upgrade compatibility, backed by CI's local
 * disposable Supabase only. Admin provisioning uses Node fetch (never the
 * Playwright request/page context) so service-role credentials and synthetic
 * API keys are not recorded in Playwright traces or screenshots.
 *
 * This validates that the Yoga/GraphQL Tools major transitive upgrade does not
 * regress authenticated resolvers, nested collections, or writes.
 */
test("GraphQL upgraded Yoga supports authenticated nested reads and mutations", async () => {
  test.skip(!process.env.CI, "Requires disposable, locally seeded CI Supabase");
  test.setTimeout(90_000);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Disposable CI Supabase credentials are not configured");
  }
  const origin = new URL(supabaseUrl);
  if (origin.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(origin.hostname)) {
    throw new Error("Refusing to provision a sandbox outside localhost");
  }

  const adminHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  const syntheticEmail = `graphql-compat-${randomUUID()}@e2e.local`;
  let userId: string | undefined;
  const rootUrl = supabaseUrl.replace(/\/$/, "");

  async function adminFetch(
    relative: string,
    method: "GET" | "POST" | "DELETE",
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ) {
    return fetch(rootUrl + relative, {
      method,
      headers: { ...adminHeaders, ...extraHeaders },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }

  try {
    const created = await adminFetch("/auth/v1/admin/users", "POST", {
      email: syntheticEmail,
      password: "Test-only-GraphQL-compat-pass-2026",
      email_confirm: true,
    });
    expect([200, 201]).toContain(created.status);
    const user = (await created.json()) as { id: string };
    userId = user.id;
    expect(userId).toMatch(/^[0-9a-f-]{36}$/i);

    const sandboxRes = await adminFetch(
      "/rest/v1/sandboxes",
      "POST",
      {
        user_id: userId,
      },
      { Prefer: "return=representation" },
    );
    expect(sandboxRes.status).toBe(201);
    const sandboxes = (await sandboxRes.json()) as Array<{ id: string }>;
    const sandboxId = sandboxes[0]?.id;
    expect(sandboxId).toMatch(/^[0-9a-f-]{36}$/i);

    const provision = await adminFetch(
      "/rest/v1/rpc/provision_buggyapi_sandbox",
      "POST",
      { p_sandbox_id: sandboxId },
      { "Content-Profile": "buggyapi" },
    );
    expect([200, 204]).toContain(provision.status);

    const keyRes = await adminFetch(
      `/rest/v1/ba_api_keys?select=key&sandbox_id=eq.${sandboxId}&is_seed=eq.true`,
      "GET",
      undefined,
      { "Accept-Profile": "buggyapi" },
    );
    expect(keyRes.status).toBe(200);
    const keys = (await keyRes.json()) as Array<{ key: string }>;
    const practiceKey = keys[0]?.key;
    if (typeof practiceKey !== "string" || !/^bak_[0-9a-f]{32}$/i.test(practiceKey)) {
      throw new Error("Disposable local GraphQL sandbox was not seeded with an API key");
    }

    async function gql(query: string, variables?: Record<string, unknown>) {
      const response = await fetch(`${BUGGYAPI}/api/graphql`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": practiceKey,
        },
        body: JSON.stringify({ query, variables }),
      });
      expect(response.status).toBe(200);
      return (await response.json()) as {
        errors?: Array<{ extensions?: { code?: string } }>;
        data?: Record<string, unknown>;
      };
    }

    const read = await gql(`query {
      me { name role authenticatedVia sandboxId }
      projects { id key tickets { id status project { key } } }
    }`);
    expect(read.errors).toBeUndefined();
    const me = read.data?.me as { authenticatedVia: string; sandboxId: string };
    expect(me.authenticatedVia).toBe("api_key");
    expect(me.sandboxId).toBe(sandboxId);
    const projects = read.data?.projects as Array<{
      id: string;
      key: string;
      tickets: Array<{ id: string; project: { key: string } }>;
    }>;
    expect(projects).toHaveLength(1);
    expect(projects[0].tickets.length).toBeGreaterThanOrEqual(12);
    expect(projects[0].tickets[0].project.key).toBe(projects[0].key);

    const title = `CI GraphQL compat ${randomUUID()}`;
    const made = await gql(
      `mutation Make($project: ID!, $title: String!) {
        createTicket(input: { projectId: $project, title: $title, priority: high }) {
          id title status priority project { key }
        }
      }`,
      { project: projects[0].id, title },
    );
    expect(made.errors).toBeUndefined();
    const ticket = made.data?.createTicket as {
      id: string;
      title: string;
      status: string;
      priority: string;
      project: { key: string };
    };
    expect(ticket.title).toBe(title);
    expect(ticket.status).toBe("open");
    expect(ticket.priority).toBe("high");
    expect(ticket.project.key).toBe(projects[0].key);

    const changed = await gql(
      `mutation Update($ticket: ID!) {
        setTicketStatus(id: $ticket, status: done) { id status project { key } }
      }`,
      { ticket: ticket.id },
    );
    expect(changed.errors).toBeUndefined();
    expect(changed.data?.setTicketStatus).toMatchObject({
      id: ticket.id,
      status: "done",
      project: { key: projects[0].key },
    });
  } finally {
    if (userId) {
      // Delete the synthetic auth user; FK cascades remove its practice sandbox.
      // Never log the temporary service token, API key, user ID or admin body.
      const cleanup = await adminFetch(`/auth/v1/admin/users/${userId}`, "DELETE");
      if (![200, 204].includes(cleanup.status)) {
        throw new Error("Disposable local GraphQL test user cleanup failed");
      }
    }
  }
});

test("GraphQL upgraded Yoga preserves GET, GraphiQL, OPTIONS, and parse failures", async ({
  request,
}) => {
  const direct = await request.get(
    `${BUGGYAPI}/api/graphql?query=${encodeURIComponent("{ __typename }")}`,
    { headers: { Accept: "application/json" } },
  );
  expect(direct.status()).toBe(200);
  expect((await direct.json()).data.__typename).toBe("Query");

  const explorer = await request.get(`${BUGGYAPI}/api/graphql`, {
    headers: { Accept: "text/html" },
  });
  expect(explorer.status()).toBe(200);
  expect(explorer.headers()["content-type"]).toContain("text/html");
  expect(await explorer.text()).toContain("Yoga GraphiQL");

  const options = await request.fetch(`${BUGGYAPI}/api/graphql`, {
    method: "OPTIONS",
  });
  expect(options.status()).toBe(204);

  const badJson = await request.post(`${BUGGYAPI}/api/graphql`, {
    headers: { "content-type": "application/json" },
    data: "{invalid-json",
  });
  expect(badJson.status()).toBe(400);
  expect((await badJson.json()).errors[0].extensions.code).toBe("BAD_REQUEST");

  const badGraphQL = await request.post(`${BUGGYAPI}/api/graphql`, {
    data: { query: "query {" },
  });
  expect(badGraphQL.status()).toBe(200);
  expect((await badGraphQL.json()).errors[0].extensions.code).toBe("GRAPHQL_PARSE_FAILED");

  // Deliberate unauthorized mutation: no resource or graded data may change.
  const deniedWrite = await request.post(`${BUGGYAPI}/api/graphql`, {
    data: {
      query: `mutation {
        createTicket(input: { projectId: "00000000-0000-4000-8000-000000000000", title: "blocked" }) {
          id
        }
      }`,
    },
  });
  expect(deniedWrite.status()).toBe(200);
  expect((await deniedWrite.json()).errors[0].extensions.code).toBe("UNAUTHENTICATED");
});
