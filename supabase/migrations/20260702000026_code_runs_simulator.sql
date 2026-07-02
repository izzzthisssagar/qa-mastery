-- 0026 — code_runs learns to hold standalone simulator runs.
--
-- The coding simulator ((app)/simulator) runs snippets with no lesson attached,
-- and Piston executes synchronously — so a run persists its final result inline
-- rather than being polled from an async runner. Three changes:
--   * lesson_id nullable   — standalone runs have no lesson.
--   * language text        — which of the 5 supported languages ran.
--   * result jsonb         — the full RunResult, so pollCodeRun can replay a
--                            synchronous run without re-executing it.
-- Invariant 2 is untouched: code_runs is not a score table; passes still flow
-- to progress via the service-role server action.

alter table public.code_runs
  alter column lesson_id drop not null;

alter table public.code_runs
  add column language text,
  add column result jsonb;

-- Standalone runs are queried by (user, created_at) for the per-user cooldown;
-- the existing daily-quota query already uses that pair, so no new index needed.
