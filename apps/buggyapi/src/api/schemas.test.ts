import { describe, expect, it } from "vitest";
import { IdParam, LoginRequestSchema, ProjectCreateSchema, TicketListQuerySchema } from "./schemas";

describe("TicketListQuerySchema", () => {
  it("defaults page, per_page, sort and order when the query is empty", () => {
    const result = TicketListQuerySchema.parse({});
    expect(result).toMatchObject({ page: 1, per_page: 20, sort: "number", order: "asc" });
  });

  it("coerces page and per_page from query-string values", () => {
    const result = TicketListQuerySchema.parse({ page: "3", per_page: "50" });
    expect(result.page).toBe(3);
    expect(result.per_page).toBe(50);
  });

  it("rejects a per_page above the 100 boundary", () => {
    expect(() => TicketListQuerySchema.parse({ per_page: "101" })).toThrow();
  });

  it("accepts per_page exactly at the 100 boundary", () => {
    expect(TicketListQuerySchema.parse({ per_page: "100" }).per_page).toBe(100);
  });

  it("rejects a page below 1", () => {
    expect(() => TicketListQuerySchema.parse({ page: "0" })).toThrow();
  });
});

describe("ProjectCreateSchema", () => {
  it("accepts a valid uppercase key", () => {
    expect(ProjectCreateSchema.parse({ key: "OPS", name: "Ground Ops" }).key).toBe("OPS");
  });

  it("rejects a lowercase key", () => {
    expect(() => ProjectCreateSchema.parse({ key: "ops", name: "Ground Ops" })).toThrow();
  });

  it("rejects a single-character key (below the 2-char minimum)", () => {
    expect(() => ProjectCreateSchema.parse({ key: "O", name: "Ground Ops" })).toThrow();
  });

  it("rejects a key starting with a digit", () => {
    expect(() => ProjectCreateSchema.parse({ key: "1OPS", name: "Ground Ops" })).toThrow();
  });

  it("rejects an empty name", () => {
    expect(() => ProjectCreateSchema.parse({ key: "OPS", name: "" })).toThrow();
  });
});

describe("LoginRequestSchema", () => {
  it("accepts a well-formed email and non-empty password", () => {
    expect(() =>
      LoginRequestSchema.parse({ email: "asha@taskflight.test", password: "TestPass123!" }),
    ).not.toThrow();
  });

  it("rejects a malformed email", () => {
    expect(() =>
      LoginRequestSchema.parse({ email: "not-an-email", password: "TestPass123!" }),
    ).toThrow();
  });

  it("rejects an empty password", () => {
    expect(() =>
      LoginRequestSchema.parse({ email: "asha@taskflight.test", password: "" }),
    ).toThrow();
  });
});

describe("IdParam", () => {
  it("accepts a valid UUID", () => {
    expect(() => IdParam.parse({ id: "6fa1c07e-2f34-4b1e-9c3a-5d2f8a91b0aa" })).not.toThrow();
  });

  it("rejects a non-UUID id", () => {
    expect(() => IdParam.parse({ id: "not-a-uuid" })).toThrow();
  });
});
