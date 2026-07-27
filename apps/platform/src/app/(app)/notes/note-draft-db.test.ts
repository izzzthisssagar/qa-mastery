import { describe, expect, it } from "vitest";
import { deletePendingSave, getPendingSave, putPendingSave } from "./note-draft-db";

describe("note-draft-db", () => {
  // vitest.config.ts runs this suite under environment: "node", where
  // `indexedDB` is undefined — the same shape as SSR. These calls must
  // degrade to no-ops instead of throwing, so callers never need to guard
  // every call with a browser check.
  it("never throws without a browser IndexedDB", async () => {
    await expect(putPendingSave("k", { any: "value" })).resolves.toBeUndefined();
    await expect(getPendingSave("k")).resolves.toBeNull();
    await expect(deletePendingSave("k")).resolves.toBeUndefined();
  });
});
