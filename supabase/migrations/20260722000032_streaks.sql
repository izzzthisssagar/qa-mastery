-- 0032 — Daily learning streaks.
--
-- The original plan named "progress/streaks/certificates" as Phase 1 scope;
-- certificates and XP shipped, streaks never did. Same invariant-2 shape as
-- every other score-bearing table (xp_events, note_progress): the touchStreak
-- wrapper (apps/platform/src/lib/streaks.ts) is called from every XP-writing
-- server action, computes the new state with the pure computeStreakUpdate
-- (packages/grading/src/streak.ts), and upserts under the service role.
-- Learners have no write path, so a streak can't be self-inflated.
--
-- freeze_tokens exists so the schema doesn't need a migration later if/when
-- a grace-period mechanic ships, but nothing GRANTS a token yet — how they'd
-- be earned (a milestone reward? a purchase? never?) is a product decision,
-- not an engineering one. Ships at 0 for every learner until that's decided.

create table public.streaks (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  freeze_tokens integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.streaks enable row level security;

-- read-own; no insert/update/delete policy — written by the service role
-- only. Mirrors xp_events / note_progress / user_task_grades.
create policy "users read own streak" on public.streaks for select
  using ((select auth.uid()) = user_id);

-- set_updated_at() already exists (20260612000001_init.sql, reused across
-- most timestamped tables) — reuse it here too, don't redefine it.
create trigger streaks_updated_at
  before update on public.streaks
  for each row execute function public.set_updated_at();
