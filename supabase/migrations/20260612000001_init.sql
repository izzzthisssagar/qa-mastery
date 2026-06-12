-- 0001 — platform core: profiles, lesson registry, progress, sandboxes.
--
-- Conventions (architecture plan):
--   * RLS default-deny: enable RLS everywhere, add ONLY the policies below.
--   * Learners never write scores or registry rows — those writes go through
--     the service role (grading, curriculum sync), which bypasses RLS.
--   * Slugs are the stable keys the curriculum sync upserts on.

-- ── helpers ──────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles ─────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- public read feeds future portfolio pages; only the owner may update
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(coalesce(new.email, 'learner'), '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── lesson registry (rows written only by the curriculum sync) ───────────

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  order_index integer not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  slug text not null unique,
  title text not null,
  order_index integer not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  slug text not null unique,
  title text not null,
  order_index integer not null default 0,
  free boolean not null default false,
  duration_min integer,
  lab_type text not null default 'none'
    check (lab_type in ('none', 'test_design', 'bug_report', 'code_run', 'artifact')),
  requires_release text,
  content_hash text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tracks enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;

-- registry is metadata-only and clients see published rows only;
-- drafts/archived stay server-side (sync + admin use the service role)
create policy "published tracks are readable"
  on public.tracks for select
  using (status = 'published');

create policy "published modules are readable"
  on public.modules for select
  using (status = 'published');

create policy "published lessons are readable"
  on public.lessons for select
  using (status = 'published');

create trigger tracks_updated_at
  before update on public.tracks
  for each row execute function public.set_updated_at();

create trigger modules_updated_at
  before update on public.modules
  for each row execute function public.set_updated_at();

create trigger lessons_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

create index modules_track_order on public.modules (track_id, order_index);
create index lessons_module_order on public.lessons (module_id, order_index);

-- ── progress (self-reported step state; low stakes, owner read/write) ────

create table public.progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete restrict,
  status text not null default 'started'
    check (status in ('started', 'completed')),
  -- per-step completion: {"see": true, "try": true, "do": false, "prove": false}
  step_state jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.progress enable row level security;

create policy "users read own progress"
  on public.progress for select
  using ((select auth.uid()) = user_id);

create policy "users insert own progress"
  on public.progress for insert
  with check ((select auth.uid()) = user_id);

create policy "users update own progress"
  on public.progress for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger progress_updated_at
  before update on public.progress
  for each row execute function public.set_updated_at();

-- ── sandboxes (one BuggyShop data sandbox per learner) ───────────────────

create table public.sandboxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  current_release text not null default '1.0'
    check (current_release in ('1.0', '1.1', '2.0')),
  status text not null default 'active'
    check (status in ('active', 'resetting')),
  last_reset_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.sandboxes enable row level security;

create policy "users read own sandbox"
  on public.sandboxes for select
  using ((select auth.uid()) = user_id);
-- no client write policies: provisioning/reset are service-role RPCs (M1)

-- ── buggyshop schema ─────────────────────────────────────────────────────
-- bs_* tables land in M1 (migration 0002). The schema + grants exist from
-- day one so the exposed-schema list and privileges never need migrating.
-- Deny-all by design: no grants to anon/authenticated, zero RLS policies.

create schema if not exists buggyshop;

grant usage on schema buggyshop to service_role;
alter default privileges in schema buggyshop grant all on tables to service_role;
alter default privileges in schema buggyshop grant all on sequences to service_role;
alter default privileges in schema buggyshop grant all on functions to service_role;
