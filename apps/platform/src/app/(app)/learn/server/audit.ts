import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Append a sensitive-operation record to the audit trail. Best-effort: an
 *  audit-write failure must never break the operation it records. */
export async function recordAuditEvent(
  service: SupabaseClient,
  event: { actorId: string; action: string; target?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  const { error } = await service.from("audit_events").insert({
    actor_id: event.actorId,
    action: event.action,
    target: event.target ?? null,
    metadata: event.metadata ?? {},
  });
  if (error) console.error("audit_events insert failed:", error.message);
}
