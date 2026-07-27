import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAutosave, type SaveStatus } from "./autosave";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createAutosave", () => {
  it("persists local state immediately and syncs without delay when debounceMs is unset (discrete actions, e.g. a click)", async () => {
    const statuses: SaveStatus[] = [];
    const persistLocal = vi.fn().mockResolvedValue(undefined);
    const sync = vi.fn().mockResolvedValue(undefined);
    const controller = createAutosave({
      persistLocal,
      sync,
      onStatusChange: (s) => statuses.push(s),
    });

    controller.run();
    expect(persistLocal).toHaveBeenCalledTimes(1);
    await vi.runAllTimersAsync();

    expect(sync).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual(["saving", "saving", "saved"]);
  });

  it("debounces the sync but writes local state before the debounce window", async () => {
    const statuses: SaveStatus[] = [];
    const persistLocal = vi.fn().mockResolvedValue(undefined);
    const sync = vi.fn().mockResolvedValue(undefined);
    const controller = createAutosave({
      persistLocal,
      sync,
      onStatusChange: (s) => statuses.push(s),
      debounceMs: 800,
    });

    controller.run();
    expect(persistLocal).toHaveBeenCalledTimes(1);
    expect(sync).not.toHaveBeenCalled();

    // A second edit within the debounce window resets the timer and does not
    // fire a second sync for the first edit.
    vi.advanceTimersByTime(400);
    controller.run();
    vi.advanceTimersByTime(400);
    expect(sync).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(400);
    expect(sync).toHaveBeenCalledTimes(1);
    expect(statuses.at(-1)).toBe("saved");
  });

  it("reports 'error' on a failed sync, not a silent success, and retry() can recover it", async () => {
    const statuses: SaveStatus[] = [];
    const persistLocal = vi.fn().mockResolvedValue(undefined);
    const sync = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(undefined);
    const controller = createAutosave({
      persistLocal,
      sync,
      onStatusChange: (s) => statuses.push(s),
    });

    controller.run();
    await vi.runAllTimersAsync();
    expect(statuses).toEqual(["saving", "saving", "error"]);

    controller.retry();
    await vi.runAllTimersAsync();
    expect(sync).toHaveBeenCalledTimes(2);
    expect(statuses.at(-1)).toBe("saved");
  });

  it("stops reporting status changes after dispose()", async () => {
    const statuses: SaveStatus[] = [];
    const persistLocal = vi.fn().mockResolvedValue(undefined);
    let resolveSync: () => void = () => {};
    const sync = vi.fn(() => new Promise<void>((resolve) => (resolveSync = resolve)));
    const controller = createAutosave({
      persistLocal,
      sync,
      onStatusChange: (s) => statuses.push(s),
    });

    controller.run();
    controller.dispose();
    resolveSync();
    await Promise.resolve();
    await Promise.resolve();

    expect(statuses).not.toContain("saved");
  });
});
