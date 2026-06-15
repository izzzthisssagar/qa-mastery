import { guardFallback, guardResponse, wouldGuard } from "./guard";

/**
 * Wrap a token stream so the guard runs BEFORE text reaches the client. Yields
 * only guard-clean content, holding back a trailing window so a forbidden
 * phrase can never be flushed while it is still forming at the tail. If a leak
 * forms, it stops and emits a safe redirect instead.
 *
 * Yields client-bound chunks; the generator's RETURN value is the text to
 * persist (the clean reply, or the safe fallback when a leak was caught).
 */
export async function* guardedStream(
  source: AsyncIterable<string>,
  turn: number,
  holdback = 160,
): AsyncGenerator<string, string, unknown> {
  let full = "";
  let flushed = 0;

  for await (const chunk of source) {
    full += chunk;
    if (wouldGuard(full, turn)) {
      yield "\n\n" + guardFallback();
      return guardFallback();
    }
    const safeUpto = full.length - holdback;
    if (safeUpto > flushed) {
      yield full.slice(flushed, safeUpto);
      flushed = safeUpto;
    }
  }

  // Stream ended clean of mid-stream trips; final check covers the held-back tail.
  const guarded = guardResponse(full, turn);
  if (guarded !== full) {
    yield "\n\n" + guardFallback();
    return guardFallback();
  }
  yield full.slice(flushed);
  return full;
}
