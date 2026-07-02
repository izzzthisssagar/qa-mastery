import { buggyapiDb } from "./db";

/**
 * Bug-hunt gating for BuggyAPI (invariant 7: seeded bugs only ever run behind
 * a flag). BuggyShop gates on `release`; BuggyAPI gates on the sandbox `mode`
 * ('clean' | 'bughunt') set from the handoff token at /api/session exchange.
 *
 * IMPLEMENTED_BUGS is the registry of bug ids this build actually serves —
 * the manifest (buggyapi.ba_bug_manifest) is the answer key and NEVER leaves
 * the server; grading happens in the platform against that table.
 */

export type SandboxMode = "clean" | "bughunt";

export const IMPLEMENTED_BUGS = new Set([
  "BA-001", // GET /v1/tickets — total_pages floor instead of ceil
  "BA-002", // POST /v1/tickets — 200 instead of 201
  "BA-003", // GET /v1/tickets — status filter dropped when combined with priority
  "BA-004", // DELETE /v1/tickets/{id} — 200 + body instead of 204
  "BA-005", // GET /v1/tickets/{id} — labels as comma-joined string
]);

/** The sandbox's current mode (one cheap PK lookup; defaults to clean). */
export async function sandboxMode(sandboxId: string): Promise<SandboxMode> {
  const { data } = await buggyapiDb()
    .from("ba_sandbox_state")
    .select("mode")
    .eq("sandbox_id", sandboxId)
    .maybeSingle();
  return data?.mode === "bughunt" ? "bughunt" : "clean";
}

/** True when the given seeded bug should fire for this mode. */
export function apiBugFlag(bugId: string, mode: SandboxMode): boolean {
  return mode === "bughunt" && IMPLEMENTED_BUGS.has(bugId);
}
