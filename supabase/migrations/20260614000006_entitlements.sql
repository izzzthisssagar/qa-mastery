-- 0006 — entitlements: who has paid access (Pro).
--
-- Same posture as the score tables (invariant 2): a learner reads their own
-- entitlements but cannot grant themselves one — rows are written by the
-- service role (a mock "upgrade" action today, a billing webhook later).

create table public.entitlements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('pro')),
  granted_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.entitlements enable row level security;

create policy "users read own entitlements"
  on public.entitlements for select
  using ((select auth.uid()) = user_id);
-- no insert/update policy: entitlements are granted by the service role only
