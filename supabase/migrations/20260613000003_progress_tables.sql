-- 0003 — quiz attempts, spaced-repetition review queue, XP ledger.
--
-- Invariant (architecture plan): learners NEVER write their own scores. These
-- tables get read-own RLS for the learner; all score/XP inserts go through the
-- service role inside server actions (which bypass RLS). The one exception is
-- review_queue, whose scheduling is self-reported and low-stakes, so the owner
-- may update it directly.

-- ── quiz attempts (scores written only by the grading server action) ─────

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  attempt_no integer not null,
  score integer not null,
  max_score integer not null,
  passed boolean not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id, attempt_no)
);

alter table public.quiz_attempts enable row level security;

create policy "users read own quiz attempts"
  on public.quiz_attempts for select
  using ((select auth.uid()) = user_id);
-- no insert/update policy: only the service role writes scores

create index quiz_attempts_user_lesson
  on public.quiz_attempts (user_id, lesson_id);

-- ── spaced-repetition review queue (SM-2-lite; owner-managed) ────────────

create table public.review_queue (
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_key text not null,
  lesson_id uuid references public.lessons (id) on delete set null,
  front text not null,
  back text not null,
  due_at timestamptz not null default now(),
  interval_days integer not null default 1,
  ease numeric(4, 2) not null default 2.50,
  reps integer not null default 0,
  lapses integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, card_key)
);

alter table public.review_queue enable row level security;

create policy "users read own review queue"
  on public.review_queue for select
  using ((select auth.uid()) = user_id);

create policy "users insert own review cards"
  on public.review_queue for insert
  with check ((select auth.uid()) = user_id);

create policy "users update own review cards"
  on public.review_queue for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index review_queue_due on public.review_queue (user_id, due_at);

create trigger review_queue_updated_at
  before update on public.review_queue
  for each row execute function public.set_updated_at();

-- ── XP ledger (append-only; written by server actions only) ──────────────

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text not null,
  ref_id text,
  created_at timestamptz not null default now()
);

alter table public.xp_events enable row level security;

create policy "users read own xp"
  on public.xp_events for select
  using ((select auth.uid()) = user_id);
-- no insert policy: XP is awarded by the service role only

create index xp_events_user on public.xp_events (user_id);
