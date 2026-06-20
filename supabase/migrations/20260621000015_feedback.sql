-- 0015 — feedback: in-app product feedback / feature requests / praise.
--
-- Unlike scores (invariant 2), feedback is learner-authored content, so the
-- learner DOES insert their own rows (RLS check pins user_id to auth.uid()).
-- Triage fields (theme/status) default null/'new' and are filled out of band
-- by the founder via the service role (which bypasses RLS) — learners never
-- update them. Aggregated reads for triage also go through the service role.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- where in the app the learner was (e.g. 'lesson:bug-reporting', 'dashboard')
  context text,
  type text not null
    check (type in ('bug', 'feature', 'ux', 'content', 'pricing', 'praise')),
  message text not null check (char_length(message) between 1 and 4000),
  -- optional 1-5 satisfaction rating
  rating smallint check (rating is null or rating between 1 and 5),
  -- triage (service-role only; defaults so learners need not set them)
  theme text,
  status text not null default 'new'
    check (status in ('new', 'triaged', 'planned', 'shipped', 'announced')),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Learners insert their own feedback (user_id must be themselves).
create policy "users insert own feedback"
  on public.feedback for insert
  with check ((select auth.uid()) = user_id);

-- Learners read their own feedback (e.g. to see what they've submitted).
create policy "users read own feedback"
  on public.feedback for select
  using ((select auth.uid()) = user_id);

-- No update/delete policy: triage (theme/status) and aggregate reads are
-- service-role only.

create index feedback_user on public.feedback (user_id, created_at desc);
create index feedback_status on public.feedback (status);
