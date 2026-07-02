import { expect, test } from "@playwright/test";

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
});
