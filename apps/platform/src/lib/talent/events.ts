import "server-only";
import { z } from "zod";
import { createServiceClient } from "@qa-mastery/db";

/**
 * Marketplace event spine. Every significant talent action emits one row onto
 * the existing append-only `audit_events` table (service-role only) — the
 * single source for analytics + the forensic trail (Data-Eng §1). The metadata
 * payload is contract-validated here, at the producer: an invalid payload is a
 * bug we log, never something that blocks the user's action.
 */

const CONTRACTS = {
  "talent.role_selected": z.object({ role: z.enum(["tester", "client", "both"]) }),
  "talent.profile_published": z.object({
    tester_id: z.string().uuid(),
    specialties_count: z.number().int().min(0),
    devices_count: z.number().int().min(0),
    portfolio_count: z.number().int().min(0),
  }),
  "talent.project_posted": z.object({
    project_id: z.string().uuid(),
    required_types: z.array(z.string()),
    engagement: z.string(),
  }),
  "talent.application_submitted": z.object({
    project_id: z.string().uuid(),
    tester_id: z.string().uuid(),
  }),
  "talent.contact_initiated": z.object({
    conversation_id: z.string().uuid(),
    client_id: z.string().uuid(),
    tester_id: z.string().uuid(),
    from: z.enum(["directory", "project"]),
  }),
  "talent.message_sent": z.object({
    conversation_id: z.string().uuid(),
    sender_role: z.enum(["client", "tester"]),
  }),
  "talent.connection_made": z.object({ conversation_id: z.string().uuid() }),
  "talent.hire_marked": z.object({
    project_id: z.string().uuid(),
    tester_id: z.string().uuid(),
  }),
  "talent.reported": z.object({
    target_type: z.enum(["profile", "project", "message"]),
    target_id: z.string().uuid(),
  }),
} as const;

export type TalentAction = keyof typeof CONTRACTS;
type Meta<A extends TalentAction> = z.infer<(typeof CONTRACTS)[A]>;

/**
 * Validate + record a talent event. Never throws into the caller's flow — a
 * contract miss or DB hiccup is logged and swallowed so a telemetry problem
 * can't break a user action. Returns whether it was recorded.
 */
export async function emitTalentEvent<A extends TalentAction>(
  actorId: string,
  action: A,
  metadata: Meta<A>,
  target?: string,
): Promise<boolean> {
  const parsed = CONTRACTS[action].safeParse(metadata);
  if (!parsed.success) {
    console.error(`[talent] event contract miss for ${action}:`, parsed.error.issues);
    return false;
  }
  try {
    const service = createServiceClient();
    const { error } = await service.from("audit_events").insert({
      actor_id: actorId,
      action,
      target: target ?? null,
      metadata: parsed.data,
    });
    if (error) {
      console.error(`[talent] failed to record ${action}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[talent] event emit threw for ${action}:`, err);
    return false;
  }
}
