import { describe, expect, it } from "vitest";
import { computeStreakUpdate, type StreakState } from "../src/streak";

const FRESH: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  freezeTokens: 0,
};

describe("computeStreakUpdate", () => {
  it("first-ever activity starts a streak of 1", () => {
    const { next, changed } = computeStreakUpdate(FRESH, "2026-07-01");
    expect(changed).toBe(true);
    expect(next).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: "2026-07-01",
      freezeTokens: 0,
    });
  });

  it("a second action the same day is a no-op — idempotent across multiple XP sources", () => {
    const day1 = computeStreakUpdate(FRESH, "2026-07-01").next;
    const { next, changed } = computeStreakUpdate(day1, "2026-07-01");
    expect(changed).toBe(false);
    expect(next).toEqual(day1);
  });

  it("the very next day increments and raises the longest streak", () => {
    const day1 = computeStreakUpdate(FRESH, "2026-07-01").next;
    const { next, changed } = computeStreakUpdate(day1, "2026-07-02");
    expect(changed).toBe(true);
    expect(next.currentStreak).toBe(2);
    expect(next.longestStreak).toBe(2);
  });

  it("a real gap (3+ days) resets to 1, even with a long prior streak", () => {
    let state = FRESH;
    for (const day of ["2026-07-01", "2026-07-02", "2026-07-03"]) {
      state = computeStreakUpdate(state, day).next;
    }
    expect(state.currentStreak).toBe(3);

    const { next } = computeStreakUpdate(state, "2026-07-07");
    expect(next.currentStreak).toBe(1);
    // longest streak is a high-water mark — a reset never erases it.
    expect(next.longestStreak).toBe(3);
  });

  it("a one-day gap with zero freeze tokens resets, not forgives", () => {
    const day1 = computeStreakUpdate(FRESH, "2026-07-01").next;
    const { next } = computeStreakUpdate(day1, "2026-07-03");
    expect(next.currentStreak).toBe(1);
  });

  it("a one-day gap WITH a freeze token forgives it and consumes the token", () => {
    const day1 = { ...computeStreakUpdate(FRESH, "2026-07-01").next, freezeTokens: 1 };
    const { next, usedFreeze } = computeStreakUpdate(day1, "2026-07-03");
    expect(usedFreeze).toBe(true);
    expect(next.currentStreak).toBe(2);
    expect(next.freezeTokens).toBe(0);
  });

  it("a freeze only forgives a single missed day, not two", () => {
    const day1 = { ...computeStreakUpdate(FRESH, "2026-07-01").next, freezeTokens: 1 };
    const { next, usedFreeze } = computeStreakUpdate(day1, "2026-07-04");
    expect(usedFreeze).toBe(false);
    expect(next.currentStreak).toBe(1);
    // the token is untouched — it only spends on a genuine 2-day gap.
    expect(next.freezeTokens).toBe(1);
  });
});
