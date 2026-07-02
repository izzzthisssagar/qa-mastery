-- 0024 — BuggyAPI practice-API tables + sandbox provisioning/reset.
--
-- BuggyAPI is the API-testing sibling of BuggyShop: a live, learnable API
-- ("TaskFlight" — a small project tracker) with real persistence, served with
-- auto-generated OpenAPI docs. Clean mode = perfect reference API; bug-hunt
-- mode seeds API bugs (Phase 1d).
--
-- Conventions (identical to 0002 / buggyshop):
--   * EVERY per-learner table carries sandbox_id → public.sandboxes
--     ON DELETE CASCADE (account deletion wipes practice data).
--   * Deny-all RLS: enabled on every table, zero policies. Only the service
--     role touches this schema.
--   * BuggyAPI "auth" is fake by design — ba_users / ba_api_keys /
--     ba_oauth_clients are curriculum props, not real identity. Credentials
--     are intentionally fake seed values inside an unreachable schema.
--   * public.sandboxes is REUSED (one sandbox per learner, shared with
--     BuggyShop) — no new sandbox table.

-- ── schema + service-role grants (mirrors init's buggyshop block) ─────────

create schema if not exists buggyapi;

grant usage on schema buggyapi to service_role;
alter default privileges in schema buggyapi grant all on tables to service_role;
alter default privileges in schema buggyapi grant all on sequences to service_role;
alter default privileges in schema buggyapi grant all on functions to service_role;

-- ── per-sandbox tables ───────────────────────────────────────────────────

-- Fake user accounts for Basic auth exercises (seeded creds referenced by docs).
create table buggyapi.ba_users (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  name text not null,
  email text not null,
  password text not null, -- fake creds for a fake API; deny-all schema
  role text not null default 'member' check (role in ('admin', 'member')),
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (sandbox_id, email)
);

-- API keys for X-API-Key auth exercises.
create table buggyapi.ba_api_keys (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  ba_user_id uuid not null references buggyapi.ba_users (id) on delete cascade,
  key text not null unique,
  label text not null default 'default',
  revoked boolean not null default false,
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Bearer sessions minted by POST /auth/login (fake login, real JWT-shaped flow).
create table buggyapi.ba_sessions (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  ba_user_id uuid not null references buggyapi.ba_users (id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- OAuth2 clients (client_credentials + auth-code flows land in Phase 1b).
create table buggyapi.ba_oauth_clients (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  client_id text not null unique,
  client_secret text not null, -- fake by design
  redirect_uri text,
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);

-- TaskFlight domain: projects contain tickets — natural CRUD + nesting +
-- pagination/filtering/sorting substrate.
create table buggyapi.ba_projects (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  key text not null, -- e.g. "TF" — short project key used in ticket refs
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sandbox_id, key)
);

create table buggyapi.ba_tickets (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  project_id uuid not null references buggyapi.ba_projects (id) on delete cascade,
  number integer not null, -- per-project sequence (TF-1, TF-2, …)
  title text not null,
  description text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid references buggyapi.ba_users (id) on delete set null,
  labels text[] not null default '{}',
  due_date date,
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, number)
);

-- File-upload exercise target (objects land in Storage bucket
-- `buggyapi-uploads`, path-prefixed by sandbox_id — Phase 1b).
create table buggyapi.ba_uploads (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  ticket_id uuid references buggyapi.ba_tickets (id) on delete cascade,
  file_name text not null,
  content_type text not null,
  size_bytes integer not null check (size_bytes >= 0),
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- Sliding-window rate-limit counters (teaches 429s without Redis — Phase 1b).
create table buggyapi.ba_rate_counters (
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  bucket text not null, -- e.g. "tickets:write"
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (sandbox_id, bucket, window_start)
);

-- Deterministic per-sandbox counters/flags (mirrors bs_sandbox_state).
create table buggyapi.ba_sandbox_state (
  sandbox_id uuid primary key references public.sandboxes (id) on delete cascade,
  counters jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Seeded-bug manifest (Phase 1d) — NEVER readable by clients; the platform
-- grades against it server-side. Same secrecy discipline as bs_bug_manifest.
create table buggyapi.ba_bug_manifest (
  bug_id text primary key,
  endpoint text not null,   -- e.g. "GET /v1/tickets"
  surface text not null,    -- e.g. "rest" | "graphql" | "soap" | "ws"
  category text not null,
  severity text not null
    check (severity in ('trivial', 'minor', 'major', 'critical', 'blocker')),
  title_internal text not null,
  trigger_internal text,
  repro_steps jsonb not null default '[]'::jsonb,
  expected text,
  detection jsonb not null default '{}'::jsonb,
  points integer not null default 10,
  teaches text[] not null default '{}'
);

-- ── deny-all RLS on everything ───────────────────────────────────────────

alter table buggyapi.ba_users enable row level security;
alter table buggyapi.ba_api_keys enable row level security;
alter table buggyapi.ba_sessions enable row level security;
alter table buggyapi.ba_oauth_clients enable row level security;
alter table buggyapi.ba_projects enable row level security;
alter table buggyapi.ba_tickets enable row level security;
alter table buggyapi.ba_uploads enable row level security;
alter table buggyapi.ba_rate_counters enable row level security;
alter table buggyapi.ba_sandbox_state enable row level security;
alter table buggyapi.ba_bug_manifest enable row level security;

-- ── indexes ──────────────────────────────────────────────────────────────

create index ba_users_sandbox on buggyapi.ba_users (sandbox_id);
create index ba_api_keys_sandbox on buggyapi.ba_api_keys (sandbox_id);
create index ba_sessions_sandbox on buggyapi.ba_sessions (sandbox_id);
create index ba_oauth_clients_sandbox on buggyapi.ba_oauth_clients (sandbox_id);
create index ba_projects_sandbox on buggyapi.ba_projects (sandbox_id);
create index ba_tickets_sandbox on buggyapi.ba_tickets (sandbox_id);
create index ba_tickets_project on buggyapi.ba_tickets (project_id);
create index ba_uploads_sandbox on buggyapi.ba_uploads (sandbox_id);
-- window_start inside the PK isn't leading — rate checks filter on it directly
create index ba_rate_counters_window on buggyapi.ba_rate_counters (sandbox_id, window_start);

-- ── sandbox provisioning / reset ─────────────────────────────────────────
-- Same shape as buggyshop.reset_sandbox: transactional, advisory-locked,
-- SECURITY DEFINER + empty search_path, service-role only.

create or replace function buggyapi.reset_buggyapi_sandbox(p_sandbox_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id buggyapi.ba_users.id%type;
  v_member_id buggyapi.ba_users.id%type;
  v_project_id buggyapi.ba_projects.id%type;
begin
  if not exists (select 1 from public.sandboxes s where s.id = p_sandbox_id) then
    raise exception 'sandbox % does not exist', p_sandbox_id;
  end if;

  -- serialize concurrent resets of the same sandbox (namespaced away from
  -- buggyshop's lock so cross-app resets don't contend)
  perform pg_advisory_xact_lock(hashtextextended('buggyapi:' || p_sandbox_id::text, 0));

  -- wipe everything sandbox-scoped
  delete from buggyapi.ba_uploads        where sandbox_id = p_sandbox_id;
  delete from buggyapi.ba_tickets        where sandbox_id = p_sandbox_id;
  delete from buggyapi.ba_projects       where sandbox_id = p_sandbox_id;
  delete from buggyapi.ba_sessions       where sandbox_id = p_sandbox_id;
  delete from buggyapi.ba_api_keys       where sandbox_id = p_sandbox_id;
  delete from buggyapi.ba_oauth_clients  where sandbox_id = p_sandbox_id;
  delete from buggyapi.ba_users          where sandbox_id = p_sandbox_id;
  delete from buggyapi.ba_rate_counters  where sandbox_id = p_sandbox_id;
  delete from buggyapi.ba_sandbox_state  where sandbox_id = p_sandbox_id;

  -- seed users (docs + lessons reference these exact creds)
  insert into buggyapi.ba_users (sandbox_id, name, email, password, role, is_seed)
  values (p_sandbox_id, 'Asha Tester', 'asha@taskflight.test', 'TestPass123!', 'admin', true)
  returning id into v_admin_id;

  insert into buggyapi.ba_users (sandbox_id, name, email, password, role, is_seed)
  values (p_sandbox_id, 'Ravi Dev', 'ravi@taskflight.test', 'DevPass123!', 'member', true)
  returning id into v_member_id;

  -- seed API key (printed on the BuggyAPI docs landing page after handoff)
  insert into buggyapi.ba_api_keys (sandbox_id, ba_user_id, key, label, is_seed)
  values (p_sandbox_id, v_admin_id,
          'bak_' || replace(gen_random_uuid()::text, '-', ''), 'seed', true);

  -- seed OAuth client (flows land in Phase 1b; client exists from day one)
  insert into buggyapi.ba_oauth_clients (sandbox_id, client_id, client_secret, redirect_uri, is_seed)
  values (p_sandbox_id,
          'tfc_' || replace(gen_random_uuid()::text, '-', ''),
          'tfs_' || replace(gen_random_uuid()::text, '-', ''),
          'https://example.com/callback', true);

  -- seed project + tickets: enough rows that pagination/filtering/sorting
  -- exercises have something to page through
  insert into buggyapi.ba_projects (sandbox_id, key, name, description, is_seed)
  values (p_sandbox_id, 'TF', 'TaskFlight',
          'Flight-ops task tracker — the practice project.', true)
  returning id into v_project_id;

  insert into buggyapi.ba_tickets
    (sandbox_id, project_id, number, title, status, priority, assignee_id, labels, is_seed)
  values
    (p_sandbox_id, v_project_id, 1,  'Fix gate assignment race condition',      'open',        'urgent', v_admin_id,  '{backend,bug}', true),
    (p_sandbox_id, v_project_id, 2,  'Add boarding-pass QR validation',         'in_progress', 'high',   v_member_id, '{feature}',     true),
    (p_sandbox_id, v_project_id, 3,  'Crew roster export times out',            'open',        'high',   null,        '{backend,perf}',true),
    (p_sandbox_id, v_project_id, 4,  'Update baggage fee copy',                 'done',        'low',    v_member_id, '{content}',     true),
    (p_sandbox_id, v_project_id, 5,  'Seat map renders overlapping rows',       'blocked',     'medium', v_admin_id,  '{frontend,bug}',true),
    (p_sandbox_id, v_project_id, 6,  'Migrate check-in service to v2 API',      'in_progress', 'medium', v_member_id, '{backend}',     true),
    (p_sandbox_id, v_project_id, 7,  'Delayed-flight notification retries',     'open',        'medium', null,        '{backend}',     true),
    (p_sandbox_id, v_project_id, 8,  'Lounge access rules for codeshares',      'open',        'low',    null,        '{feature}',     true),
    (p_sandbox_id, v_project_id, 9,  'Fix timezone bug in departure boards',    'cancelled',   'high',   v_admin_id,  '{frontend,bug}',true),
    (p_sandbox_id, v_project_id, 10, 'Add e2e coverage for rebooking flow',     'open',        'medium', v_member_id, '{testing}',     true),
    (p_sandbox_id, v_project_id, 11, 'Refund pipeline drops currency decimals', 'open',        'urgent', v_admin_id,  '{backend,bug}', true),
    (p_sandbox_id, v_project_id, 12, 'Dark mode for ops dashboard',             'open',        'low',    null,        '{frontend}',    true);

  insert into buggyapi.ba_sandbox_state (sandbox_id, counters)
  values (p_sandbox_id, '{}'::jsonb);
end;
$$;

create or replace function buggyapi.provision_buggyapi_sandbox(p_sandbox_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform buggyapi.reset_buggyapi_sandbox(p_sandbox_id);
end;
$$;

-- belt-and-braces: SECURITY DEFINER functions default to PUBLIC execute —
-- revoke it; only service_role may call these
revoke execute on function buggyapi.reset_buggyapi_sandbox(uuid) from public, anon, authenticated;
revoke execute on function buggyapi.provision_buggyapi_sandbox(uuid) from public, anon, authenticated;
