-- 0011 — code_runs: one row per code-lab execution.
--
-- Backs two backend concerns on the (compute-heavy, paid) runner path:
--   1. per-user rate limiting — count a learner's runs in a window, and
--   2. ownership — a learner may only poll a run they started.
-- Same posture as the other graded tables (invariant 2): read-own RLS, written
-- only by the service role inside the code-lab server actions.

create table public.code_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  runner text not null,
  run_id text not null,
  status text not null default 'queued',
  passed boolean,
  created_at timestamptz not null default now()
);

alter table public.code_runs enable row level security;

create policy "users read own code runs"
  on public.code_runs for select
  using ((select auth.uid()) = user_id);
-- no insert/update policy: written by the service role (code-lab actions) only

-- Rate-limit counting: runs per user per time window.
create index code_runs_user_created on public.code_runs (user_id, created_at);
-- Ownership lookup on poll: a run_id is only valid for its owner.
create index code_runs_run_id on public.code_runs (run_id);
