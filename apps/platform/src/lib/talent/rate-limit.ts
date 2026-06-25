import "server-only";
import { createServiceClient } from "@qa-mastery/db";

/**
 * Lightweight per-action rate limiting for marketplace writes, counted off the
 * existing audit_events spine (no new table). Sliding window per actor+action.
 * Returns true when the caller is still within budget. (Security-Spec §3.)
 */
const WINDOWS = {
  "talent.contact_initiated": { max: 20, minutes: 60 },
  "talent.message_sent": { max: 200, minutes: 60 },
  "talent.project_posted": { max: 10, minutes: 60 },
  "talent.application_submitted": { max: 40, minutes: 60 },
  "talent.reported": { max: 20, minutes: 60 },
} as const;

export type RateLimitedAction = keyof typeof WINDOWS;

export async function withinRate(userId: string, action: RateLimitedAction): Promise<boolean> {
  const cfg = WINDOWS[action];
  const service = createServiceClient();
  const since = new Date(Date.now() - cfg.minutes * 60_000).toISOString();
  const { count } = await service
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("actor_id", userId)
    .eq("action", action)
    .gte("created_at", since);
  return (count ?? 0) < cfg.max;
}
