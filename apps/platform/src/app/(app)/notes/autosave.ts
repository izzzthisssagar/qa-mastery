export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutosaveController {
  /** Trigger a save attempt — writes local immediately, then (after an
   *  optional debounce) attempts the real server sync. */
  run(): void;
  /** Re-attempt the last sync after a failure or on reconnect, skipping the
   *  local write (already done) and any debounce. */
  retry(): void;
  /** Stop reacting to further status changes — call on unmount. */
  dispose(): void;
}

export interface AutosaveOptions {
  /** Fire-and-forget local persistence — must never throw into the caller;
   *  a rejection here is swallowed the same as any other best-effort write. */
  persistLocal(): Promise<void> | void;
  /** The real server round-trip. Its resolution/rejection drives the status. */
  sync(): Promise<void>;
  onStatusChange(status: SaveStatus): void;
  /** Delay before `sync` fires after `run()`. 0 (default) = immediate — the
   *  right choice for a discrete action like a click; a continuous editor
   *  passes ~800ms so a burst of keystrokes coalesces into one sync. */
  debounceMs?: number;
}

/**
 * The state machine behind every "notes" save affordance: persist local
 * state right away (so a reload never loses it, network or not), then
 * debounce a server sync and report its *real* outcome. Never lands on a
 * silent "saved" that isn't true — the `webkit-save-stall` lesson was a
 * caller that only watched for "Saved." and hung forever when the actual
 * outcome was a swallowed failure.
 */
export function createAutosave(opts: AutosaveOptions): AutosaveController {
  const debounceMs = opts.debounceMs ?? 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  let inFlight = false;

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  async function attemptSync() {
    if (disposed || inFlight) return;
    inFlight = true;
    opts.onStatusChange("saving");
    try {
      await opts.sync();
      if (!disposed) opts.onStatusChange("saved");
    } catch {
      if (!disposed) opts.onStatusChange("error");
    } finally {
      inFlight = false;
    }
  }

  function run() {
    if (disposed) return;
    void opts.persistLocal();
    opts.onStatusChange("saving");
    clearTimer();
    if (debounceMs <= 0) {
      void attemptSync();
    } else {
      timer = setTimeout(() => void attemptSync(), debounceMs);
    }
  }

  function retry() {
    if (disposed) return;
    clearTimer();
    void attemptSync();
  }

  function dispose() {
    disposed = true;
    clearTimer();
  }

  return { run, retry, dispose };
}
