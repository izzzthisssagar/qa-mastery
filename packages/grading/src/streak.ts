/**
 * Streak calculation — pure, no DB, no service role. The DB-touching wrapper
 * lives in apps/platform/src/lib/streaks.ts (mirrors lib/code-runs.ts's split
 * between "plain logic" and "the thing that reads/writes a row"), which calls
 * this after reading the learner's current row and upserts the result.
 *
 * Day boundary is UTC, matching the existing convention in lib/code-runs.ts's
 * daily code-run quota — there's no per-user timezone column anywhere in this
 * schema, so a global UTC day is the only boundary the DB layer can compute
 * without guessing. Known limitation, not silently solved: a learner near
 * midnight in a non-UTC zone can see a "same sitting" cross two UTC days (+2
 * credited) or the reverse.
 */

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  /** YYYY-MM-DD, UTC. null means the learner has never been credited. */
  lastActiveDate: string | null;
  freezeTokens: number;
}

export interface StreakUpdate {
  next: StreakState;
  /** false when today was already credited — callers use this to skip the
   *  write entirely, since every XP-earning action calls this and only the
   *  first one each day should touch the row. */
  changed: boolean;
  usedFreeze: boolean;
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(b) - Date.parse(a)) / msPerDay);
}

/**
 * Advance a streak to `todayISODate` (YYYY-MM-DD, UTC).
 *
 * - Same day as last credit: no-op (changed: false) — idempotent under
 *   multiple XP-earning actions in one day.
 * - Exactly one day since last credit: increments.
 * - Exactly two days since last credit, with a freeze token available:
 *   consumes one freeze, still increments (the gap is forgiven).
 * - Anything else (a real gap, or first-ever activity): resets to 1.
 */
export function computeStreakUpdate(current: StreakState, todayISODate: string): StreakUpdate {
  if (current.lastActiveDate === todayISODate) {
    return { next: current, changed: false, usedFreeze: false };
  }

  const gap = current.lastActiveDate ? daysBetween(current.lastActiveDate, todayISODate) : null;

  if (gap === 1) {
    const currentStreak = current.currentStreak + 1;
    return {
      next: {
        currentStreak,
        longestStreak: Math.max(current.longestStreak, currentStreak),
        lastActiveDate: todayISODate,
        freezeTokens: current.freezeTokens,
      },
      changed: true,
      usedFreeze: false,
    };
  }

  if (gap === 2 && current.freezeTokens > 0) {
    const currentStreak = current.currentStreak + 1;
    return {
      next: {
        currentStreak,
        longestStreak: Math.max(current.longestStreak, currentStreak),
        lastActiveDate: todayISODate,
        freezeTokens: current.freezeTokens - 1,
      },
      changed: true,
      usedFreeze: true,
    };
  }

  return {
    next: {
      currentStreak: 1,
      longestStreak: Math.max(current.longestStreak, 1),
      lastActiveDate: todayISODate,
      freezeTokens: current.freezeTokens,
    },
    changed: true,
    usedFreeze: false,
  };
}
