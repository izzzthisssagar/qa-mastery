-- 0016 — test_cases: learner-authored test cases (full CRUD on own rows).
--
-- Unlike scores / bug_reports (invariant 2), test cases are the learner's OWN
-- working artifacts, not graded output — so they get select/insert/update/delete
-- on their own rows, with RLS pinning user_id to auth.uid().

create table public.test_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  preconditions text not null default '',
  steps jsonb not null default '[]'::jsonb,
  expected text not null default '',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'passed', 'failed', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.test_cases enable row level security;

create policy "users read own test cases"
  on public.test_cases for select
  using ((select auth.uid()) = user_id);

create policy "users insert own test cases"
  on public.test_cases for insert
  with check ((select auth.uid()) = user_id);

create policy "users update own test cases"
  on public.test_cases for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users delete own test cases"
  on public.test_cases for delete
  using ((select auth.uid()) = user_id);

create index test_cases_user on public.test_cases (user_id, created_at desc);

create trigger test_cases_set_updated_at
  before update on public.test_cases
  for each row execute function public.set_updated_at();
