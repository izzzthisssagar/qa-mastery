-- 0007 — capstone_submissions: the graded test-plan + ship-call deliverable.
--
-- Same posture as the other graded tables (invariant 2): read-own RLS, written
-- only by the service role inside the grading server action.

create table public.capstone_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  scope text not null,
  risks text not null,
  approach text not null,
  recommendation text not null
    check (recommendation in ('go', 'no-go', 'go-with-conditions')),
  checklist jsonb not null default '[]'::jsonb,
  score integer not null,
  created_at timestamptz not null default now()
);

alter table public.capstone_submissions enable row level security;

create policy "users read own capstone submissions"
  on public.capstone_submissions for select
  using ((select auth.uid()) = user_id);
-- no insert/update policy: written by the service role (grading action) only

create index capstone_submissions_user_lesson
  on public.capstone_submissions (user_id, lesson_id);
