import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // RLS tests talk to the live local Supabase stack; give auth round-trips room.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
