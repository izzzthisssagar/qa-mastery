-- 0005 — bug_reports: graded BuggyShop bug-report lab submissions.
--
-- Same posture as quiz_attempts (invariant 2): the score is written only by the
-- grading server action via the service role; learners read their own rows and
-- have no insert/update policy, so they can't write their own score.

create table public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  -- the seeded bug this report matched, if any (null = no match)
  matched_bug_id text,
  page text not null,
  feature text not null,
  category text not null,
  severity text not null
    check (severity in ('trivial', 'minor', 'major', 'critical', 'blocker')),
  title text not null,
  steps jsonb not null default '[]'::jsonb,
  expected text not null default '',
  actual text not null default '',
  score integer not null,
  matched boolean not null,
  duplicate boolean not null,
  feedback jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.bug_reports enable row level security;

create policy "users read own bug reports"
  on public.bug_reports for select
  using ((select auth.uid()) = user_id);
-- no insert/update policy: only the service role writes scores

create index bug_reports_user_lesson on public.bug_reports (user_id, lesson_id);
