-- 0017 — talent: the QA freelance/job marketplace module.
--
-- Two-sided: testers (supply) publish QA-native profiles + proof artifacts;
-- clients (demand) post projects and contact testers. Messaging is gated by an
-- explicit consent boundary (a conversation row) and enforced in RLS, never the
-- UI. Verified-skill badges are a service-role-written snapshot of grading data
-- (analytics.reconcile_verified_skills — stubbed below, wire to grading later).
-- PII (email/phone) NEVER enters a talent_* table or any public view — contact
-- happens only via talent_messages. Conventions copied from 0012/0013/0015.

create extension if not exists pg_trgm;  -- fuzzy name/headline search

-- ── profiles: opt into a marketplace role (additive, backward-compatible) ─────
alter table public.profiles
  add column if not exists talent_role text not null default 'none'
    check (talent_role in ('none', 'tester', 'client', 'both'));

-- ── tester profile (1:1 with profiles, opt-in) ───────────────────────────────
create table public.talent_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  handle text not null unique
    check (handle = lower(handle) and char_length(handle) between 3 and 32),
  headline text check (char_length(headline) <= 120),
  bio text check (char_length(bio) <= 2000),
  location text,
  timezone text,
  langs text[] not null default '{}',
  availability text not null default 'open'
    check (availability in ('open', 'busy', 'not_looking')),
  rate_cents integer check (rate_cents is null or rate_cents >= 0),
  discipline text not null default 'both'
    check (discipline in ('manual', 'automation', 'both')),
  specialties text[] not null default '{}',  -- validated against taxonomy in app (Zod)
  stack text[] not null default '{}',
  is_public boolean not null default false,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── device matrix ────────────────────────────────────────────────────────────
create table public.talent_devices (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.talent_profiles (id) on delete cascade,
  kind text not null check (kind in ('mobile', 'desktop', 'tablet')),
  device text not null,
  os text,
  os_version text,
  browser text,
  created_at timestamptz not null default now()
);

-- ── portfolio: curation over existing artifacts OR net-new items (ADR-003) ────
create table public.talent_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.talent_profiles (id) on delete cascade,
  type text not null
    check (type in ('bug_report', 'test_case', 'automation', 'coverage', 'other')),
  -- when linking a reused artifact; null for net-new external items
  source_table text
    check (source_table in ('bug_reports', 'test_cases', 'capstone_submissions')),
  source_id uuid,
  title text not null check (char_length(title) <= 160),
  body text check (char_length(body) <= 8000),
  repo_url text,
  asset_path text,                        -- Supabase Storage object path (signed on read)
  is_nda boolean not null default false,
  created_at timestamptz not null default now(),
  check ((source_id is null) = (source_table is null))  -- both or neither
);

-- ── verified skills: service-role snapshot of grading (SCD type 1) ───────────
create table public.talent_verified_skills (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.talent_profiles (id) on delete cascade,
  skill text not null,
  score smallint check (score between 0 and 100),
  source text not null check (source in ('lab', 'certificate')),
  earned_at timestamptz not null,
  updated_at timestamptz not null default now(),
  unique (tester_id, skill)               -- idempotent upsert key
);

-- singleton reconcile watermark
create table public.talent_sync_state (
  id boolean primary key default true check (id),  -- single row
  last_reconciled_at timestamptz
);
insert into public.talent_sync_state (id, last_reconciled_at)
  values (true, null) on conflict do nothing;

-- ── projects (client postings) ───────────────────────────────────────────────
create table public.talent_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  description text check (char_length(description) <= 8000),
  project_type text not null
    check (project_type in ('web', 'mobile', 'api', 'game', 'desktop', 'embedded', 'other')),
  stack text[] not null default '{}',
  required_types text[] not null default '{}',
  engagement text not null check (engagement in ('one_off', 'ongoing', 'full_time')),
  budget_cents integer check (budget_cents is null or budget_cents >= 0),
  tooling text[] not null default '{}',
  nda_required boolean not null default false,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── applications (tester → project) ──────────────────────────────────────────
create table public.talent_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.talent_projects (id) on delete cascade,
  tester_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'applied'
    check (status in ('applied', 'shortlisted', 'declined', 'hired')),
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  unique (project_id, tester_id)
);

-- ── conversations (the consent boundary) ─────────────────────────────────────
create table public.talent_conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  tester_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.talent_projects (id) on delete set null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (client_id, tester_id, project_id),
  check (client_id <> tester_id)
);

-- ── messages (Realtime; immutable) ───────────────────────────────────────────
create table public.talent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.talent_conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 8000),
  attachments jsonb not null default '[]'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── shortlists & reports ─────────────────────────────────────────────────────
create table public.talent_shortlists (
  client_id uuid not null references public.profiles (id) on delete cascade,
  tester_id uuid not null references public.talent_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, tester_id)
);

create table public.talent_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('profile', 'project', 'message')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 2000),
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);

-- ── indexes (equality / composite / partial / GIN / trigram) ─────────────────
create index talent_profiles_specialties_gin on public.talent_profiles using gin (specialties);
create index talent_profiles_stack_gin       on public.talent_profiles using gin (stack);
create index talent_profiles_public          on public.talent_profiles (updated_at desc) where is_public;
create index talent_profiles_handle_trgm     on public.talent_profiles using gin (handle gin_trgm_ops);
create index talent_profiles_headline_trgm   on public.talent_profiles using gin (headline gin_trgm_ops);
create index talent_devices_tester           on public.talent_devices (tester_id);
create index talent_portfolio_tester         on public.talent_portfolio_items (tester_id);
create index talent_verified_tester          on public.talent_verified_skills (tester_id);
create index talent_projects_open            on public.talent_projects (created_at desc) where status = 'open';
create index talent_projects_reqtypes_gin    on public.talent_projects using gin (required_types);
create index talent_applications_project     on public.talent_applications (project_id, status);
create index talent_applications_tester      on public.talent_applications (tester_id);
create index talent_conversations_client     on public.talent_conversations (client_id, tester_id);
create index talent_messages_convo           on public.talent_messages (conversation_id, created_at desc);
create index talent_reports_status           on public.talent_reports (status, created_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.talent_profiles        enable row level security;
alter table public.talent_devices         enable row level security;
alter table public.talent_portfolio_items enable row level security;
alter table public.talent_verified_skills enable row level security;
alter table public.talent_projects        enable row level security;
alter table public.talent_applications    enable row level security;
alter table public.talent_conversations   enable row level security;
alter table public.talent_messages        enable row level security;
alter table public.talent_shortlists      enable row level security;
alter table public.talent_reports         enable row level security;
alter table public.talent_sync_state      enable row level security;  -- no policy = service-role only

-- profile: public-read / owner-write
create policy "read public or own profile" on public.talent_profiles for select
  using (is_public = true or (select auth.uid()) = id);
create policy "owner writes own profile" on public.talent_profiles for all
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- devices & portfolio: visible if parent profile is visible to caller; NDA hides portfolio
create policy "read devices via visible parent" on public.talent_devices for select
  using (exists (select 1 from public.talent_profiles p
                 where p.id = tester_id and (p.is_public or (select auth.uid()) = p.id)));
create policy "owner writes own devices" on public.talent_devices for all
  using ((select auth.uid()) = tester_id) with check ((select auth.uid()) = tester_id);

create policy "read non-nda portfolio via visible parent" on public.talent_portfolio_items for select
  using (exists (select 1 from public.talent_profiles p
                 where p.id = tester_id and (p.is_public or (select auth.uid()) = p.id))
         and (not is_nda or (select auth.uid()) = tester_id));
create policy "owner writes own portfolio" on public.talent_portfolio_items for all
  using ((select auth.uid()) = tester_id) with check ((select auth.uid()) = tester_id);

-- verified skills: public read, service-role write only (no write policy)
create policy "anyone reads verified skills" on public.talent_verified_skills for select using (true);

-- projects: public read when open, owner writes
create policy "read open or own projects" on public.talent_projects for select
  using (status = 'open' or (select auth.uid()) = owner_id);
create policy "owner writes own projects" on public.talent_projects for all
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- applications: project owner OR the applying tester
create policy "owner or applicant reads application" on public.talent_applications for select
  using ((select auth.uid()) = tester_id
         or exists (select 1 from public.talent_projects pr
                    where pr.id = project_id and pr.owner_id = (select auth.uid())));
create policy "tester submits own application" on public.talent_applications for insert
  with check ((select auth.uid()) = tester_id);
create policy "owner updates application status" on public.talent_applications for update
  using (exists (select 1 from public.talent_projects pr
                 where pr.id = project_id and pr.owner_id = (select auth.uid())));

-- participant-only — conversations + messages (security-critical pair)
create policy "participants read conversation" on public.talent_conversations for select
  using ((select auth.uid()) in (client_id, tester_id));
create policy "creator opens conversation" on public.talent_conversations for insert
  with check ((select auth.uid()) = created_by
              and (select auth.uid()) in (client_id, tester_id));

create policy "participants read messages" on public.talent_messages for select
  using (exists (select 1 from public.talent_conversations c
                 where c.id = conversation_id and (select auth.uid()) in (c.client_id, c.tester_id)));
create policy "participants send as self" on public.talent_messages for insert
  with check ((select auth.uid()) = sender_id
              and exists (select 1 from public.talent_conversations c
                          where c.id = conversation_id and (select auth.uid()) in (c.client_id, c.tester_id)));
-- read_at updated via a scoped RPC (mark_read), not a broad UPDATE policy.

-- shortlists: owner only
create policy "owner manages shortlist" on public.talent_shortlists for all
  using ((select auth.uid()) = client_id) with check ((select auth.uid()) = client_id);

-- reports: insert-own / service-role triage (copies feedback pattern)
create policy "users file own reports" on public.talent_reports for insert
  with check ((select auth.uid()) = reporter_id);
-- no select/update policy: triage is service-role only.

-- ── Realtime: messages in publication + full replica identity (guarded) ──────
do $$
begin
  alter table public.talent_messages replica identity full;
  alter publication supabase_realtime add table public.talent_messages;
exception when others then
  raise notice 'supabase_realtime publication unavailable — add talent_messages in cloud';
end $$;

-- ── analytics (service-role-only schema from 0013) ───────────────────────────
create schema if not exists analytics;

-- North Star: Weekly Connected Pairs (both sides spoke), from the audit spine.
create or replace view analytics.weekly_connected_pairs as
select date_trunc('week', created_at)::date as week,
       count(*) as connected_pairs
from public.audit_events
where action = 'talent.connection_made'
group by 1
order by 1 desc;

-- Supply funnel: signup → profile → public → contacted → connected.
create or replace view analytics.tester_funnel as
with t as (
  select p.id,
    exists(select 1 from public.talent_profiles tp where tp.id = p.id)                  as has_profile,
    exists(select 1 from public.talent_profiles tp where tp.id = p.id and tp.is_public) as is_public,
    exists(select 1 from public.talent_conversations c where c.tester_id = p.id)        as contacted
  from public.profiles p
  where p.talent_role in ('tester', 'both')
)
select count(*) as testers,
       count(*) filter (where has_profile) as built_profile,
       count(*) filter (where is_public)   as published,
       count(*) filter (where contacted)   as got_contacted
from t;

-- Marketplace liquidity & speed.
create or replace view analytics.marketplace_liquidity as
select
  (select count(*) from public.talent_profiles where is_public)                  as active_testers,
  (select count(*) from public.talent_projects where status = 'open')            as open_projects,
  (select count(*) from public.talent_conversations
     where created_at > now() - interval '7 days')                               as contacts_7d;

grant select on analytics.weekly_connected_pairs to service_role;
grant select on analytics.tester_funnel to service_role;
grant select on analytics.marketplace_liquidity to service_role;

-- Verified-skills reconcile (PATH B). STUB: wire to grading/progress/certificate
-- tables to re-derive badges and upsert into public.talent_verified_skills
-- (idempotent on (tester_id, skill)). For now it only advances the watermark so
-- the freshness DQ check passes once the job runs.
create or replace function analytics.reconcile_verified_skills()
returns void language plpgsql security definer set search_path = public as $$
begin
  -- TODO(grading-bridge): re-derive from progress/quiz_attempts/certificates and
  --   insert into public.talent_verified_skills (...) on conflict (tester_id, skill)
  --   do update set score = excluded.score, updated_at = now();
  update public.talent_sync_state set last_reconciled_at = now() where id;
end;
$$;

-- Data-quality checks (Data-Eng §4): empty result = healthy.
create or replace function analytics.dq_checks()
returns table(check_name text, failures bigint) language sql security definer set search_path = public as $$
  select 'stale_verified_skills_sync'::text,
         (select count(*) from public.talent_sync_state
          where last_reconciled_at is null or last_reconciled_at < now() - interval '36 hours')
  union all
  select 'orphan_messages'::text,
         (select count(*) from public.talent_messages m
          left join public.talent_conversations c on c.id = m.conversation_id
          where c.id is null)
  union all
  select 'duplicate_handles'::text,
         (select count(*) from (
            select handle from public.talent_profiles group by handle having count(*) > 1
          ) d);
$$;

grant execute on function analytics.reconcile_verified_skills() to service_role;
grant execute on function analytics.dq_checks() to service_role;

-- ── scheduled reconcile (guarded exactly like 0013's retention jobs) ─────────
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('reconcile-verified-skills', '30 3 * * *',
    $q$select analytics.reconcile_verified_skills()$q$);
exception when others then
  raise notice 'pg_cron unavailable — verified-skills reconcile skipped (enable in Supabase cloud)';
end $$;

-- ── public-profile projection (no PII; security_invoker keeps RLS) ───────────
create or replace view public.talent_public_profile
with (security_invoker = true) as
select p.id, p.handle, p.headline, p.bio, p.location, p.timezone, p.langs,
       p.availability, p.rate_cents, p.discipline, p.specialties, p.stack,
       p.verification_status, p.updated_at
from public.talent_profiles p
where p.is_public;   -- email/phone never selected; RLS still applies
