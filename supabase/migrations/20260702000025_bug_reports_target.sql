-- 0025 — bug_reports learns which practice app a report targets.
-- BuggyShop reports predate the column, so the default backfills them.
-- BuggyAPI reports reuse page/feature as endpoint/surface (one graded
-- artifact table, one RLS story — invariant 2 untouched: service-role writes
-- only, learners read their own). BuggyAPI reports are NOT lesson-tied (no
-- API lessons yet), so lesson_id becomes nullable.

alter table public.bug_reports
  add column target text not null default 'buggyshop'
  check (target in ('buggyshop', 'buggyapi'));

alter table public.bug_reports
  alter column lesson_id drop not null;

create index bug_reports_target on public.bug_reports (user_id, target);
