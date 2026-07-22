/**
 * Streak DB wrapper — reads the learner's current streak row, advances it via
 * the pure computeStreakUpdate, and upserts under the service role. Same
 * split as lib/code-runs.ts: this file is plain logic (not "use server"), so
 * every XP-writing server action can call it without another network hop.
 *
 * Invariant 2 holds by construction: `streaks` has no insert/update policy
 * (migration 20260722000032) — only the service role writes, same as
 * xp_events/note_progress. touchStreak is idempotent per UTC day (see
 * computeStreakUpdate), so calling it from all four XP sources (notes, note
 * labs, lessons, tasks) costs nothing extra on a day with multiple actions.
 */

import { computeStreakUpdate, type StreakState } from "@qa-mastery/grading";
import type { SupabaseClient } from "@supabase/supabase-js";

interface StreakRow {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  freeze_tokens: number;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Advance the learner's streak for today. Best-effort by design (callers
 *  should not let a streak-write failure fail the XP-earning action it rides
 *  along with) — errors are swallowed after logging, same posture as the
 *  audit_events writes elsewhere in this app. */
export async function touchStreak(service: SupabaseClient, userId: string): Promise<void> {
  try {
    const { data } = await service
      .from("streaks")
      .select("current_streak, longest_streak, last_active_date, freeze_tokens")
      .eq("user_id", userId)
      .maybeSingle<StreakRow>();

    const current: StreakState = data
      ? {
          currentStreak: data.current_streak,
          longestStreak: data.longest_streak,
          lastActiveDate: data.last_active_date,
          freezeTokens: data.freeze_tokens,
        }
      : { currentStreak: 0, longestStreak: 0, lastActiveDate: null, freezeTokens: 0 };

    const { next, changed } = computeStreakUpdate(current, todayUTC());
    if (!changed) return;

    const { error } = await service.from("streaks").upsert(
      {
        user_id: userId,
        current_streak: next.currentStreak,
        longest_streak: next.longestStreak,
        last_active_date: next.lastActiveDate,
        freeze_tokens: next.freezeTokens,
      },
      { onConflict: "user_id" },
    );
    if (error) console.error("streaks upsert failed:", error.message);
  } catch (e) {
    console.error("touchStreak failed:", e instanceof Error ? e.message : e);
  }
}
