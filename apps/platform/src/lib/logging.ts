import { createHash } from "node:crypto";

interface ActionLogFields {
  action: string;
  userIdHash: string;
  ok: boolean;
  error?: string;
  ms: number;
}

/** One-way hash so raw user ids never land in the log sink. */
export function hashUserId(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 16);
}

/** Emits one structured JSON line per call — the shape a log sink (Vercel, etc.) can query on. */
export function logAction(fields: ActionLogFields): void {
  console.log(JSON.stringify(fields));
}

/**
 * Wraps a server action body, logging `{action, userIdHash, ok, error, ms}` once
 * per invocation. Re-throws so caller error handling (redirects, form state) is unchanged.
 */
export async function withLogging<T>(
  action: string,
  userId: string | null,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  const userIdHash = userId ? hashUserId(userId) : "anonymous";
  try {
    const result = await fn();
    logAction({ action, userIdHash, ok: true, ms: Date.now() - start });
    return result;
  } catch (err) {
    logAction({
      action,
      userIdHash,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - start,
    });
    throw err;
  }
}
