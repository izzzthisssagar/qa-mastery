import type { Context } from "hono";
import { buggyapiDb } from "./db";

/**
 * Fixed-window rate limiting on Postgres (ba_rate_counters) — no Redis, and
 * deliberately observable: every limited endpoint returns the standard
 * X-RateLimit-* headers so learners can watch the window fill up and hit a
 * real 429 with Retry-After.
 */

export interface RateLimitRule {
  /** Counter namespace, e.g. "writes". */
  bucket: string;
  /** Max requests per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

/** Ticket/project mutations share one write budget per sandbox. */
export const WRITE_RULE: RateLimitRule = { bucket: "writes", limit: 30, windowSeconds: 60 };

export async function checkRateLimit(
  c: Context,
  sandboxId: string,
  rule: RateLimitRule,
): Promise<Response | undefined> {
  const db = buggyapiDb();
  const windowMs = rule.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();

  // Read-then-write (not atomic) is fine here: one learner per sandbox, and a
  // rare off-by-one under manual parallel requests just teaches flakiness.
  const { data: existing } = await db
    .from("ba_rate_counters")
    .select("count")
    .eq("sandbox_id", sandboxId)
    .eq("bucket", rule.bucket)
    .eq("window_start", windowStart)
    .maybeSingle();

  const used = existing?.count ?? 0;
  const resetAt = Math.floor((Date.parse(windowStart) + windowMs) / 1000);

  c.header("X-RateLimit-Limit", String(rule.limit));
  c.header("X-RateLimit-Remaining", String(Math.max(0, rule.limit - used - 1)));
  c.header("X-RateLimit-Reset", String(resetAt));

  if (used >= rule.limit) {
    const retryAfter = Math.max(1, resetAt - Math.floor(Date.now() / 1000));
    c.header("Retry-After", String(retryAfter));
    c.header("X-RateLimit-Remaining", "0");
    return c.json(
      {
        error: {
          code: "rate_limited",
          message: `Rate limit exceeded: ${rule.limit} ${rule.bucket} per ${rule.windowSeconds}s. Retry after ${retryAfter}s.`,
        },
      },
      429,
    );
  }

  await db
    .from("ba_rate_counters")
    .upsert(
      { sandbox_id: sandboxId, bucket: rule.bucket, window_start: windowStart, count: used + 1 },
      { onConflict: "sandbox_id,bucket,window_start" },
    );
  return undefined;
}
