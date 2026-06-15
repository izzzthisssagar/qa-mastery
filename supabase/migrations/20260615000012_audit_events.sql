-- 0012 — audit_events: append-only trail of sensitive server-action events
-- (entitlement grants, score writes, code runs). Service-role write only; RLS
-- enabled with NO policies, so it's queried server-side by admins and never
-- exposed to learners. Supports the SOC2 CC6/CC7 logging controls flagged in
-- the security review.

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_events enable row level security;
-- No policies on purpose: only the service role (server actions, admin queries)
-- reads or writes this table. RLS-on + no-policy = deny-all to anon/authenticated.

create index audit_events_actor_created on public.audit_events (actor_id, created_at desc);
create index audit_events_action_created on public.audit_events (action, created_at desc);
