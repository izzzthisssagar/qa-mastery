-- 0028 — Tasks: system-assigned graded practice + a personal planner.
--
-- Three tables, split deliberately to preserve the learners-never-write-scores
-- invariant structurally:
--   • tasks              — checked-in templates, service-role seeded, public read.
--   • user_tasks         — the learner's own rows. task_id null = a personal
--                          todo they authored; task_id set = an instance of a
--                          system task. Learners CRUD their own via RLS.
--   • user_task_grades   — scores. Service-role WRITE only (no insert/update
--                          policy at all), learner read-own. There is zero
--                          learner write path to a grade.
-- Conventions from communities (0027) / talent (0017): RLS-first, own-row CRUD,
-- service-role for anything scored. Module refs are curriculum slugs (the
-- curriculum lives on the filesystem, so no FK).

-- ── shared updated_at trigger (idempotent) ───────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── task templates ───────────────────────────────────────────────────────────
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug = lower(slug) and char_length(slug) between 2 and 80),
  title text not null check (char_length(title) between 1 and 200),
  summary text check (char_length(summary) <= 500),
  kind text not null
    check (kind in ('bug_hunt', 'api_bug_hunt', 'test_design', 'custom')),
  module_id text,
  target text check (target in ('buggyshop', 'buggyapi')),
  criteria jsonb not null default '{}'::jsonb,
  xp integer not null default 0 check (xp >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index tasks_module on public.tasks (module_id) where archived_at is null;

-- ── the learner's tasks (assigned instances + personal todos) ────────────────
create table public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  title text check (char_length(title) <= 200),
  notes text check (char_length(notes) <= 2000),
  due_date date,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- a personal todo (no task_id) must carry its own title.
  constraint user_task_titled check (task_id is not null or title is not null)
);

create index user_tasks_owner on public.user_tasks (user_id, status);
create unique index user_tasks_one_per_task
  on public.user_tasks (user_id, task_id) where task_id is not null;

create trigger user_tasks_updated_at
  before update on public.user_tasks
  for each row execute function public.set_updated_at();

-- ── grades (service-role only) ───────────────────────────────────────────────
create table public.user_task_grades (
  id uuid primary key default gen_random_uuid(),
  user_task_id uuid not null references public.user_tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null,
  passed boolean not null,
  detail jsonb not null default '{}'::jsonb,
  graded_at timestamptz not null default now()
);

create index user_task_grades_owner on public.user_task_grades (user_id);
create unique index user_task_grades_one_per_user_task
  on public.user_task_grades (user_task_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.tasks             enable row level security;
alter table public.user_tasks        enable row level security;
alter table public.user_task_grades  enable row level security;

-- tasks: public read of live templates; writes are service-role only.
create policy "anyone reads live tasks" on public.tasks for select
  using (archived_at is null);

-- user_tasks: full own-row CRUD.
create policy "user reads own user_tasks" on public.user_tasks for select
  using ((select auth.uid()) = user_id);
create policy "user inserts own user_tasks" on public.user_tasks for insert
  with check ((select auth.uid()) = user_id);
create policy "user updates own user_tasks" on public.user_tasks for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "user deletes own user_tasks" on public.user_tasks for delete
  using ((select auth.uid()) = user_id);

-- grades: recipient reads own. No insert/update/delete policy — scores are
-- written by the service role only (mirrors xp_events / bug_reports).
create policy "user reads own task grades" on public.user_task_grades for select
  using ((select auth.uid()) = user_id);

-- ── seed system task templates ───────────────────────────────────────────────
-- Checked-in starter tasks so the assigned section is populated. Criteria are
-- graded by gradeTask against service-role-scored evidence. Upsert-on-slug so
-- re-running is safe; later tasks can be synced via scripts/sync.ts.
insert into public.tasks (slug, title, summary, kind, module_id, target, criteria, xp) values
  ('first-blood', 'First blood', 'File your first valid bug report in BuggyShop.',
   'bug_hunt', null, 'buggyshop', '{"minValidBugs": 1}'::jsonb, 25),
  ('bug-hunter', 'Bug hunter', 'Find and report 5 valid bugs across the practice apps.',
   'bug_hunt', null, 'buggyshop', '{"minValidBugs": 5}'::jsonb, 75),
  ('test-author', 'Test author', 'Author 3 test cases in the test-case workspace.',
   'test_design', null, null, '{"minTestCases": 3}'::jsonb, 50)
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, kind = excluded.kind,
  criteria = excluded.criteria, xp = excluded.xp, archived_at = null;
