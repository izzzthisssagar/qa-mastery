import { describe, expect, it } from "vitest";
import {
  PRODUCTS,
  filterByMaxPrice,
  searchByName,
  sortByPrice,
  isQuantityAccepted,
  getProduct,
} from "./catalog";

describe("filterByMaxPrice (BS-008: < instead of <= at the boundary, fixed in 1.1)", () => {
  it("v1.0 wrongly excludes the item priced exactly at the max", () => {
    const result = filterByMaxPrice(PRODUCTS, 100, "1.0");
    expect(result.find((p) => p.id === "premium-test-plan")).toBeUndefined();
  });

  it("v1.1 correctly includes the item priced exactly at the max (fixed)", () => {
    const result = filterByMaxPrice(PRODUCTS, 100, "1.1");
    expect(result.find((p) => p.id === "premium-test-plan")).toBeDefined();
  });

  it("v2.0 stays fixed", () => {
    const result = filterByMaxPrice(PRODUCTS, 100, "2.0");
    expect(result.find((p) => p.id === "premium-test-plan")).toBeDefined();
  });

  it("returns every product when maxPrice is null or NaN, regardless of release", () => {
    expect(filterByMaxPrice(PRODUCTS, null, "1.0")).toHaveLength(PRODUCTS.length);
    expect(filterByMaxPrice(PRODUCTS, Number.NaN, "1.0")).toHaveLength(PRODUCTS.length);
  });
});

describe("searchByName (BS-010: query not trimmed, no fixed release)", () => {
  it.each(["1.0", "1.1", "2.0"] as const)(
    "wrongly matches nothing for a trailing-space query in %s",
    (release) => {
      expect(searchByName(PRODUCTS, "mug ", release)).toEqual([]);
    },
  );

  it("matches correctly for a clean query in every release", () => {
    const result = searchByName(PRODUCTS, "mug", "1.0");
    expect(result.map((p) => p.id)).toEqual(["tester-mug"]);
  });

  it("is case-insensitive", () => {
    expect(searchByName(PRODUCTS, "MUG", "1.0").map((p) => p.id)).toEqual(["tester-mug"]);
  });

  it("returns every product for an empty query", () => {
    expect(searchByName(PRODUCTS, "", "1.0")).toHaveLength(PRODUCTS.length);
  });
});

describe("sortByPrice (BS-009: string comparison instead of numeric, no fixed release)", () => {
  it.each(["1.0", "1.1", "2.0"] as const)(
    "wrongly sorts prices as text in %s (100 sorts before 12)",
    (release) => {
      const sorted = sortByPrice(PRODUCTS, "asc", release);
      const idx100 = sorted.findIndex((p) => p.price === 100);
      const idx12 = sorted.findIndex((p) => p.price === 12);
      expect(idx100).toBeLessThan(idx12);
    },
  );

  it("returns the input unchanged when dir is 'none'", () => {
    expect(sortByPrice(PRODUCTS, "none", "1.0")).toBe(PRODUCTS);
  });

  it("does not mutate the input array", () => {
    const copy = [...PRODUCTS];
    sortByPrice(PRODUCTS, "asc", "1.0");
    expect(PRODUCTS).toEqual(copy);
  });
});

describe("isQuantityAccepted (BS-007: qty 0 wrongly accepted, fixed in 1.1)", () => {
  it("v1.0 wrongly accepts a quantity of 0", () => {
    expect(isQuantityAccepted(0, "1.0")).toBe(true);
  });

  it("v1.1 correctly rejects a quantity of 0 (fixed)", () => {
    expect(isQuantityAccepted(0, "1.1")).toBe(false);
  });

  it("v2.0 stays fixed", () => {
    expect(isQuantityAccepted(0, "2.0")).toBe(false);
  });

  it("rejects a non-integer quantity in every release", () => {
    expect(isQuantityAccepted(1.5, "1.0")).toBe(false);
    expect(isQuantityAccepted(1.5, "1.1")).toBe(false);
  });

  it("rejects a negative quantity in every release", () => {
    expect(isQuantityAccepted(-1, "1.0")).toBe(false);
    expect(isQuantityAccepted(-1, "1.1")).toBe(false);
  });

  it("accepts a positive integer quantity in every release", () => {
    expect(isQuantityAccepted(3, "1.0")).toBe(true);
    expect(isQuantityAccepted(3, "1.1")).toBe(true);
  });
});

describe("getProduct", () => {
  it("finds a product by id", () => {
    expect(getProduct("tester-mug")?.name).toBe("Tester Mug");
  });

  it("returns undefined for an unknown id", () => {
    expect(getProduct("not-a-real-product")).toBeUndefined();
  });
});
