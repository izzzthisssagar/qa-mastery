-- 0010 — help agent: short-term chat, long-term brain profile, episodic memories.
--
-- Invariant: learners read own rows; all writes go through the service role
-- (same pattern as quiz_attempts / bug_reports).

-- ── short-term chat (7-day rolling window) ───────────────────────────────

create table public.help_agent_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  pathname text,
  lesson_slug text,
  session_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.help_agent_messages enable row level security;

create policy "users read own help messages"
  on public.help_agent_messages for select
  using ((select auth.uid()) = user_id);

create index help_agent_messages_user_created
  on public.help_agent_messages (user_id, created_at desc);

create index help_agent_messages_session
  on public.help_agent_messages (user_id, session_id);

-- ── long-term brain profile (one row per learner) ────────────────────────

create table public.help_agent_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  summary text not null default '',
  weak_topics text[] not null default '{}',
  strong_topics text[] not null default '{}',
  topic_mastery jsonb not null default '{}'::jsonb,
  hint_preference text not null default 'hybrid'
    check (hint_preference in ('socratic', 'direct', 'hybrid')),
  stuck_lessons text[] not null default '{}',
  brain_stage text not null default 'new'
    check (brain_stage in ('new', 'learning', 'patterns', 'mentor')),
  brain_day_count integer not null default 0,
  first_active_at timestamptz,
  last_active_at timestamptz,
  last_consolidated_at timestamptz,
  total_messages integer not null default 0,
  total_sessions integer not null default 0,
  profile_updated_at timestamptz not null default now()
);

alter table public.help_agent_profiles enable row level security;

create policy "users read own help profile"
  on public.help_agent_profiles for select
  using ((select auth.uid()) = user_id);

-- ── episodic long-term memories ──────────────────────────────────────────

create table public.help_agent_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('breakthrough', 'confusion', 'preference', 'milestone')),
  content text not null,
  lesson_slug text,
  importance smallint not null default 5 check (importance between 1 and 10),
  created_at timestamptz not null default now(),
  last_recalled_at timestamptz
);

alter table public.help_agent_memories enable row level security;

create policy "users read own help memories"
  on public.help_agent_memories for select
  using ((select auth.uid()) = user_id);

create index help_agent_memories_user
  on public.help_agent_memories (user_id, importance desc, created_at desc);
